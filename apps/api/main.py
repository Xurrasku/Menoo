"""
FastAPI server for Agency Swarm menu creation service.
Deployed on Google Cloud Run.
"""
import os
import asyncio
from typing import Optional
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from agency import create_agency
from thread_persistence import save_threads, load_threads
from auth import (
    authenticate_user,
    create_access_token,
    get_current_user,
    Token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from datetime import timedelta

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Menu Creation Agency API",
    description="API for creating restaurant menus using AI agents",
    version="1.0.0"
)

# Configure CORS
# Allow all origins in production (Cloud Run handles security)
# For production, you may want to restrict to specific domains
# Default to localhost:3000 for local development
cors_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:3000")
allowed_origins = cors_origins_env.split(",") if cors_origins_env != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Global agency instances per thread (to support thread persistence)
_agencies = {}


def get_agency(thread_id: Optional[str] = None):
    """
    Get or create the agency instance for a specific thread.
    If thread_id is provided, loads thread history from database.
    """
    global _agencies
    
    # Use thread_id as key, or "default" if not provided
    key = thread_id or "default"
    
    if key not in _agencies:
        # Create agency with thread persistence callbacks
        def load_callback():
            if thread_id:
                return load_threads(thread_id)
            return None
        
        def save_callback(thread_dict):
            if thread_id:
                save_threads(thread_dict, thread_id)
        
        _agencies[key] = create_agency(
            load_threads_callback=load_callback if thread_id else None,
            save_threads_callback=save_callback if thread_id else None
        )
    
    return _agencies[key]


class ChatRequest(BaseModel):
    """Request model for chat endpoint."""
    message: str
    thread_id: Optional[str] = None
    menu_id: Optional[str] = Field(
        default=None,
        description="UUID of the menu to work with. If provided, HTML tools will save/read from database instead of file system. Recommended for Cloud Run/API usage."
    )


class ChatResponse(BaseModel):
    """Response model for chat endpoint."""
    response: str
    thread_id: str


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "Menu Creation Agency API",
        "version": "1.0.0"
    }


@app.get("/health")
async def health():
    """Health check endpoint for Cloud Run."""
    return {"status": "healthy"}


@app.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Login endpoint (OPTIONAL - for testing/backup only).
    
    ⚠️ NOTE: If you're using Supabase Auth in your frontend, you don't need this endpoint.
    The frontend should authenticate with Supabase and send the Supabase Auth token
    in the Authorization header. The backend will automatically validate Supabase tokens.
    
    This endpoint is kept for backward compatibility and testing purposes only.
    
    Usage from browser/client:
        POST /login
        Content-Type: application/x-www-form-urlencoded
        Body: username=admin&password=admin123
    
    Returns:
        Token object with access_token and token_type
    
    Raises:
        HTTPException: If credentials are invalid
    """
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "email": user.email, "user_id": user.username},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    """
    Get current authenticated user information.
    
    This is a protected route that requires authentication.
    It demonstrates how to use the get_current_user dependency.
    
    Usage:
        GET /me
        Authorization: Bearer <token>
    
    Returns:
        Dictionary with current user information
    """
    return current_user


@app.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Send a message to the agency and get a response.
    
    Args:
        request: ChatRequest with message, optional thread_id, and optional menu_id
        
    Returns:
        ChatResponse with agent response and thread_id
    """
    try:
        # Get agency instance for this thread (loads history if thread_id provided)
        agency = get_agency(request.thread_id)
        
        # Store menu_id in agency context if provided (secure, not in message)
        # Use context_override to pass menu_id securely to tools
        context_override = {}
        if request.menu_id:
            context_override = {"menu_id": request.menu_id}
        
        # Get response from agency with context override
        # Tools will automatically retrieve menu_id from context
        # Thread history is automatically loaded/saved via callbacks
        run_result = await agency.get_response(
            request.message,
            recipient_agent=None,  # Uses entry point agent
            context_override=context_override if context_override else None,
        )
        
        # Extract response text from RunResult
        # Try multiple ways to get the response text
        if hasattr(run_result, 'messages') and run_result.messages:
            response_text = run_result.messages[-1].content
        elif hasattr(run_result, 'content'):
            response_text = run_result.content
        elif hasattr(run_result, 'text'):
            response_text = run_result.text
        else:
            response_text = str(run_result)
        
        # Get thread ID from run result or use provided one
        thread_id = request.thread_id
        if not thread_id:
            if hasattr(run_result, 'thread_id'):
                thread_id = run_result.thread_id
            elif hasattr(run_result, 'thread') and hasattr(run_result.thread, 'id'):
                thread_id = run_result.thread.id
            else:
                thread_id = "default"
        
        return ChatResponse(
            response=response_text,
            thread_id=thread_id
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing request: {str(e)}"
        )


@app.post("/chat/stream")
async def chat_stream(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Stream responses from the agency (Server-Sent Events).
    
    Args:
        request: ChatRequest with message, optional thread_id, and optional menu_id
        
    Returns:
        StreamingResponse with SSE events
    """
    from fastapi.responses import StreamingResponse
    
    async def generate():
        try:
            # Get agency instance for this thread (loads history if thread_id provided)
            agency = get_agency(request.thread_id)
            
            # Store menu_id in agency context if provided (secure, not in message)
            # Use context_override to pass menu_id securely to tools
            context_override = {}
            if request.menu_id:
                context_override = {"menu_id": request.menu_id}
            
            # Get stream (synchronous call returns stream object)
            # Tools will automatically retrieve menu_id from context
            stream = agency.get_response_stream(
                request.message,
                recipient_agent=None,  # Uses entry point agent
                context_override=context_override if context_override else None,
            )
            
            # Iterate over stream events
            async for event in stream:
                # Format event as JSON for SSE
                import json
                event_data = json.dumps({
                    "type": getattr(event, 'type', 'message'),
                    "content": str(event),
                })
                yield f"data: {event_data}\n\n"
            
            # Get final result
            final_result = await stream.wait_final_result()
            yield f"data: {json.dumps({'type': 'done', 'result': str(final_result)})}\n\n"
            
        except Exception as e:
            import json
            error_data = json.dumps({"type": "error", "message": str(e)})
            yield f"data: {error_data}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
