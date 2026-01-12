# Suppress third-party deprecation warnings (pyiceberg, pyparsing, pydantic)
# Disable fastmcp's deprecation warning override before any imports
import os
os.environ.setdefault("FASTMCP_DEPRECATION_WARNINGS", "false")

import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)

from dotenv import load_dotenv
from agency_swarm import Agency
from menu_creator import menu_creator

load_dotenv()


def create_agency(load_threads_callback=None, save_threads_callback=None):
    """
    Creates the menu creation agency with a single MenuCreator agent.
    The agent handles the complete workflow from website analysis to HTML menu creation.
    
    Args:
        load_threads_callback: Optional callback to load thread history
        save_threads_callback: Optional callback to save thread history
    """
    # Build agency with thread persistence callbacks
    agency = Agency(
        menu_creator,  # Entry point agent (positional)
        shared_instructions="shared_instructions.md",
        load_threads_callback=load_threads_callback,
        save_threads_callback=save_threads_callback,
    )
    return agency


if __name__ == "__main__":
    import sys
    import asyncio
    
    # Check for menu_id argument or environment variable
    menu_id = None
    if len(sys.argv) > 1:
        menu_id = sys.argv[1]
    else:
        import os
        menu_id = os.getenv("MENU_ID")
    
    # Check if running in test mode (with menu_id)
    if menu_id:
        print("=" * 70)
        print("Testing Agency with Menu ID")
        print("=" * 70)
        print(f"Menu ID: {menu_id}")
        print()
        
        async def test_with_menu_id():
            agency = create_agency()
            
            # Set context_override with menu_id
            context_override = {"menu_id": menu_id}
            
            # Get user message from command line or use default
            if len(sys.argv) > 2:
                message = " ".join(sys.argv[2:])
            else:
                message = input("Enter your message (or press Enter for default): ").strip()
                if not message:
                    message = "Analyze the website and create a menu template"
            
            print(f"\nMessage: {message}")
            print("\nProcessing...\n")
            
            # Get response with context
            run_result = await agency.get_response(
                message,
                recipient_agent=None,
                context_override=context_override,
            )
            
            # Extract response
            if hasattr(run_result, 'messages') and run_result.messages:
                response_text = run_result.messages[-1].content
            elif hasattr(run_result, 'content'):
                response_text = run_result.content
            elif hasattr(run_result, 'text'):
                response_text = run_result.text
            else:
                response_text = str(run_result)
            
            print("\n" + "=" * 70)
            print("Response:")
            print("=" * 70)
            print(response_text)
            print("\n" + "=" * 70)
            print(f"Menu HTML is saved in database (menu_id: {menu_id})")
            print("View it in Supabase Dashboard > Table Editor > menus")
            print("=" * 70)
        
        asyncio.run(test_with_menu_id())
    else:
        # Interactive terminal demo
        agency = create_agency()
        print("\n" + "=" * 70)
        print("Agency Terminal Demo")
        print("=" * 70)
        print("\nTo test with menu_id, run:")
        print("  python agency.py <menu_id> [message]")
        print("\nOr set MENU_ID environment variable:")
        print("  MENU_ID=<menu_id> python agency.py")
        print("\nStarting interactive demo...\n")
        agency.terminal_demo()
