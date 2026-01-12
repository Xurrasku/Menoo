from agency_swarm.tools import BaseTool
from pydantic import Field
import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv
from bs4 import BeautifulSoup

load_dotenv()

# Cache directory for HTML menus
CACHE_DIR = Path(__file__).resolve().parent.parent.parent / "cache" / "menus"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

# Mobile-first hardening baseline (injected deterministically on save/update)
MOBILE_BASELINE_MARKER = "menoo-mobile-baseline v1"
MOBILE_VIEWPORT_CONTENT = "width=device-width, initial-scale=1, viewport-fit=cover"
MOBILE_BASELINE_CSS = f"""/* {MOBILE_BASELINE_MARKER}
   Guarantees:
   - Correct viewport on common mobile devices (incl. iPhone safe areas via viewport-fit)
   - No accidental horizontal scrolling caused by long content or media
   - Predictable box model & iOS text sizing behavior
*/
*, *::before, *::after {{ box-sizing: border-box; }}
html {{ -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }}
body {{ margin: 0; overflow-x: hidden; }}
img, svg, video, canvas {{ max-width: 100%; height: auto; }}
h1, h2, h3, h4, h5, h6, p, li, dt, dd {{ overflow-wrap: anywhere; }}
pre, code {{ white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere; }}
"""


def ensure_mobile_optimized_html(html_content: str) -> str:
    """
    Ensure the HTML includes a mobile-correct viewport + a minimal CSS baseline.
    This is intentionally deterministic so every generated menu "fits perfectly" on mobile screens
    (no horizontal overflow primitives, safe-area compatible, mobile-first defaults).
    """
    try:
        soup = BeautifulSoup(html_content, "html.parser")
        head = soup.find("head")
        if head is None:
            return html_content

        # 1) Ensure viewport meta exists + includes viewport-fit=cover (safe area support).
        viewport_meta = head.find("meta", attrs={"name": "viewport"})
        if viewport_meta is None:
            viewport_meta = soup.new_tag("meta")
            viewport_meta.attrs["name"] = "viewport"
            # Insert after charset meta if present, otherwise at start of head.
            charset_meta = head.find("meta", attrs={"charset": True})
            if charset_meta is not None:
                charset_meta.insert_after(viewport_meta)
            else:
                head.insert(0, viewport_meta)
        viewport_meta.attrs["content"] = MOBILE_VIEWPORT_CONTENT

        # 2) Ensure our baseline CSS is present (first style tag in <head>, or create one).
        existing_marker = head.find(string=lambda s: isinstance(s, str) and MOBILE_BASELINE_MARKER in s)
        if existing_marker is None:
            style_tag = head.find("style")
            if style_tag is None:
                style_tag = soup.new_tag("style")
                style_tag.string = MOBILE_BASELINE_CSS
                head.append(style_tag)
            else:
                existing_css = style_tag.string if style_tag.string is not None else style_tag.get_text()
                style_tag.clear()
                style_tag.append(MOBILE_BASELINE_CSS + "\n" + (existing_css or ""))

        return str(soup)
    except Exception:
        # Never block saving because of a hardening step; fall back to original HTML.
        return html_content

# Try to import Supabase client
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    Client = None


