"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { buildMenuDomain } from "@/lib/restaurants/domain";
import { cn } from "@/lib/utils";

const restaurantFormSchema = z.object({
  name: z.string().min(1, "Restaurant name is required"),
  cuisine: z.string().optional(),
  address: z.string().optional(),
});

type RestaurantFormValues = z.infer<typeof restaurantFormSchema>;

export type RestaurantSetupCopy = {
  title: string;
  subtitle: string;
  nameLabel: string;
  namePlaceholder: string;
  cuisineLabel: string;
  addressLabel: string;
  submitCta: string;
  domainPreviewLabel: string;
  redirecting: string;
  success: string;
  errorFallback: string;
};

type RestaurantSetupFormProps = {
  locale: string;
  copy: RestaurantSetupCopy;
};

type SubmissionState = {
  error: string | null;
  success: boolean;
};

export function RestaurantSetupForm({ locale, copy }: RestaurantSetupFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [submissionState, setSubmissionState] = useState<SubmissionState>({
    error: null,
    success: false,
  });

  const form = useForm<RestaurantFormValues>({
    resolver: zodResolver(restaurantFormSchema),
    defaultValues: {
      name: "",
      cuisine: "",
      address: "",
    },
  });

  const watchedName = useWatch({
    control: form.control,
    name: "name",
  });

  const domainPreview = useMemo(() => {
    try {
      if (!watchedName || watchedName.trim().length === 0) {
        return null;
      }
      return buildMenuDomain(watchedName.trim());
    } catch (error) {
      console.warn("Unable to build menu domain", error);
      return null;
    }
  }, [watchedName]);

  const resetState = () => {
    setSubmissionState({ error: null, success: false });
  };

  const onSubmit = async (values: RestaurantFormValues) => {
    resetState();

    try {
      const response = await fetch("/api/restaurants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message =
          typeof payload?.error === "string"
            ? payload.error
            : payload?.error?.formErrors?.join(" ") ?? copy.errorFallback;

        setSubmissionState({ error: message, success: false });
        return;
      }

      setSubmissionState({ error: null, success: true });

      startTransition(() => {
        router.replace(`/${locale}/dashboard/menus` as Route);
      });
    } catch (error) {
      console.error("Restaurant setup failed", error);
      setSubmissionState({ error: copy.errorFallback, success: false });
    }
  };

  const isSubmitting = form.formState.isSubmitting || isPending;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex h-full flex-col gap-8 py-8"
      >
        <div className="grid gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{copy.nameLabel}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={copy.namePlaceholder}
                    autoComplete="organization"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cuisine"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{copy.cuisineLabel}</FormLabel>
                <FormControl>
                  <Input placeholder="Mediterrània" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{copy.addressLabel}</FormLabel>
                <FormControl>
                  <Input placeholder="C/ Major, 123" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
          <p className="text-sm font-semibold text-slate-600">{copy.domainPreviewLabel}</p>
          <p
            className={cn(
              "mt-3 text-lg font-semibold",
              domainPreview ? "text-primary" : "text-slate-400"
            )}
          >
            {domainPreview ? domainPreview.url : "—"}
          </p>
        </div>

        {submissionState.error ? (
          <p className="text-sm font-semibold text-destructive">{submissionState.error}</p>
        ) : null}

        {submissionState.success ? (
          <p className="text-sm font-semibold text-emerald-600">{copy.success}</p>
        ) : null}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? copy.redirecting : copy.submitCta}
        </Button>
      </form>
    </Form>
  );
}

