"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { motion, type Variants } from "framer-motion";
import { ArrowLeft } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

// Validation helper for design step
function validateDesignUrl(url: string): boolean {
  if (!url || url.trim().length === 0) return true; // Optional field
  try {
    const normalizedUrl = url.trim();
    const hasProtocol = /^https?:\/\//i.test(normalizedUrl);
    const urlToValidate = hasProtocol ? normalizedUrl : `https://${normalizedUrl}`;
    new URL(urlToValidate);
    return true;
  } catch {
    return false;
  }
}

// Normalize URL by adding https:// if no protocol is provided
function normalizeDesignUrl(url: string | undefined): string | null {
  if (!url || url.trim().length === 0) return null;
  const trimmed = url.trim();
  const hasProtocol = /^https?:\/\//i.test(trimmed);
  return hasProtocol ? trimmed : `https://${trimmed}`;
}

const designFormSchema = z.object({
  designUrl: z.string().optional(),
  designDescription: z.string().optional(),
}).refine(
  (data) => {
    if (data.designUrl && data.designUrl.trim().length > 0) {
      return validateDesignUrl(data.designUrl);
    }
    return true;
  },
  {
    message: "Please enter a valid URL",
    path: ["designUrl"],
  }
).refine(
  (data) => {
    const hasUrl = data.designUrl && data.designUrl.trim().length > 0;
    const hasDescription = data.designDescription && data.designDescription.trim().length > 0;
    return hasUrl || hasDescription;
  },
  {
    message: "Please provide either a website URL or design description",
    path: ["designDescription"],
  }
);

type DesignFormValues = z.infer<typeof designFormSchema>;

export type OnboardingDesignCopy = {
  designUrlLabel: string;
  designUrlPlaceholder: string;
  designUrlHelper: string;
  designDescriptionLabel: string;
  designDescriptionPlaceholder: string;
  designValidationError: string;
  designInvalidUrl: string;
  nextButton: string;
  backButton: string;
  skipButton: string;
  redirecting: string;
  errorFallback: string;
};

type OnboardingDesignStepProps = {
  locale: string;
  copy: OnboardingDesignCopy;
  restaurantId: string;
};

const stepContainerVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const stepItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

const formFieldVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 15,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

export function OnboardingDesignStep({ locale, copy, restaurantId }: OnboardingDesignStepProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Restore form state from sessionStorage
  const getStoredFormData = (): Partial<DesignFormValues> => {
    if (typeof window === "undefined") return {};
    try {
      const stored = sessionStorage.getItem("onboarding-design-form");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to parse stored design form data", error);
    }
    return {};
  };

  const form = useForm<DesignFormValues>({
    resolver: zodResolver(designFormSchema),
    defaultValues: {
      designUrl: "",
      designDescription: "",
      ...getStoredFormData(),
    },
  });

  // Save form state to sessionStorage whenever it changes
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("onboarding-design-form", JSON.stringify(values));
        } catch (error) {
          console.error("Failed to save design form data", error);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const watchedDesignUrl = useWatch({
    control: form.control,
    name: "designUrl",
  });

  const watchedDesignDescription = useWatch({
    control: form.control,
    name: "designDescription",
  });

  const onSubmit = async (values: DesignFormValues) => {
    setError(null);

    try {
      const response = await fetch("/api/restaurants/design", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          restaurantId,
          designUrl: normalizeDesignUrl(values.designUrl),
          designDescription: values.designDescription?.trim() || null,
        }),
      });

      if (!response.ok) {
        let errorMessage = copy.errorFallback;
        
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const payload = await response.json().catch(() => null);
            
            if (payload) {
              if (typeof payload.error === "string") {
                errorMessage = payload.error;
              } else if (payload.error?.formErrors && Array.isArray(payload.error.formErrors)) {
                errorMessage = payload.error.formErrors.join(" ");
              } else if (payload.error?.fieldErrors && typeof payload.error.fieldErrors === "object") {
                const fieldErrors = Object.entries(payload.error.fieldErrors)
                  .map(([field, errors]) => {
                    if (Array.isArray(errors)) {
                      return `${field}: ${errors.join(", ")}`;
                    }
                    return `${field}: ${String(errors)}`;
                  })
                  .join("; ");
                if (fieldErrors) {
                  errorMessage = fieldErrors;
                }
              }
            }
          } else {
            const text = await response.text().catch(() => "");
            if (text && text.length <= 200) {
              errorMessage = text;
            }
          }
        } catch (parseError) {
          console.error("Failed to parse error response", parseError);
        }
        
        setError(errorMessage);
        return;
      }

      startTransition(() => {
        router.replace(`/${locale}/dashboard/menus/onboarding` as Route);
      });
    } catch (error) {
      console.error("Failed to save design preferences", error);
      setError(copy.errorFallback);
    }
  };

  const handleBack = () => {
    startTransition(() => {
      router.push(`/${locale}/dashboard/restaurant?onboarding=true` as Route);
    });
  };

  const handleSkip = () => {
    startTransition(() => {
      router.replace(`/${locale}/dashboard/menus/onboarding` as Route);
    });
  };

  const isSubmitting = form.formState.isSubmitting || isPending;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex h-full flex-col gap-8"
      >
        <motion.div
          className="space-y-6"
          variants={stepContainerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="grid gap-6"
            variants={stepItemVariants}
          >
            {/* Design URL */}
            <motion.div variants={formFieldVariants}>
              <FormField
                control={form.control}
                name="designUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{copy.designUrlLabel}</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder={copy.designUrlPlaceholder}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-slate-500">
                      {copy.designUrlHelper}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>

            {/* Divider with "or" */}
            <motion.div 
              className="flex items-center gap-4"
              variants={formFieldVariants}
              transition={{ delay: 0.15 }}
            >
              <div className="flex-1 border-t border-slate-200" />
              <span className="text-xs text-slate-400 uppercase tracking-wider">or</span>
              <div className="flex-1 border-t border-slate-200" />
            </motion.div>

            {/* Design Description */}
            <motion.div variants={formFieldVariants} transition={{ delay: 0.2 }}>
              <FormField
                control={form.control}
                name="designDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{copy.designDescriptionLabel}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={copy.designDescriptionPlaceholder}
                        className="min-h-[120px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>
          </motion.div>
        </motion.div>

        {error && (
          <motion.p
            className="text-sm font-semibold text-destructive"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {error}
          </motion.p>
        )}

        {/* Navigation buttons */}
        <motion.div
          className="flex gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <motion.div
            className="flex-1"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant="outline"
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              size="lg"
              className="w-full gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {copy.backButton}
            </Button>
          </motion.div>

          <motion.div
            className="flex-1"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              type="submit"
              className="w-full"
              disabled={
                isSubmitting ||
                Boolean(watchedDesignUrl && !validateDesignUrl(watchedDesignUrl)) ||
                (!watchedDesignUrl?.trim() && !watchedDesignDescription?.trim())
              }
              size="lg"
            >
              {isSubmitting ? copy.redirecting : copy.nextButton}
            </Button>
          </motion.div>
        </motion.div>
      </form>
    </Form>
  );
}

