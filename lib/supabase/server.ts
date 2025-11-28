import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  type CookieOptions = Omit<Parameters<typeof cookieStore.set>[0], "name" | "value">;

  const safeSet = (name: string, value: string, options?: CookieOptions) => {
    try {
      cookieStore.set({
        name,
        value,
        ...(options ?? {}),
      });
    } catch (error) {
      console.warn("Supabase cookie set skipped", error);
    }
  };

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      },
      set(name, value, options) {
        safeSet(name, value, options);
      },
      remove(name, options) {
        safeSet(name, "", options);
      },
    },
  });
}

