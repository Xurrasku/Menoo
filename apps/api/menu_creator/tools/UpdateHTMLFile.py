from agency_swarm.tools import BaseTool
from pydantic import Field
import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

# Import mobile hardening helper.
# Some tests dynamically load this module without package context, so we need fallbacks.
try:
    from .SaveHTMLFile import ensure_mobile_optimized_html  # type: ignore
except Exception:  # pragma: no cover
    try:
        from menu_creator.tools.SaveHTMLFile import ensure_mobile_optimized_html  # type: ignore
    except Exception:  # pragma: no cover
        from SaveHTMLFile import ensure_mobile_optimized_html  # type: ignore

load_dotenv()

# Cache directory for HTML menus
CACHE_DIR = Path(__file__).resolve().parent.parent.parent / "cache" / "menus"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

# Try to import Supabase client
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    Client = None


class UpdateHTMLFile(BaseTool):
    """
    Updates an existing HTML file in the cache/menus directory OR updates HTML in the database.
    
    If menu_id is provided, updates database (recommended for Cloud Run/production).
    If menu_id is not provided, updates local file system (for local development).
    
    For Cloud Run deployments, always provide menu_id to ensure persistence across instances.
    """
    html_content: str = Field(
        ..., description="The new HTML content to replace the existing content."
    )
    filename: str = Field(
        default="menu.html", description="The filename to update (only used if menu_id not provided). Defaults to 'menu.html'. Should include .html extension."
    )
    menu_id: Optional[str] = Field(
        default=None, description="UUID of the menu to update HTML in database. If provided, updates database instead of file system. Recommended for production/Cloud Run."
    )
    field_name: str = Field(
        default="html_content", description="Database field name to update (only used if menu_id provided). Defaults to 'html_content'."
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
        Step 3a (DB): Update database
        Step 3b (File): Update file system
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
            
            # If menu_id available (from parameter or context), update database
            if menu_id_to_use:
                if not SUPABASE_AVAILABLE:
                    return "Error: Supabase library not installed. Run: pip install supabase"
                
                supabase = self._get_supabase_client()
                if not supabase:
                    return "Error: Supabase credentials not found. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env"
                
                # Verify menu exists and get current HTML
                try:
                    menu_response = supabase.table("menus").select("id, name").eq("id", menu_id_to_use).single().execute()
                    if not menu_response.data:
                        return f"Error: Menu with id '{menu_id_to_use}' not found in database."
                    menu_name = menu_response.data.get("name", "Unknown")
                except Exception as e:
                    return f"Error: Could not verify menu exists: {str(e)}"
                
                # Update menu with new HTML content
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
                    return f"Error: Could not update HTML in database. Tried fields: {', '.join(field_names_to_try)}. You may need to add an '{self.field_name}' column to the menus table."
                
                return (
                    f"✓ HTML updated successfully in database!\n\n"
                    f"Menu ID: {menu_id_to_use}\n"
                    f"Menu Name: {menu_name}\n"
                    f"Field: {actual_field}\n"
                    f"New HTML Size: {len(self.html_content):,} characters"
                )
            
            # Otherwise, update file system (local development)
            # Step 1: Ensure filename has .html extension
            if not self.filename.endswith('.html'):
                self.filename = f"{self.filename}.html"
            
            # Step 2: Sanitize filename
            filename = os.path.basename(self.filename)
            filename = filename.replace('/', '').replace('\\', '').replace('..', '')
            
            # Step 3: Create full file path
            file_path = CACHE_DIR / filename
            
            # Step 4: Check if file exists
            if not file_path.exists():
                return f"Error: File '{filename}' not found. Use SaveHTMLFile to create a new file."
            
            # Step 5: Write new content
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(self.html_content)
            
            return (
                f"HTML file updated successfully: {file_path}\n"
                f"New file size: {len(self.html_content)} characters\n\n"
                f"Note: For Cloud Run/production, provide menu_id to update database instead."
            )
            
        except Exception as e:
            return f"Error updating HTML: {str(e)}"


if __name__ == "__main__":
    # Test the tool
    test_html = """<!DOCTYPE html>
<html>
<head><title>Updated Menu</title></head>
<body><h1>Updated Menu</h1></body>
</html>"""
    
    tool = UpdateHTMLFile(filename="test_menu.html", html_content=test_html)
    result = tool.run()
    print(result)
