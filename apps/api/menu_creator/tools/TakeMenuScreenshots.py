from agency_swarm.tools import BaseTool
from pydantic import Field
from typing import List, Dict, Optional
from pathlib import Path
import json
from dotenv import load_dotenv

load_dotenv()

# Cache directory for screenshots
CACHE_IMAGES_DIR = Path(__file__).resolve().parent.parent.parent / "cache" / "images"
CACHE_IMAGES_DIR.mkdir(parents=True, exist_ok=True)


class TakeMenuScreenshots(BaseTool):
    """
    Takes screenshots of menu page URLs. Use this after FindMenuFiles identifies menu URLs.
    Saves screenshots to cache/images directory.
    """
    menu_urls: str = Field(
        ..., description="JSON string array of menu URLs to screenshot. Format: [{\"url\": \"https://...\", \"type\": \"page\"}, ...]"
    )

    def run(self):
        """
        Step 1: Parse menu URLs from JSON
        Step 2: Take screenshot of each URL using Playwright
        Step 3: Save screenshots to cache/images directory
        Step 4: Return list of screenshot paths
        """
        try:
            # Step 1: Parse URLs
            urls_data = json.loads(self.menu_urls) if isinstance(self.menu_urls, str) else self.menu_urls
            
            if not isinstance(urls_data, list):
                return "Error: menu_urls must be a JSON array"
            
            screenshots = []
            
            # Step 2-3: Take screenshots
            for i, url_item in enumerate(urls_data):
                if isinstance(url_item, dict):
                    url = url_item.get("url", "")
                elif isinstance(url_item, str):
                    url = url_item
                else:
                    continue
                
                if not url.startswith("http"):
                    continue
                
                screenshot_path = self._take_screenshot(url, i)
                if screenshot_path:
                    screenshots.append({
                        "url": url,
                        "screenshot_path": str(screenshot_path),
                        "screenshot_filename": screenshot_path.name
                    })
            
            # Step 4: Return results
            result = {
                "screenshots_taken": len(screenshots),
                "screenshots": screenshots
            }
            
            return json.dumps(result, indent=2)
            
        except json.JSONDecodeError as e:
            return f"Error parsing menu URLs JSON: {str(e)}"
        except Exception as e:
            return f"Error taking screenshots: {str(e)}"

    def _take_screenshot(self, url: str, index: int) -> Optional[Path]:
        """Take a screenshot of the given URL using Playwright"""
        try:
            from playwright.sync_api import sync_playwright
            from urllib.parse import urlparse
            
            # Create filename from URL
            parsed = urlparse(url)
            domain = parsed.netloc.replace('www.', '').replace('.', '_')[:50]
            filename = f"menu_screenshot_{domain}_{index}.png"
            screenshot_path = CACHE_IMAGES_DIR / filename
            
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                page.goto(url, wait_until="networkidle", timeout=15000)
                # Take full page screenshot
                page.screenshot(path=str(screenshot_path), full_page=True)
                browser.close()
            
            return screenshot_path
            
        except ImportError:
            return None
        except Exception as e:
            return None


if __name__ == "__main__":
    tool = TakeMenuScreenshots(menu_urls='[{"url": "https://example.com/menu", "type": "page"}]')
    print("Testing TakeMenuScreenshots tool...")
    print("Note: Requires Playwright browsers installed: playwright install chromium")
