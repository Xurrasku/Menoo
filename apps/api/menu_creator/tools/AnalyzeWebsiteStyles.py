from agency_swarm.tools import BaseTool
from pydantic import Field
import os
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import json
import re
from typing import Dict, List, Any, Optional
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Cache directory for screenshots
CACHE_IMAGES_DIR = Path(__file__).resolve().parent.parent.parent / "cache" / "images"
CACHE_IMAGES_DIR.mkdir(parents=True, exist_ok=True)

# Menu-related keywords in multiple languages
MENU_KEYWORDS = [
    # English
    "menu", "carta", "card", "food menu", "dining menu", "restaurant menu",
    # Spanish
    "carta", "menú", "carta de comida", "menú del restaurante",
    # French
    "menu", "carte", "carte du restaurant",
    # Italian
    "menu", "carta", "menù", "carta del ristorante",
    # Portuguese
    "cardápio", "menu", "carta",
    # German
    "speisekarte", "menu", "karte",
    # Other common variations
    "food", "dishes", "platos", "piatti"
]


class AnalyzeWebsiteStyles(BaseTool):
    """
    Analyzes a restaurant website to extract comprehensive style information including:
    - Color palette (primary, secondary, accent colors)
    - Typography (font families, sizes, weights)
    - Images (logos, hero images, background images)
    - CSS styles and design patterns
    - Layout structure and spacing
    - Digital menu detection and screenshots (searches for menu pages in multiple languages)
    """
    website_url: str = Field(
        ..., description="The URL of the restaurant website to analyze. Must include http:// or https://"
    )
    take_screenshots: bool = Field(
        default=True, description="Whether to search for menu pages and take screenshots. Defaults to True."
    )

    def run(self):
        """
        Step 1: Fetch the website HTML content
        Step 2: Parse HTML and extract CSS styles
        Step 3: Extract color palette from CSS and images
        Step 4: Extract typography information
        Step 5: Extract images (logos, backgrounds, etc.)
        Step 6: Analyze layout patterns
        Step 7: Search for menu pages and take screenshots (if enabled)
        Step 8: Return comprehensive style analysis as JSON with menu screenshots
        """
        try:
            # Step 1: Fetch website content
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            response = requests.get(self.website_url, headers=headers, timeout=10)
            response.raise_for_status()
            
            # Step 2: Parse HTML
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Step 3: Extract CSS styles
            css_styles = self._extract_css_styles(soup, self.website_url)
            
            # Step 4: Extract colors
            colors = self._extract_colors(soup, css_styles)
            
            # Step 5: Extract typography
            typography = self._extract_typography(soup, css_styles)
            
            # Step 6: Extract images
            images = self._extract_images(soup, self.website_url)
            
            # Step 7: Extract layout patterns
            layout = self._extract_layout_patterns(soup, css_styles)
            
            # Step 8: Search for menu pages and take screenshots
            # Note: Menu detection and file downloading should be done via FindMenuFiles tool first
            # This will take screenshots of URLs provided
            menu_screenshots = []
            if self.take_screenshots:
                menu_screenshots = self._take_screenshots_of_urls(soup, self.website_url)
            
            # Compile comprehensive style analysis
            style_analysis = {
                "website_url": self.website_url,
                "colors": colors,
                "typography": typography,
                "images": images,
                "layout": layout,
                "css_snippets": css_styles.get("key_styles", {}),
                "design_theme": self._determine_theme(colors, typography, layout),
                "menu_screenshots": menu_screenshots
            }
            
            return json.dumps(style_analysis, indent=2)
            
        except requests.RequestException as e:
            return f"Error fetching website: {str(e)}"
        except Exception as e:
            return f"Error analyzing website: {str(e)}"

    def _extract_css_styles(self, soup: BeautifulSoup, base_url: str) -> Dict[str, Any]:
        """Extract CSS styles from inline styles and linked stylesheets"""
        css_data = {
            "inline_styles": [],
            "external_stylesheets": [],
            "key_styles": {}
        }
        
        # Extract inline styles
        for tag in soup.find_all(style=True):
            css_data["inline_styles"].append({
                "tag": tag.name,
                "style": tag.get('style', '')
            })
        
        # Extract external stylesheets
        for link in soup.find_all('link', rel='stylesheet'):
            href = link.get('href', '')
            if href:
                full_url = urljoin(base_url, href)
                css_data["external_stylesheets"].append(full_url)
        
        # Extract style tags
        for style_tag in soup.find_all('style'):
            css_content = style_tag.string or ''
            css_data["key_styles"]["embedded_css"] = css_content[:5000]  # Limit size
            
        return css_data

    def _extract_colors(self, soup: BeautifulSoup, css_styles: Dict) -> Dict[str, List[str]]:
        """Extract color palette from CSS and inline styles"""
        colors_found = set()
        
        # Extract from inline styles
        for tag in soup.find_all(style=True):
            style_attr = tag.get('style', '')
            colors_found.update(self._parse_colors_from_css(style_attr))
        
        # Extract from embedded CSS
        if "embedded_css" in css_styles.get("key_styles", {}):
            css_content = css_styles["key_styles"]["embedded_css"]
            colors_found.update(self._parse_colors_from_css(css_content))
        
        # Extract from common color attributes
        for tag in soup.find_all(['div', 'section', 'header', 'body']):
            bg_color = tag.get('bgcolor') or tag.get('background-color')
            if bg_color:
                colors_found.add(bg_color)
        
        # Convert to lists and categorize
        color_list = list(colors_found)
        primary_colors = color_list[:3] if len(color_list) >= 3 else color_list
        secondary_colors = color_list[3:6] if len(color_list) >= 6 else []
        accent_colors = color_list[6:9] if len(color_list) >= 9 else []
        
        return {
            "primary": primary_colors,
            "secondary": secondary_colors,
            "accent": accent_colors,
            "all_colors": color_list[:20]  # Limit to 20 most common
        }

    def _parse_colors_from_css(self, css_text: str) -> List[str]:
        """Parse color values from CSS text"""
        colors = set()
        
        # Match hex colors (#rgb, #rrggbb, #rrggbbaa)
        hex_pattern = r'#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b'
        colors.update(re.findall(hex_pattern, css_text))
        
        # Match rgb/rgba colors
        rgb_pattern = r'rgba?\([^)]+\)'
        colors.update(re.findall(rgb_pattern, css_text))
        
        # Match named colors
        named_colors = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 
                       'purple', 'pink', 'gray', 'grey', 'brown', 'navy', 'teal']
        for color in named_colors:
            if color in css_text.lower():
                colors.add(color)
        
        # Convert hex matches back to full hex format
        hex_colors = []
        for match in re.findall(hex_pattern, css_text):
            if len(match) == 3:
                hex_colors.append(f"#{match[0]}{match[0]}{match[1]}{match[1]}{match[2]}{match[2]}")
            else:
                hex_colors.append(f"#{match}")
        
        return hex_colors + list(colors)

    def _extract_typography(self, soup: BeautifulSoup, css_styles: Dict) -> Dict[str, Any]:
        """Extract typography information"""
        fonts_found = set()
        font_sizes = []
        font_weights = []
        
        # Extract from inline styles
        for tag in soup.find_all(style=True):
            style_attr = tag.get('style', '')
            
            # Extract font-family
            font_match = re.search(r'font-family:\s*([^;]+)', style_attr)
            if font_match:
                fonts = [f.strip().strip('"\'') for f in font_match.group(1).split(',')]
                fonts_found.update(fonts)
            
            # Extract font-size
            size_match = re.search(r'font-size:\s*([^;]+)', style_attr)
            if size_match:
                font_sizes.append(size_match.group(1).strip())
            
            # Extract font-weight
            weight_match = re.search(r'font-weight:\s*([^;]+)', style_attr)
            if weight_match:
                font_weights.append(weight_match.group(1).strip())
        
        # Extract from embedded CSS
        if "embedded_css" in css_styles.get("key_styles", {}):
            css_content = css_styles["key_styles"]["embedded_css"]
            font_family_matches = re.findall(r'font-family:\s*([^;]+)', css_content)
            for match in font_family_matches:
                fonts = [f.strip().strip('"\'') for f in match.split(',')]
                fonts_found.update(fonts)
        
        # Extract from link tags (Google Fonts, etc.)
        for link in soup.find_all('link', href=True):
            href = link.get('href', '')
            if 'fonts.googleapis.com' in href or 'fonts.gstatic.com' in href:
                font_match = re.search(r'family=([^&]+)', href)
                if font_match:
                    fonts_found.add(font_match.group(1).replace('+', ' '))
        
        return {
            "font_families": list(fonts_found)[:10],  # Top 10 fonts
            "font_sizes": list(set(font_sizes))[:10],
            "font_weights": list(set(font_weights))[:5],
            "primary_font": list(fonts_found)[0] if fonts_found else "Arial, sans-serif"
        }

    def _extract_images(self, soup: BeautifulSoup, base_url: str) -> Dict[str, List[str]]:
        """Extract images from the website"""
        images = {
            "logos": [],
            "hero_images": [],
            "background_images": [],
            "food_images": [],
            "all_images": []
        }
        
        # Extract all images
        for img in soup.find_all('img'):
            src = img.get('src') or img.get('data-src') or img.get('data-lazy-src')
            if src:
                full_url = urljoin(base_url, src)
                images["all_images"].append(full_url)
                
                # Categorize images
                alt_text = (img.get('alt') or '').lower()
                img_class = (img.get('class') or [])
                if isinstance(img_class, list):
                    img_class = ' '.join(img_class).lower()
                else:
                    img_class = img_class.lower()
                
                if 'logo' in alt_text or 'logo' in img_class:
                    images["logos"].append(full_url)
                elif 'hero' in alt_text or 'hero' in img_class or 'banner' in img_class:
                    images["hero_images"].append(full_url)
                elif 'food' in alt_text or 'dish' in alt_text or 'menu' in alt_text:
                    images["food_images"].append(full_url)
        
        # Extract background images from CSS
        for tag in soup.find_all(style=True):
            style_attr = tag.get('style', '')
            bg_match = re.search(r'background-image:\s*url\(([^)]+)\)', style_attr)
            if bg_match:
                bg_url = bg_match.group(1).strip('"\'').strip("'\"")
                full_url = urljoin(base_url, bg_url)
                images["background_images"].append(full_url)
                images["all_images"].append(full_url)
        
        # Limit results
        for key in images:
            images[key] = images[key][:10]
        
        return images

    def _extract_layout_patterns(self, soup: BeautifulSoup, css_styles: Dict) -> Dict[str, Any]:
        """Extract layout and spacing patterns"""
        layout_info = {
            "max_width": None,
            "padding_patterns": [],
            "margin_patterns": [],
            "grid_columns": None,
            "container_class": None
        }
        
        # Look for common container classes
        containers = soup.find_all(['div', 'section'], class_=re.compile(r'container|wrapper|content|main'))
        if containers:
            layout_info["container_class"] = containers[0].get('class', [])
        
        # Extract spacing from inline styles
        for tag in soup.find_all(style=True):
            style_attr = tag.get('style', '')
            
            padding_match = re.search(r'padding:\s*([^;]+)', style_attr)
            if padding_match:
                layout_info["padding_patterns"].append(padding_match.group(1).strip())
            
            margin_match = re.search(r'margin:\s*([^;]+)', style_attr)
            if margin_match:
                layout_info["margin_patterns"].append(margin_match.group(1).strip())
        
        return layout_info

    def _determine_theme(self, colors: Dict, typography: Dict, layout: Dict) -> str:
        """Determine overall design theme"""
        theme_indicators = []
        
        # Analyze colors
        if colors.get("primary"):
            primary = str(colors["primary"][0]).lower()
            if any(c in primary for c in ['#000', 'black', 'dark']):
                theme_indicators.append("dark")
            elif any(c in primary for c in ['#fff', 'white', 'light']):
                theme_indicators.append("light")
        
        # Analyze typography
        primary_font = typography.get("primary_font", "").lower()
        if any(f in primary_font for f in ['serif', 'times', 'georgia']):
            theme_indicators.append("classic")
        elif any(f in primary_font for f in ['sans', 'arial', 'helvetica']):
            theme_indicators.append("modern")
        
        if theme_indicators:
            return ", ".join(theme_indicators[:2])
        return "modern, clean"

    def _take_screenshots_of_urls(self, soup: BeautifulSoup, base_url: str) -> List[Dict[str, str]]:
        """Take screenshots of menu URLs (should be called after FindMenuFiles identifies URLs)"""
        screenshots = []
        
        try:
            # Find menu URLs from the page (basic detection)
            menu_urls = []
            all_links = soup.find_all('a', href=True)
            
            for link in all_links:
                href = link.get('href', '')
                link_text = (link.get_text() or '').lower()
                link_href_lower = href.lower()
                
                for keyword in MENU_KEYWORDS:
                    if keyword.lower() in link_text or keyword.lower() in link_href_lower:
                        full_url = urljoin(base_url, href)
                        if full_url.startswith('http') and full_url not in menu_urls:
                            menu_urls.append(full_url)
                            break
            
            # Check main page
            page_text = soup.get_text().lower()
            has_menu_content = any(keyword.lower() in page_text for keyword in MENU_KEYWORDS[:10])
            if has_menu_content and self.website_url not in menu_urls:
                menu_urls.insert(0, self.website_url)
            
            # Limit to 3 URLs
            menu_urls = menu_urls[:3]
            
            # Take screenshots
            for i, url in enumerate(menu_urls):
                screenshot_path = self._take_screenshot(url, i)
                if screenshot_path:
                    screenshots.append({
                        "url": url,
                        "screenshot_path": str(screenshot_path),
                        "screenshot_filename": screenshot_path.name
                    })
            
            return screenshots
            
        except Exception as e:
            return []

    def _take_screenshot(self, url: str, index: int) -> Optional[Path]:
        """Take a screenshot of the given URL using Playwright"""
        try:
            # Try to use Playwright if available
            from playwright.sync_api import sync_playwright
            
            # Create filename from URL
            from urllib.parse import urlparse
            parsed = urlparse(url)
            domain = parsed.netloc.replace('www.', '').replace('.', '_')
            filename = f"menu_{domain}_{index}.png"
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
            # Playwright not installed - return None (screenshots optional)
            return None
        except Exception as e:
            # Screenshot failed - return None but don't fail
            return None


if __name__ == "__main__":
    tool = AnalyzeWebsiteStyles(website_url="https://example.com")
    print("Testing AnalyzeWebsiteStyles tool...")
    print("Note: This requires a valid website URL to test properly.")
    print("Example usage:")
    print('tool = AnalyzeWebsiteStyles(website_url="https://www.restaurant-website.com")')
    print("result = tool.run()")
