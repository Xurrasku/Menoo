import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://menoo-backend-1053481188962.europe-southwest1.run.app";

export interface ChatRequest {
  message: string;
  thread_id?: string;
  menu_id?: string;
}

export interface ChatResponse {
  response: string;
  thread_id: string;
}

export interface APIError {
  detail: string;
}

async function getSupabaseToken(): Promise<string> {
  const supabase = createSupabaseBrowserClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    throw new Error("Not authenticated");
  }

  return session.access_token;
}

export async function sendChatMessage(
  message: string,
  menuId?: string,
  threadId?: string
): Promise<ChatResponse> {
  const token = await getSupabaseToken();

  const response = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      message,
      menu_id: menuId,
      thread_id: threadId,
    } satisfies ChatRequest),
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorData = await response.json() as APIError;
      errorMessage = errorData.detail || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<ChatResponse>;
}

export async function streamChatMessage(
  message: string,
  menuId: string | undefined,
  threadId: string | undefined,
  onChunk: (content: string) => void
): Promise<string> {
  let token: string;
  try {
    token = await getSupabaseToken();
  } catch (error) {
    throw new Error("Authentication failed. Please sign in again.");
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        message,
        menu_id: menuId,
        thread_id: threadId,
      } satisfies ChatRequest),
    });
  } catch (error: unknown) {
    // Network error (CORS, connection refused, etc.)
    // "Failed to fetch" is a TypeError thrown by fetch() when network request fails
    if (error instanceof TypeError) {
      const errorMessage = error.message || "";
      if (errorMessage === "Failed to fetch" || errorMessage.includes("Failed to fetch")) {
        throw new Error("Unable to connect to the server. Please check your internet connection and try again.");
      }
    }
    
    // Re-throw other errors as-is
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error("An unexpected error occurred");
  }

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorData = await response.json() as APIError;
      errorMessage = errorData.detail || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error("No reader available");
  }

  let fullResponse = "";
  let currentThreadId: string | undefined = threadId;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.content) {
            fullResponse += data.content;
            onChunk(data.content);
          }
          if (data.thread_id) {
            currentThreadId = data.thread_id;
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }

  return currentThreadId || "";
}

