from agency_swarm.tools import BaseTool
from pydantic import Field
import os
from pathlib import Path
from typing import Optional
from bs4 import BeautifulSoup
from dotenv import load_dotenv

load_dotenv()

# Cache directory for HTML menus
CACHE_DIR = Path(__file__).resolve().parent.parent.parent / "cache" / "menus"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

# Default menu filename
DEFAULT_MENU_FILE = "menu.html"

# Try to import Supabase client
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    Client = None


class ReadHTMLPart(BaseTool):
    """
    Reads a specific part or section from the HTML menu file OR from the database.
    
    If menu_id is provided, reads from database (recommended for Cloud Run/production).
    If menu_id is not provided, reads from local file system (for local development).
    
    Useful for checking what content exists before updating or for reading specific sections.
    """
    part: str = Field(
        default="all",
        description="Which part to read: 'all' (entire file), 'header', 'sections', 'footer', 'styles', or a specific section name like 'Appetizers' or 'Main Courses'."
    )
    filename: str = Field(
        default=DEFAULT_MENU_FILE,
        description="The HTML filename to read from (only used if menu_id not provided). Defaults to 'menu.html'."
    )
    menu_id: Optional[str] = Field(
        default=None, description="UUID of the menu to read HTML from database. If provided, reads from database instead of file system. Recommended for production/Cloud Run."
    )
    field_name: str = Field(
        default="html_content", description="Database field name to read from (only used if menu_id provided). Defaults to 'html_content'."
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

    def _read_html_from_db(self, menu_id: str) -> Optional[str]:
        """Read HTML content from database"""
        if not SUPABASE_AVAILABLE:
            return None
        
        supabase = self._get_supabase_client()
        if not supabase:
            return None
        
        try:
            # Try multiple field names
            field_names_to_try = [self.field_name, "html_content", "html", "menu_html"]
            
            for field_name in field_names_to_try:
                try:
                    menu_response = supabase.table("menus").select(f"id, name, {field_name}").eq("id", menu_id).single().execute()
                    if menu_response.data:
                        html_content = menu_response.data.get(field_name)
                        if html_content:
                            return html_content
                except Exception:
                    continue
            
            return None
        except Exception:
            return None

    def run(self):
        """
        Step 1: Check if menu_id provided (use database) or filename (use file system)
        Step 2a (DB): Read from database
        Step 2b (File): Read from file system
        Step 3: Parse and extract requested part
        Step 4: Return the requested part
        """
        try:
            html_content = None
            
            # Try to get menu_id from context if not provided
            menu_id_to_use = self.menu_id
            if not menu_id_to_use and hasattr(self, '_context'):
                try:
                    menu_id_to_use = self._context.get("menu_id", None)
                except Exception:
                    pass
            
            # If menu_id available (from parameter or context), read from database
            if menu_id_to_use:
                if not SUPABASE_AVAILABLE:
                    return "Error: Supabase library not installed. Run: pip install supabase"
                
                html_content = self._read_html_from_db(menu_id_to_use)
                
                if html_content is None:
                    supabase = self._get_supabase_client()
                    if not supabase:
                        return "Error: Supabase credentials not found. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env"
                    
                    # Verify menu exists
                    try:
                        menu_response = supabase.table("menus").select("id, name").eq("id", menu_id_to_use).single().execute()
                        if not menu_response.data:
                            return f"Error: Menu with id '{menu_id_to_use}' not found in database."
                        menu_name = menu_response.data.get("name", "Unknown")
                        return f"Error: Menu '{menu_name}' found but HTML content is not stored in database. Use SaveHTMLFile with menu_id to save HTML first."
                    except Exception as e:
                        return f"Error: Could not read menu from database: {str(e)}"
            
            # Otherwise, read from file system (local development)
            if html_content is None:
                # Step 1: Sanitize filename
                if not self.filename.endswith('.html'):
                    self.filename = f"{self.filename}.html"
                
                filename = os.path.basename(self.filename)
                filename = filename.replace('/', '').replace('\\', '').replace('..', '')
                
                # Step 2: Create full file path
                file_path = CACHE_DIR / filename
                
                # Step 3: Check if file exists
                if not file_path.exists():
                    return f"Menu file '{filename}' not found. Use SaveHTMLFile to create a new menu."
                
                # Step 4: Read file content
                with open(file_path, 'r', encoding='utf-8') as f:
                    html_content = f.read()
            
            # Step 5: Extract requested part
            if not html_content:
                source = "database" if self.menu_id else "file system"
                return f"Error: No HTML content found in {source}."
            
            # Parse HTML
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Extract requested part
            if self.part.lower() == "all":
                source_note = f" (from database, menu_id: {menu_id_to_use})" if menu_id_to_use else f" (from file: {self.filename})"
                return f"Full menu content ({len(html_content)} characters){source_note}:\n\n{html_content}"
            
            if self.part.lower() == "header":
                header = soup.find('header') or soup.find('.menu-header')
                if header:
                    return f"Header section:\n\n{str(header)}"
                return "Header section not found in menu."
            
            elif self.part.lower() == "footer":
                footer = soup.find('footer') or soup.find('.menu-footer')
                if footer:
                    return f"Footer section:\n\n{str(footer)}"
                return "Footer section not found in menu."
            
            elif self.part.lower() == "styles":
                styles = soup.find('style')
                if styles:
                    return f"CSS Styles:\n\n{styles.string or str(styles)}"
                return "Styles section not found in menu."
            
            elif self.part.lower() == "sections":
                sections = soup.find_all('section', class_='menu-section')
                if sections:
                    result = f"Found {len(sections)} menu sections:\n\n"
                    for i, section in enumerate(sections, 1):
                        title = section.find('h2') or section.find('.section-title')
                        title_text = title.get_text() if title else f"Section {i}"
                        result += f"{i}. {title_text}\n"
                    return result
                return "No menu sections found."
            
            else:
                # Try to find a specific section by name
                sections = soup.find_all('section', class_='menu-section')
                for section in sections:
                    title = section.find('h2') or section.find('.section-title')
                    if title and self.part.lower() in title.get_text().lower():
                        return f"Section '{self.part}':\n\n{str(section)}"
                
                return f"Section '{self.part}' not found. Available sections: Use 'sections' to list all sections."
            
        except Exception as e:
            import traceback
            return f"Error reading HTML part: {str(e)}\n{traceback.format_exc()}"


if __name__ == "__main__":
    # Test the tool
    tool = ReadHTMLPart(part="all", filename="test_menu.html")
    result = tool.run()
    print(result)
