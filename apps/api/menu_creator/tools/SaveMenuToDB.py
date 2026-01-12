from agency_swarm.tools import BaseTool
from pydantic import Field
import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

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


class SaveMenuToDB(BaseTool):
    """
    Saves HTML menu content to the Supabase database.
    
    This tool stores the final HTML menu in the database so it can be retrieved later.
    The HTML content is saved to the menus table under the 'html_content' or 'html' field.
    
    You can provide either:
    - The HTML content directly as a string
    - The filename of an HTML file in cache/menus/ directory
    
    The menu will be updated with the HTML content in the database.
    """
    menu_id: str = Field(
        ..., description="UUID of the menu to update with HTML content."
    )
    html_content: Optional[str] = Field(
        default=None,
        description="The HTML content as a string. If not provided, will read from html_filename."
    )
    html_filename: Optional[str] = Field(
        default=None,
        description="Filename of the HTML file in cache/menus/ directory. Used if html_content is not provided. Defaults to 'menu-populated.html'."
    )
    field_name: str = Field(
        default="html_content",
        description="Database field name to store HTML. Options: 'html_content', 'html', or 'menu_html'. Defaults to 'html_content'."
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
        Step 1: Get HTML content (from parameter or file)
        Step 2: Validate menu_id exists in database
        Step 3: Update menu record with HTML content
        Step 4: Return success message with menu details
        """
        try:
            # Step 1: Get HTML content
            html_to_save = self.html_content
            
            if not html_to_save:
                # Read from file
                filename = self.html_filename or "menu-populated.html"
                file_path = CACHE_DIR / filename
                
                if not file_path.exists():
                    return f"Error: HTML file not found: {file_path}. Please provide html_content or ensure the file exists."
                
                with open(file_path, 'r', encoding='utf-8') as f:
                    html_to_save = f.read()
            
            if not html_to_save:
                return "Error: No HTML content provided and file is empty."
            
            # Step 2: Get Supabase client
            if not SUPABASE_AVAILABLE:
                return "Error: Supabase library not installed. Run: pip install supabase"
            
            supabase = self._get_supabase_client()
            if not supabase:
                return "Error: Supabase credentials not found. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env"
            
            # Step 3: Verify menu exists
            try:
                menu_response = supabase.table("menus").select("id, name, restaurant_id").eq("id", self.menu_id).single().execute()
                if not menu_response.data:
                    return f"Error: Menu with id '{self.menu_id}' not found in database."
                
                menu_name = menu_response.data.get("name", "Unknown")
            except Exception as e:
                return f"Error: Could not verify menu exists: {str(e)}"
            
            # Step 4: Update menu with HTML content
            # Try multiple field names in case the schema uses different names
            update_data = {}
            
            # Try the specified field name first
            field_names_to_try = [self.field_name, "html_content", "html", "menu_html"]
            
            # Update with the first available field name
            # Note: We'll try to update, and if it fails, we'll try other field names
            update_success = False
            last_error = None
            
            for field_name in field_names_to_try:
                try:
                    update_data = {field_name: html_to_save}
                    update_response = supabase.table("menus").update(update_data).eq("id", self.menu_id).execute()
                    
                    if update_response.data:
                        update_success = True
                        actual_field = field_name
                        break
                except Exception as e:
                    last_error = str(e)
                    continue
            
            if not update_success:
                # If all field names failed, try a generic update
                # This might work if the field doesn't exist yet (depending on Supabase settings)
                try:
                    update_data = {self.field_name: html_to_save}
                    update_response = supabase.table("menus").update(update_data).eq("id", self.menu_id).execute()
                    update_success = True
                    actual_field = self.field_name
                except Exception as e:
                    return f"Error: Could not save HTML to database. Tried fields: {', '.join(field_names_to_try)}. Last error: {str(e)}. You may need to add an '{self.field_name}' column to the menus table."
            
            # Step 5: Return success message
            html_size = len(html_to_save)
            return (
                f"✓ Menu HTML saved successfully to database!\n\n"
                f"Menu ID: {self.menu_id}\n"
                f"Menu Name: {menu_name}\n"
                f"Field: {actual_field}\n"
                f"HTML Size: {html_size:,} characters\n\n"
                f"The menu HTML is now stored in the database and can be retrieved later."
            )
            
        except Exception as e:
            import traceback
            return f"Error saving menu to database: {str(e)}\n{traceback.format_exc()}"


if __name__ == "__main__":
    # Test the tool
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python SaveMenuToDB.py <menu_id> [html_filename]")
        print("Example: python SaveMenuToDB.py 123e4567-e89b-12d3-a456-426614174000 menu-populated.html")
        sys.exit(1)
    
    menu_id = sys.argv[1]
    html_filename = sys.argv[2] if len(sys.argv) > 2 else "menu-populated.html"
    
    tool = SaveMenuToDB(menu_id=menu_id, html_filename=html_filename)
    result = tool.run()
    print(result)
