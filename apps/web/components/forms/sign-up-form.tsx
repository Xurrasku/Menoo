"use client";

import { useState, useTransition } from "react";
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
import { AUTH_PROVIDERS, buildPostAuthRedirect, getAppBaseUrl } from "@/lib/auth/config";
import { parseAuthError } from "@/lib/auth/errors";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import { useOAuthHandler } from "./use-oauth-handler";

const signUpSchema = z
  .object({
    email: z.string().email({ message: "Escriu un email vàlid" }),
    password: z.string().min(8, {
      message: "La contrasenya ha de tenir 8 caràcters com a mínim",
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les contrasenyes han de coincidir",
    path: ["confirmPassword"],
  });

type SignUpValues = z.infer<typeof signUpSchema>;

type SignUpFormProps = {
  locale: string;
  redirectTo?: string;
  initialError?: string | null;
};

export function SignUpForm({
  locale,
  redirectTo = "/dashboard/restaurant",
  initialError = null,
}: SignUpFormProps) {
  const t = useTranslations();
  const tCommon = useTranslations("auth.common");
  const [serverMessage, setServerMessage] = useState<string | null>(
    initialError ? parseAuthError({ message: initialError }).message : null
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending] = useTransition();

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: SignUpValues) => {
    setServerMessage(null);
    setSuccessMessage(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const targetPath = buildPostAuthRedirect({ locale, destination: redirectTo });
      const appBaseUrl = getAppBaseUrl();
      const callbackUrl = new URL(`${appBaseUrl}/${locale}/auth/callback`);
      callbackUrl.searchParams.set("redirect_to", targetPath);
      
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: callbackUrl.toString(),
        },
      });

      if (error) {
        const parsedError = parseAuthError(error);
        setServerMessage(parsedError.message);
        return;
      }

      // Check if email confirmation is required
      // If user is null, email confirmation is required
      // If user is not null, they're automatically logged in
      if (data.user && data.session) {
        // User is automatically logged in (email confirmation disabled)
        await supabase.auth.getSession();
        window.location.assign(targetPath);
      } else {
        // Email confirmation required
        setSuccessMessage(
          "Compte creat! Revisa el teu email i clica l'enllaç de verificació per activar el compte."
        );
        // Clear the form
        form.reset();
      }
    } catch (error) {
      const parsedError = parseAuthError(
        error instanceof Error
          ? error
          : { message: "No s'ha pogut crear el compte. Torna-ho a provar més tard." }
      );
      setServerMessage(parsedError.message);
    }
  };

  const { isOAuthLoading, activeProvider, handleOAuthSignIn } = useOAuthHandler({
    locale,
    redirectTo,
    onError: setServerMessage,
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
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Repeteix la contrasenya</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {successMessage ? (
          <p className="text-sm font-medium text-green-600 dark:text-green-400">
            {successMessage}
          </p>
        ) : null}
        {serverMessage ? (
          <p className="text-sm font-medium text-destructive">{serverMessage}</p>
        ) : null}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creant compte..." : "Crear compte"}
        </Button>
      </form>
    </Form>
  );
}

