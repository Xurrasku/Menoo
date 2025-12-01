"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/icons/google";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AUTH_PROVIDERS, buildPostAuthRedirect } from "@/lib/auth/config";
import { parseAuthError } from "@/lib/auth/errors";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import { useOAuthHandler } from "./use-oauth-handler";

const signInSchema = z.object({
  email: z.string().email({ message: "Introdueix un email vàlid" }),
  password: z.string().min(6, {
    message: "La contrasenya ha de tenir com a mínim 6 caràcters",
  }),
});

type SignInValues = z.infer<typeof signInSchema>;

type SignInFormProps = {
  redirectTo?: string;
  locale: string;
  initialError?: string | null;
};

export function SignInForm({
  redirectTo = "/dashboard/restaurant",
  locale,
  initialError = null,
}: SignInFormProps) {
  const router = useRouter();
  const t = useTranslations();
  const tCommon = useTranslations("auth.common");
  const [errorMessage, setErrorMessage] = useState<string | null>(
    initialError ? parseAuthError({ message: initialError }).message : null
  );
  const [isPending, startTransition] = useTransition();

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: SignInValues) => {
    setErrorMessage(null);

    try {
      const supabase = createSupabaseBrowserClient();

      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        const parsedError = parseAuthError(error);
        setErrorMessage(parsedError.message);
        return;
      }

      // Refresh the session to ensure cookies are set
      await supabase.auth.getSession();

      const targetPath = buildPostAuthRedirect({ locale, destination: redirectTo });
      // Use window.location for full page reload to ensure server picks up new session
      window.location.href = targetPath;
    } catch (error) {
      const parsedError = parseAuthError(
        error instanceof Error ? error : { message: "No s'ha pogut iniciar sessió. Torna-ho a intentar." }
      );
      setErrorMessage(parsedError.message);
    }
  };

  const { isOAuthLoading, activeProvider, handleOAuthSignIn } = useOAuthHandler({
    locale,
    redirectTo,
    onError: setErrorMessage,
    fallbackErrorMessage: tCommon("oauthError"),
  });

  const isSubmitting = form.formState.isSubmitting || isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          {AUTH_PROVIDERS.map((provider) => {
            const isProviderLoading = isOAuthLoading && activeProvider === provider.id;
            const buttonLabel = isProviderLoading
              ? tCommon("redirecting")
              : t(provider.labelKey);

            return (
              <Button
                key={provider.id}
                type="button"
                variant="outline"
                className="w-full justify-center gap-3"
                disabled={isOAuthLoading || isSubmitting}
                onClick={() => handleOAuthSignIn(provider.id)}
              >
                <GoogleIcon className="h-4 w-4" aria-hidden />
                <span>{buttonLabel}</span>
              </Button>
            );
          })}

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {tCommon("orContinueWithEmail")}
            </span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="hola@restaurant.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contrasenya</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {errorMessage ? (
          <p className="text-sm font-medium text-destructive">{errorMessage}</p>
        ) : null}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Accedint..." : "Iniciar sessió"}
        </Button>
      </form>
    </Form>
  );
}

