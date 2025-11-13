"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { Route } from "next";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/components/providers/auth-provider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type UserMenuProps = {
  locale: string;
};

export function UserMenu({ locale }: UserMenuProps) {
  const router = useRouter();
  const t = useTranslations("dashboard.userMenu");
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const displayName = (user?.user_metadata?.full_name ?? user?.email ?? t("userFallback")).trim();
  const displayEmail = user?.email ?? "";
  const initialsSource = displayName || displayEmail || t("userFallback");
  const initials = initialsSource
    .split(" ")
    .map((part: string) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSignOut = async () => {
    setError(null);
    setIsSigningOut(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        setError(signOutError.message || t("signOutError"));
        setIsSigningOut(false);
        return;
      }

      const signInRoute = `/${locale}/auth/sign-in` as Route;
      router.replace(signInRoute);
    } catch (exception) {
      setIsSigningOut(false);
      setError(
        exception instanceof Error
          ? exception.message || t("signOutError")
          : t("signOutError"),
      );
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
        <Avatar className="h-11 w-11 border border-slate-200">
          <AvatarImage src="/avatar-placeholder.png" alt={displayName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-2xl">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">{displayName}</span>
            <span className="text-xs font-normal text-muted-foreground">{displayEmail}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>{t("profile")}</DropdownMenuItem>
        <DropdownMenuItem>{t("preferences")}</DropdownMenuItem>
        <DropdownMenuItem>{t("help")}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={(event) => {
            event.preventDefault();
            if (!isSigningOut) {
              void handleSignOut();
            }
          }}
        >
          {isSigningOut ? t("signingOut") : t("signOut")}
        </DropdownMenuItem>
        {error ? (
          <div className="px-3 pb-3 text-xs font-medium text-destructive">
            {error}
          </div>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

