from pathlib import Path
from agency_swarm import Agent, ModelSettings
from openai.types.shared import Reasoning

# Try to import WebSearchTool (may not be available in all versions)
try:
    from agency_swarm.tools import WebSearchTool
    WEB_SEARCH_AVAILABLE = True
except ImportError:
    try:
        # Try alternative import path
        from agency_swarm import WebSearchTool
        WEB_SEARCH_AVAILABLE = True
    except ImportError:
        WEB_SEARCH_AVAILABLE = False
        WebSearchTool = None

# Import all tools from style analyzer
from .tools.AnalyzeWebsiteStyles import AnalyzeWebsiteStyles
from .tools.FindMenuFiles import FindMenuFiles
from .tools.TakeMenuScreenshots import TakeMenuScreenshots
from .tools.UploadMenuImages import UploadMenuImages

# Import all tools from menu designer
from .tools.SaveHTMLFile import SaveHTMLFile
from .tools.UpdateHTMLFile import UpdateHTMLFile
from .tools.ReadHTMLPart import ReadHTMLPart
from .tools.PopulateMenuFromDB import PopulateMenuFromDB
from .tools.PreviewImageFromURL import PreviewImageFromURL
from .tools.SaveMenuToDB import SaveMenuToDB

# Get the directory of this file
BASE_DIR = Path(__file__).resolve().parent

menu_creator = Agent(
    name="MenuCreator",
    description="A comprehensive agent that analyzes restaurant websites, extracts style information, finds menu files, takes screenshots, and creates beautiful HTML menus. Can read and analyze menu images to extract content and design patterns.",
    instructions=str(BASE_DIR / "instructions.md"),
    tools=[
        # Style analysis tools
        AnalyzeWebsiteStyles,
        FindMenuFiles,
        TakeMenuScreenshots,
        UploadMenuImages,
        # WebSearchTool if available
        *([WebSearchTool()] if WEB_SEARCH_AVAILABLE and WebSearchTool else []),
        # Menu creation tools
        SaveHTMLFile,
        UpdateHTMLFile,
        ReadHTMLPart,
        PopulateMenuFromDB,
        PreviewImageFromURL,
        SaveMenuToDB,
    ],
    model="gpt-5",
    model_settings=ModelSettings(reasoning=Reasoning(effort="medium")),
)
