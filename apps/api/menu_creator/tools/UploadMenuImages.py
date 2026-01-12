from agency_swarm.tools import BaseTool
from agency_swarm import ToolOutputImage, ToolOutputText
from agency_swarm.tools.utils import tool_output_image_from_path
from pydantic import Field
from typing import List, Dict, Optional, Union
from pathlib import Path
import json
from dotenv import load_dotenv

load_dotenv()

# Cache directory for menu files
CACHE_IMAGES_DIR = Path(__file__).resolve().parent.parent.parent / "cache" / "images"
CACHE_IMAGES_DIR.mkdir(parents=True, exist_ok=True)


class UploadMenuImages(BaseTool):
    """
    Prepares menu images (from PDF conversions or downloaded images) for visual analysis.
    Returns all images as ToolOutputImage objects that will be displayed in the agent's response.
    The agent can use its vision capabilities to read and analyze all menu images.
    This enables the agent to extract menu content, structure, and design patterns from the images.
    
    Note: Uses "low" detail mode to avoid exceeding tool output size limits while still allowing
    the agent to read menu text and analyze design patterns effectively.
    """
    image_paths: str = Field(
        ..., description="JSON string array of image file paths. Format: [\"path/to/image1.png\", \"path/to/image2.png\", ...]. All images will be displayed for visual analysis."
    )

    def run(self) -> Union[str, List[Union[ToolOutputImage, ToolOutputText]]]:
        """
        Step 1: Parse image paths from JSON
        Step 2: Resolve and validate all image paths
        Step 3: Convert all images to ToolOutputImage objects
        Step 4: Return list of images + summary text (agent will see all images and can read them)
        """
        try:
            # Step 1: Parse paths
            paths_data = json.loads(self.image_paths) if isinstance(self.image_paths, str) else self.image_paths
            
            if not isinstance(paths_data, list):
                return "Error: image_paths must be a JSON array"
            
            image_data_urls = []
            resolved_paths = []
            
            # Step 2: Resolve and validate paths
            for image_path_str in paths_data:
                image_path = Path(image_path_str)
                
                # Resolve relative paths
                if not image_path.is_absolute():
                    cache_path = CACHE_IMAGES_DIR / image_path.name
                    if cache_path.exists():
                        image_path = cache_path
                    elif image_path.exists():
                        image_path = image_path.resolve()
                    else:
                        continue
                
                if image_path.exists():
                    resolved_paths.append(str(image_path))
                    image_data_urls.append({
                        "filename": image_path.name,
                        "path": str(image_path)
                    })
            
            # Step 3: Store image paths in agency context (if available)
            if hasattr(self, '_context') and image_data_urls:
                try:
                    self._context.set("menu_images_for_designer", image_data_urls)
                    self._context.set("all_menu_image_paths", resolved_paths)
                except Exception:
                    # Context API might not be available, continue without it
                    pass
            
            # Step 4: Return all images as ToolOutputImage objects + summary text
            if resolved_paths:
                # Convert all images to ToolOutputImage objects
                # Use "low" detail to avoid exceeding tool output size limits (1MB max)
                # "low" detail is sufficient for the agent to read menu text and analyze design
                tool_output_images = []
                for image_path in resolved_paths:
                    tool_output_images.append(
                        tool_output_image_from_path(image_path, detail="low")
                    )
                
                # Create summary text
                summary_text = f"✓ Prepared {len(resolved_paths)} menu images for visual analysis:\n"
                for i, img_info in enumerate(image_data_urls, 1):
                    summary_text += f"  {i}. {img_info['filename']}\n"
                summary_text += "\n**IMPORTANT: All images are displayed above. Use your vision capabilities to:**\n"
                summary_text += "- Read and extract menu items, descriptions, and prices\n"
                summary_text += "- Understand menu structure and organization\n"
                summary_text += "- Identify design patterns, layout, and visual style\n"
                summary_text += "- Note formatting and presentation details\n"
                
                # Return list of images + summary text
                # The framework will display all images, and the agent can read them
                return [
                    *tool_output_images,  # All images
                    ToolOutputText(text=summary_text)  # Summary text
                ]
            else:
                return "No images were found or could be processed."
            
        except json.JSONDecodeError as e:
            return f"Error parsing image paths JSON: {str(e)}"
        except Exception as e:
            return f"Error preparing menu images: {str(e)}"


if __name__ == "__main__":
    tool = UploadMenuImages(image_paths='["cache/images/menu_page_1.png"]')
    print("Testing UploadMenuImages tool...")
    print("Note: This prepares image files for multimodal message passing")
