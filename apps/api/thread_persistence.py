"""
Thread persistence for Agency Swarm using Supabase.
This allows chat history to persist across Cloud Run instances.
"""
import os
import json
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()

# Try to import Supabase client
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    Client = None


def get_supabase_client() -> Optional[Client]:
    """Create Supabase client from environment variables."""
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


def save_threads(thread_dict: List[Dict], chat_id: str) -> bool:
    """
    Save conversation threads to Supabase database.
    
    Args:
        thread_dict: List of thread messages/conversation items
        chat_id: Unique identifier for the conversation thread
        
    Returns:
        True if saved successfully, False otherwise
    """
    try:
        supabase = get_supabase_client()
        if not supabase:
            # If Supabase not available, threads won't persist (silent fail for development)
            return False
        
        # Convert thread_dict to JSON string for storage
        thread_data = json.dumps(thread_dict, default=str)
        
        # Try to update existing thread or insert new one
        # Using a 'conversation_threads' table
        try:
            # Check if thread exists
            existing = supabase.table("conversation_threads").select("id").eq("chat_id", chat_id).execute()
            
            if existing.data:
                # Update existing thread
                supabase.table("conversation_threads").update({
                    "thread_data": thread_data,
                    "updated_at": "now()"
                }).eq("chat_id", chat_id).execute()
            else:
                # Insert new thread
                supabase.table("conversation_threads").insert({
                    "chat_id": chat_id,
                    "thread_data": thread_data
                }).execute()
        except Exception as e:
            # Table might not exist - create it or handle gracefully
            # For now, just return False (threads won't persist)
            print(f"Warning: Could not save thread to database: {e}")
            return False
        
        return True
    except Exception as e:
        print(f"Error saving thread: {e}")
        return False


def load_threads(chat_id: str) -> Optional[List[Dict]]:
    """
    Load conversation threads from Supabase database.
    
    Args:
        chat_id: Unique identifier for the conversation thread
        
    Returns:
        List of thread messages/conversation items, or None if not found
    """
    try:
        supabase = get_supabase_client()
        if not supabase:
            # If Supabase not available, return None (no thread history)
            return None
        
        # Fetch thread from database
        try:
            result = supabase.table("conversation_threads").select("thread_data").eq("chat_id", chat_id).execute()
            
            if result.data and len(result.data) > 0:
                thread_data_str = result.data[0].get("thread_data")
                if thread_data_str:
                    # Parse JSON string back to list of dicts
                    return json.loads(thread_data_str)
        except Exception as e:
            # Table might not exist or thread not found
            print(f"Warning: Could not load thread from database: {e}")
            return None
        
        return None
    except Exception as e:
        print(f"Error loading thread: {e}")
        return None


def create_threads_table_sql() -> str:
    """
    Returns SQL to create the conversation_threads table in Supabase.
    Run this in Supabase SQL Editor if the table doesn't exist.
    """
    return """
    CREATE TABLE IF NOT EXISTS conversation_threads (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        chat_id TEXT UNIQUE NOT NULL,
        thread_data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Create index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_conversation_threads_chat_id ON conversation_threads(chat_id);
    
    -- Enable Row Level Security (optional, adjust based on your needs)
    ALTER TABLE conversation_threads ENABLE ROW LEVEL SECURITY;
    
    -- Policy: Allow service role to read/write (adjust based on your security needs)
    CREATE POLICY IF NOT EXISTS "Service role can manage threads"
        ON conversation_threads
        FOR ALL
        USING (true)
        WITH CHECK (true);
    """
