import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

type CreateSupabaseServerClientOptions = {
  /**
   * When true, cookie mutations are allowed because we are running inside
   * a Route Handler or Server Action. RSC contexts cannot mutate cookies.
   */
  persistSession?: boolean;
};

export async function createSupabaseServerClient(
  options: CreateSupabaseServerClientOptions = {}
) {
  const { persistSession = false } = options;
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: createSupabaseCookieAdapter(cookieStore, persistSession),
  });
}

export type SupabaseCookieStore = Awaited<ReturnType<typeof cookies>>;

export function createSupabaseCookieAdapter(cookieStore: SupabaseCookieStore, persistSession: boolean) {
  type CookieOptions = Omit<Parameters<typeof cookieStore.set>[0], "name" | "value">;

  const safeSet = (name: string, value: string, options?: CookieOptions) => {
    if (!persistSession) {
      return;
    }
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

  return {
    get(name: string) {
      return cookieStore.get(name)?.value;
    },
    set(name: string, value: string, options?: CookieOptions) {
      safeSet(name, value, options);
    },
    remove(name: string, options?: CookieOptions) {
      safeSet(name, "", options);
    },
  };
}

