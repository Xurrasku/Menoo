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

# Cache directory for menu files
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

# File extensions for menu files
MENU_FILE_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp']


class FindMenuFiles(BaseTool):
    """
    Searches a restaurant website for menu files (PDFs, images) and menu page URLs.
    Downloads menu files and identifies URLs that should be screenshotted.
    Uses web search to find menu-related content on the website.
    """
    website_url: str = Field(
        ..., description="The URL of the restaurant website to search for menus. Must include http:// or https://"
    )
    use_web_search: bool = Field(
        default=True, description="Whether to use web search to find menu pages. Defaults to True."
    )

    def run(self):
        """
        Step 1: Fetch the website HTML content
        Step 2: Search for menu files (PDFs, images) in links
        Step 3: Search for menu page URLs
        Step 4: Download menu files (PDFs, images)
        Step 5: Return list of menu files and URLs for screenshots
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
            
            # Step 3: Find menu files and URLs
            menu_files = []
            menu_urls = []
            
            # Find all links
            all_links = soup.find_all('a', href=True)
            
            for link in all_links:
                href = link.get('href', '')
                link_text = (link.get_text() or '').lower()
                link_href_lower = href.lower()
                
                # Check if it's a menu file (PDF or image)
                file_ext = os.path.splitext(href)[1].lower()
                if file_ext in MENU_FILE_EXTENSIONS:
                    # Check if link text or href contains menu keywords
                    for keyword in MENU_KEYWORDS:
                        if keyword.lower() in link_text or keyword.lower() in link_href_lower:
                            full_url = urljoin(self.website_url, href)
                            if full_url.startswith('http'):
                                menu_files.append({
                                    "url": full_url,
                                    "type": "file",
                                    "extension": file_ext,
                                    "filename": os.path.basename(urlparse(full_url).path) or f"menu_{len(menu_files)}{file_ext}"
                                })
                                break
                
                # Check if it's a menu page URL
                else:
                    for keyword in MENU_KEYWORDS:
                        if keyword.lower() in link_text or keyword.lower() in link_href_lower:
                            full_url = urljoin(self.website_url, href)
                            if full_url.startswith('http') and full_url not in [m["url"] for m in menu_urls]:
                                menu_urls.append({
                                    "url": full_url,
                                    "type": "page"
                                })
                                break
            
            # Also check the main page itself for menu content
            page_text = soup.get_text().lower()
            has_menu_content = any(keyword.lower() in page_text for keyword in MENU_KEYWORDS[:10])
            if has_menu_content and self.website_url not in [m["url"] for m in menu_urls]:
                menu_urls.insert(0, {"url": self.website_url, "type": "page"})
            
            # Step 4: Download menu files
            downloaded_files = []
            for menu_file in menu_files[:5]:  # Limit to 5 files
                download_result = self._download_file(menu_file["url"], menu_file["filename"])
                if download_result:
                    file_info = {
                        "url": menu_file["url"],
                        "type": download_result.get("type", menu_file["type"]),
                        "extension": menu_file["extension"],
                        "filename": menu_file["filename"],
                        "original_file": download_result["original_file"],
                        "original_filename": download_result["original_filename"]
                    }
                    
                    # If PDF was converted to images, include image paths
                    if download_result.get("converted_images"):
                        file_info["converted_images"] = download_result["converted_images"]
                        file_info["pages_count"] = len(download_result["converted_images"])
                    
                    downloaded_files.append(file_info)
            
            # Limit menu URLs to 3 for screenshots
            menu_urls = menu_urls[:3]
            
            # Step 5: Return results
            result = {
                "website_url": self.website_url,
                "menu_files": downloaded_files,
                "menu_urls_for_screenshots": menu_urls,
                "summary": {
                    "files_found": len(downloaded_files),
                    "urls_found": len(menu_urls)
                }
            }
            
            return json.dumps(result, indent=2)
            
        except requests.RequestException as e:
            return f"Error fetching website: {str(e)}"
        except Exception as e:
            return f"Error finding menu files: {str(e)}"

    def _download_file(self, url: str, filename: str) -> Optional[Dict[str, Any]]:
        """Download a menu file (PDF or image) and save it to cache. Converts PDFs to images."""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            response = requests.get(url, headers=headers, timeout=15, stream=True)
            response.raise_for_status()
            
            # Create safe filename
            safe_filename = "".join(c for c in filename if c.isalnum() or c in "._-")[:100]
            if not safe_filename:
                from urllib.parse import urlparse
                parsed = urlparse(url)
                safe_filename = os.path.basename(parsed.path) or "menu_file"
            
            file_path = CACHE_IMAGES_DIR / safe_filename
            
            # Download file
            with open(file_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            result = {
                "original_file": str(file_path),
                "original_filename": file_path.name,
                "converted_images": []
            }
            
            # If it's a PDF, convert to images
            if file_path.suffix.lower() == '.pdf':
                converted_images = self._convert_pdf_to_images(file_path)
                if converted_images:
                    result["converted_images"] = converted_images
                    result["type"] = "pdf_converted"
                else:
                    result["type"] = "pdf"
            else:
                result["type"] = "image"
            
            return result
            
        except Exception as e:
            # Download failed - return None but don't fail
            return None

    def _convert_pdf_to_images(self, pdf_path: Path) -> List[Dict[str, str]]:
        """Convert PDF file to images (one image per page)"""
        try:
            # Try PyMuPDF (fitz) first - faster and doesn't require external dependencies
            try:
                import fitz  # PyMuPDF
                
                pdf_document = fitz.open(pdf_path)
                converted_images = []
                
                for page_num in range(len(pdf_document)):
                    page = pdf_document[page_num]
                    # Render page to image (300 DPI for good quality)
                    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x zoom = ~144 DPI
                    
                    # Create image filename
                    image_filename = f"{pdf_path.stem}_page_{page_num + 1}.png"
                    image_path = CACHE_IMAGES_DIR / image_filename
                    
                    # Save image
                    pix.save(str(image_path))
                    
                    converted_images.append({
                        "page": page_num + 1,
                        "image_path": str(image_path),
                        "image_filename": image_filename
                    })
                
                pdf_document.close()
                return converted_images
                
            except ImportError:
                # Try pdf2image as fallback
                try:
                    from pdf2image import convert_from_path
                    
                    # Convert PDF to images
                    images = convert_from_path(str(pdf_path), dpi=200)
                    converted_images = []
                    
                    for i, image in enumerate(images):
                        # Create image filename
                        image_filename = f"{pdf_path.stem}_page_{i + 1}.png"
                        image_path = CACHE_IMAGES_DIR / image_filename
                        
                        # Save image
                        image.save(image_path, 'PNG')
                        
                        converted_images.append({
                            "page": i + 1,
                            "image_path": str(image_path),
                            "image_filename": image_filename
                        })
                    
                    return converted_images
                    
                except ImportError:
                    # Neither library available
                    return []
            
        except Exception as e:
            # Conversion failed - return empty list but don't fail
            return []


if __name__ == "__main__":
    tool = FindMenuFiles(website_url="https://example.com")
    print("Testing FindMenuFiles tool...")
    print("Note: This requires a valid website URL to test properly.")
    print("Example usage:")
    print('tool = FindMenuFiles(website_url="https://www.restaurant-website.com")')
    print("result = tool.run()")