class SaveHTMLFile(BaseTool):
    """
    Saves HTML content to a file in the cache/menus directory OR directly to the database.
    
    If menu_id is provided, saves to database (recommended for Cloud Run/production).
    If menu_id is not provided, saves to local file system (for local development).
    
    For Cloud Run deployments, always provide menu_id to ensure persistence across instances.
    """
    html_content: str = Field(
        ..., description="The complete HTML content to save as a string."
    )
    filename: str = Field(
        default="menu.html", description="The filename to save the HTML to (only used if menu_id not provided). Defaults to 'menu.html'. Should include .html extension."
    )
    menu_id: Optional[str] = Field(
        default=None, description="UUID of the menu to save HTML to in database. If provided, saves to database instead of file system. Recommended for production/Cloud Run."
    )
    field_name: str = Field(
        default="html_content", description="Database field name to store HTML (only used if menu_id provided). Defaults to 'html_content'."
    )

    def _get_supabase_client(self) -> Optional[Client]:
        """Create Supabase client from environment variables"""
        if not SUPABASE_AVAILABLE:
            return None
        
        supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not supabase_key:
            return None
        
        try:
            return create_client(supabase_url, supabase_key)
        except Exception:
            return None

    def run(self):
        """
        Step 1: Check if menu_id provided (use database) or retrieve from context
        Step 2: If no menu_id, check filename (use file system)
        Step 3a (DB): Save to database
        Step 3b (File): Save to file system
        Step 4: Return success message
        """
        try:
            # Always harden the HTML for mobile before saving anywhere.
            self.html_content = ensure_mobile_optimized_html(self.html_content)

            # Try to get menu_id from context if not provided
            menu_id_to_use = self.menu_id
            if not menu_id_to_use and hasattr(self, '_context'):
                try:
                    menu_id_to_use = self._context.get("menu_id", None)
                except Exception:
                    pass
            
            # If menu_id available (from parameter or context), save to database
            if menu_id_to_use:
                if not SUPABASE_AVAILABLE:
                    return "Error: Supabase library not installed. Run: pip install supabase"
                
                supabase = self._get_supabase_client()
                if not supabase:
                    return "Error: Supabase credentials not found. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env"
                
                # Verify menu exists
                try:
                    menu_response = supabase.table("menus").select("id, name").eq("id", menu_id_to_use).single().execute()
                    if not menu_response.data:
                        return f"Error: Menu with id '{menu_id_to_use}' not found in database."
                    menu_name = menu_response.data.get("name", "Unknown")
                except Exception as e:
                    return f"Error: Could not verify menu exists: {str(e)}"
                
                # Try to update menu with HTML content
                field_names_to_try = [self.field_name, "html_content", "html", "menu_html"]
                update_success = False
                actual_field = self.field_name
                
                for field_name in field_names_to_try:
                    try:
                        update_data = {field_name: self.html_content}
                        update_response = supabase.table("menus").update(update_data).eq("id", menu_id_to_use).execute()
                        if update_response.data:
                            update_success = True
                            actual_field = field_name
                            break
                    except Exception:
                        continue
                
                if not update_success:
                    return f"Error: Could not save HTML to database. Tried fields: {', '.join(field_names_to_try)}. You may need to add an '{self.field_name}' column to the menus table."
                
                return (
                    f"✓ HTML saved successfully to database!\n\n"
                    f"Menu ID: {menu_id_to_use}\n"
                    f"Menu Name: {menu_name}\n"
                    f"Field: {actual_field}\n"
                    f"HTML Size: {len(self.html_content):,} characters\n\n"
                    f"The HTML is now stored in the database and will persist across Cloud Run instances."
                )
            
            # Otherwise, save to file system (local development)
            # Step 1: Ensure filename has .html extension
            if not self.filename.endswith('.html'):
                self.filename = f"{self.filename}.html"
            
            # Step 2: Sanitize filename to prevent directory traversal
            filename = os.path.basename(self.filename)
            # Remove any path separators and dangerous characters
            filename = filename.replace('/', '').replace('\\', '').replace('..', '')
            
            # Step 3: Create full file path
            file_path = CACHE_DIR / filename
            
            # Step 4: Write HTML content to file
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(self.html_content)
            
            # Step 5: Return success message
            return (
                f"HTML file saved successfully to: {file_path}\n"
                f"File size: {len(self.html_content)} characters\n\n"
                f"Note: For Cloud Run/production, provide menu_id to save to database instead."
            )
            
        except Exception as e:
            return f"Error saving HTML: {str(e)}"


if __name__ == "__main__":
    # Test the tool
    test_html = """<!DOCTYPE html>
<html>
<head><title>Test Menu</title></head>
<body><h1>Test Menu</h1></body>
</html>"""
    
    tool = SaveHTMLFile(html_content=test_html, filename="test_menu.html")
    result = tool.run()
    print(result)
