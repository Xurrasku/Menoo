from agency_swarm.tools import BaseTool
from agency_swarm import ToolOutputImage, ToolOutputText
from agency_swarm.tools.utils import tool_output_image_from_path
from pydantic import Field
from typing import Union, List
from pathlib import Path
import requests
from dotenv import load_dotenv

load_dotenv()

# Cache directory for downloaded images
CACHE_IMAGES_DIR = Path(__file__).resolve().parent.parent.parent / "cache" / "images"
CACHE_IMAGES_DIR.mkdir(parents=True, exist_ok=True)


class PreviewImageFromURL(BaseTool):
    """
    Fetches an image from a public URL and returns it as a multimodal tool output.
    This allows the agent to visually inspect the image and decide whether to use it in the menu template.
    
    The agent can use this tool to preview logos, images, or other visual assets before adding them to the template.
    """
    image_url: str = Field(
        ...,
        description="Public URL of the image to fetch and preview. Must be accessible without authentication."
    )

    def run(self) -> Union[str, List[Union[ToolOutputImage, ToolOutputText]]]:
        """
        Step 1: Fetch image from URL
        Step 2: Save temporarily to cache
        Step 3: Return as ToolOutputImage so agent can see it
        """
        try:
            # Step 1: Fetch image from URL
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            response = requests.get(self.image_url, headers=headers, timeout=10, stream=True)
            response.raise_for_status()
            
            # Check if it's actually an image
            content_type = response.headers.get('content-type', '').lower()
            if not content_type.startswith('image/'):
                return f"Error: URL does not point to an image. Content-Type: {content_type}"
            
            # Step 2: Save to cache temporarily
            # Extract filename from URL or use a default
            filename = self.image_url.split('/')[-1].split('?')[0]
            if not filename or '.' not in filename:
                # Generate a filename based on URL hash
                import hashlib
                url_hash = hashlib.md5(self.image_url.encode()).hexdigest()[:8]
                filename = f"preview_{url_hash}.jpg"
            
            # Ensure filename has extension
            if '.' not in filename:
                filename += '.jpg'
            
            cache_path = CACHE_IMAGES_DIR / filename
            
            # Download and save image
            with open(cache_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            if not cache_path.exists():
                return f"Error: Failed to save image to cache"
            
            # Step 3: Return as ToolOutputImage
            file_size = cache_path.stat().st_size
            summary_text = f"✓ Image fetched and displayed:\n"
            summary_text += f"  URL: {self.image_url}\n"
            summary_text += f"  Filename: {filename}\n"
            summary_text += f"  Size: {file_size:,} bytes\n"
            summary_text += f"\n**The image is displayed above. Review it and decide if you want to use it in the menu template.**"
            
            return [
                tool_output_image_from_path(cache_path, detail="low"),  # Use "low" to avoid size limits
                ToolOutputText(text=summary_text)
            ]
            
        except requests.exceptions.RequestException as e:
            return f"Error fetching image from URL: {str(e)}"
        except Exception as e:
            return f"Error processing image: {str(e)}"


if __name__ == "__main__":
    # Test the tool
    tool = PreviewImageFromURL(image_url="https://example.com/logo.png")
    print("PreviewImageFromURL tool created")
    print("Note: This tool fetches images from URLs and displays them for agent review")
