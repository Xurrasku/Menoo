from agency_swarm.tools import BaseTool
from agency_swarm import ToolOutputImage, ToolOutputText
from agency_swarm.tools.utils import tool_output_image_from_path
from pydantic import Field
import os
import json
from pathlib import Path
from typing import Dict, List, Any, Optional, Union
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

# Try to import chevron (Mustache template engine)
try:
    import chevron
    CHEVRON_AVAILABLE = True
except ImportError:
    CHEVRON_AVAILABLE = False


class PopulateMenuFromDB(BaseTool):
    """
    Populates a Mustache-style HTML menu template with menu data from the Supabase database.
    
    Uses a proper Mustache template engine (chevron) to render ANY template structure.
    Works with any CSS classes or HTML structure the agent generates.
    
    **IMPORTANT: This tool ONLY provides menu data (restaurant name, categories, dishes, prices).**
    **All design elements (logos, images, colors, fonts, styling) must be added by the agent in the template.**
    
    Simply provide either menu_id or restaurant_id to populate the template.
    
    **Provided Mustache variables (menu data from database):**
    - {{restaurantName}} - Restaurant name
    - {{#categories}}...{{/categories}} - Loop over categories
    - {{categoryName}} - Category name (inside categories loop)
    - {{#items}}...{{/items}} - Loop over items (inside categories loop)
    - {{itemName}} - Item/dish name
    - {{itemDescription}} - Item description (optional)
    - {{itemPrice}} - Price value
    - {{itemCurrency}} - Currency symbol
    
    **NOT provided (agent must add these in template):**
    - Logo URLs, images, or design elements (add from style analysis)
    - Colors, fonts, or typography (add in CSS from style analysis)
    - Layout or styling (design in template)
    """
    menu_id: Optional[str] = Field(
        default=None,
        description="UUID of the menu to retrieve. If not provided, will use restaurant_id to get default menu."
    )
    restaurant_id: Optional[str] = Field(
        default=None,
        description="UUID of the restaurant. If menu_id not provided, will fetch restaurant's default menu."
    )
    template_filename: str = Field(
        default="menu.html",
        description="Filename of the Mustache template to populate. Defaults to 'menu.html'."
    )
    output_filename: str = Field(
        default="menu-populated.html",
        description="Filename for the populated menu output. Defaults to 'menu-populated.html'."
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
    
    def _fetch_menu_from_supabase(self, supabase: Client, menu_id: str) -> Optional[Dict]:
        """Fetch menu data directly from Supabase"""
        try:
            # Fetch menu
            menu_response = supabase.table("menus").select("*").eq("id", menu_id).single().execute()
            if not menu_response.data:
                return None
            
            menu = menu_response.data
            restaurant_id = menu.get("restaurant_id") or menu.get("restaurantId")
            if not restaurant_id:
                return None
            
            # Fetch restaurant (only name needed - logo/images come from agent's style analysis)
            restaurant_response = supabase.table("restaurants").select("name").eq("id", restaurant_id).single().execute()
            restaurant_name = restaurant_response.data.get("name") if restaurant_response.data else None
            
            # Fetch categories with items (ordered by position)
            categories_response = supabase.table("categories").select("*, items(*)").eq("menu_id", menu_id).order("position", desc=False).execute()
            
            categories = []
            for category in categories_response.data:
                items = []
                category_items = category.get("items", [])
                for item in category_items:
                    is_visible = item.get("is_visible", item.get("isVisible", True))
                    if is_visible:
                        price_cents = item.get("price_cents", item.get("priceCents", 0))
                        items.append({
                            "id": item["id"],
                            "name": item["name"],
                            "description": item.get("description", ""),
                            "priceCents": price_cents,
                            "currency": item.get("currency", "EUR"),
                            "isVisible": is_visible
                        })
                
                categories.append({
                    "id": category["id"],
                    "name": category["name"],
                    "description": category.get("description", ""),
                    "dishes": items
                })
            
            return {
                "id": menu["id"],
                "name": menu["name"],
                "restaurantId": restaurant_id,
                "restaurantName": restaurant_name,
                "categories": categories
            }
        except Exception:
            return None
    
    def _fetch_default_menu_from_supabase(self, supabase: Client, restaurant_id: str) -> Optional[Dict]:
        """Fetch default menu for a restaurant"""
        try:
            menus_response = supabase.table("menus").select("*").eq("restaurant_id", restaurant_id).execute()
            if not menus_response.data:
                return None
            
            menus = menus_response.data
            default_menu = next((m for m in menus if m.get("is_default") or m.get("isDefault")), menus[0])
            return self._fetch_menu_from_supabase(supabase, default_menu["id"])
        except Exception:
            return None
    
    def _take_html_screenshot(self, html_path: Path) -> Optional[Path]:
        """Take a screenshot of the HTML file using Playwright"""
        try:
            from playwright.sync_api import sync_playwright
            
            screenshot_path = html_path.with_suffix('.png')
            absolute_path = html_path.resolve()
            file_url = absolute_path.as_uri()
            
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                page.set_viewport_size({"width": 1200, "height": 800})
                page.goto(file_url, wait_until="networkidle", timeout=30000)
                page.wait_for_timeout(2000)
                page.screenshot(path=str(screenshot_path), full_page=True)
                browser.close()
            
            return screenshot_path if screenshot_path.exists() else None
        except Exception:
            return None

    def _transform_to_template_data(self, menu: Dict) -> Dict:
        """
        Transform database menu data to match Mustache template variables.
        
        This creates a data structure that works with standard Mustache templates:
        - {{restaurantName}}
        - {{logoUrl}} - Logo URL (if available)
        - {{#categories}} ... {{categoryName}} ... {{#items}} ... {{/items}} ... {{/categories}}
        """
        restaurant_name = menu.get("restaurantName") or menu.get("name", "Restaurant")
        
        categories_data = []
        for category in menu.get("categories", []):
            items_data = []
            for dish in category.get("dishes", []):
                if dish.get("isVisible", True):
                    price_cents = dish.get("priceCents", 0)
                    price = price_cents / 100.0 if price_cents else 0.0
                    price_str = f"{price:.2f}".rstrip('0').rstrip('.')
                    
                    items_data.append({
                        "itemName": dish.get("name", ""),
                        "itemDescription": dish.get("description", ""),
                        "itemPrice": price_str,
                        "itemCurrency": dish.get("currency", "EUR"),
                        # Also provide without prefix for flexibility
                        "name": dish.get("name", ""),
                        "description": dish.get("description", ""),
                        "price": price_str,
                        "currency": dish.get("currency", "EUR"),
                    })
            
            categories_data.append({
                "categoryName": category.get("name", ""),
                "categoryDescription": category.get("description", ""),
                "items": items_data,
                # Also provide without prefix for flexibility
                "name": category.get("name", ""),
                "description": category.get("description", ""),
            })
        
        return {
            "restaurantName": restaurant_name,
            "categories": categories_data,
            # Also provide at root level for flexibility
            "restaurant": {
                "name": restaurant_name
            }
        }

    def run(self) -> Union[str, List[Union[ToolOutputImage, ToolOutputText]]]:
        """
        Populate a Mustache template with menu data from the database.
        
        Uses chevron (Mustache library) to properly render ANY template structure.
        """
        try:
            # Step 1: Validate inputs
            if not self.menu_id and not self.restaurant_id:
                return "Error: Either menu_id or restaurant_id must be provided"
            
            # Step 2: Check chevron is available
            if not CHEVRON_AVAILABLE:
                return "Error: chevron library not installed. Run: pip install chevron"
            
            # Step 3: Get Supabase client
            if not SUPABASE_AVAILABLE:
                return "Error: Supabase library not installed. Run: pip install supabase"
            
            supabase = self._get_supabase_client()
            if not supabase:
                return "Error: Supabase credentials not found. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env"
            
            # Step 4: Fetch menu data
            menu = None
            if self.menu_id:
                menu = self._fetch_menu_from_supabase(supabase, self.menu_id)
                if not menu:
                    return f"Error: Menu with id '{self.menu_id}' not found in database."
            elif self.restaurant_id:
                menu = self._fetch_default_menu_from_supabase(supabase, self.restaurant_id)
                if not menu:
                    return f"Error: No menu found for restaurant with id '{self.restaurant_id}'."
            
            if not menu:
                return "Error: Could not fetch menu data from database"
            
            # Step 5: Read the Mustache template
            template_path = CACHE_DIR / self.template_filename
            if not template_path.exists():
                return f"Error: Template file not found: {template_path}"
            
            with open(template_path, 'r', encoding='utf-8') as f:
                template_content = f.read()
            
            # Step 6: Transform data for template
            template_data = self._transform_to_template_data(menu)
            
            # Step 7: Render template using chevron (proper Mustache rendering)
            populated_html = chevron.render(template_content, template_data)
            
            # Step 8: Save populated HTML
            output_path = CACHE_DIR / self.output_filename
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(populated_html)
            
            # Step 9: Take screenshot
            screenshot_path = self._take_html_screenshot(output_path)
            
            # Step 10: Return result
            restaurant_name = template_data.get("restaurantName", "Unknown")
            categories_count = len(template_data.get("categories", []))
            total_items = sum(len(cat.get("items", [])) for cat in template_data.get("categories", []))
            
            result_data = {
                "success": True,
                "output_file": str(output_path),
                "restaurant_name": restaurant_name,
                "categories_count": categories_count,
                "total_items": total_items,
                "message": f"Menu populated successfully with {categories_count} categories and {total_items} items"
            }
            
            if screenshot_path and screenshot_path.exists():
                summary_text = json.dumps(result_data, indent=2)
                summary_text += f"\n\n✓ Screenshot saved: {screenshot_path.name}"
                summary_text += "\n\n**IMPORTANT: The populated menu is displayed above as an image.**"
                summary_text += "\n**You MUST visually review the menu image and check for:**"
                summary_text += "\n- Layout issues (spacing, alignment, overflow)"
                summary_text += "\n- Design inconsistencies (colors, fonts, styling)"
                summary_text += "\n- Missing or broken images/logos"
                summary_text += "\n- Text formatting issues (truncation, wrapping)"
                summary_text += "\n- Responsive design problems"
                summary_text += "\n- Any other visual imperfections"
                summary_text += "\n\n**If you find any issues, update the template (menu.html) and re-populate.**"
                return [
                    tool_output_image_from_path(screenshot_path, detail="low"),  # Use "low" to avoid size limits
                    ToolOutputText(text=summary_text)
                ]
            else:
                result_data["screenshot_note"] = "Screenshot could not be generated"
                return json.dumps(result_data, indent=2)
            
        except Exception as e:
            import traceback
            return f"Error populating menu: {str(e)}\n{traceback.format_exc()}"


if __name__ == "__main__":
    # Test the tool
    print("Testing PopulateMenuFromDB with chevron Mustache rendering...")
    tool = PopulateMenuFromDB(
        menu_id="a24e318f-dcee-418d-b56c-acd6cdf96e88"
    )
    result = tool.run()
    if isinstance(result, list):
        print("✓ Success! Screenshot and text returned.")
        for item in result:
            if hasattr(item, 'text'):
                print(item.text)
    else:
        print(result)
