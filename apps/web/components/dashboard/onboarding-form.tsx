"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { motion, AnimatePresence, type Variants } from "framer-motion";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toSlug } from "@/lib/restaurants/domain";

const onboardingFormSchema = z.object({
  name: z.string().min(1, "Restaurant name is required"),
  slug: z.string().min(1, "URL is required"),
  size: z.string().min(1, "Please select a restaurant size"),
  referralSource: z.string().optional(),
});

type OnboardingFormValues = z.infer<typeof onboardingFormSchema>;

export type OnboardingCopy = {
  title: string;
  subtitle: string;
  step1Title: string;
  step1Subtitle: string;
  step2Title: string;
  step2Subtitle: string;
  nameLabel: string;
  namePlaceholder: string;
  urlLabel: string;
  urlPlaceholder: string;
  urlHelper: string;
  checkingAvailability: string;
  urlAvailable: string;
  urlUnavailable: string;
  sizeLabel: string;
  sizePlaceholder: string;
  sizeSmall: string;
  sizeMedium: string;
  sizeLarge: string;
  sizeMaxi: string;
  referralLabel: string;
  referralPlaceholder: string;
  referralGoogle: string;
  referralSocial: string;
  referralFriend: string;
  referralOtherRestaurant: string;
  referralOther: string;
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
  submitCta: string;
  redirecting: string;
  success: string;
  errorFallback: string;
};

type OnboardingFormProps = {
  locale: string;
  copy: OnboardingCopy;
};

type SubmissionState = {
  error: string | null;
  success: boolean;
};

type SlugAvailability = {
  available: boolean | null;
  checking: boolean;
  slug: string | null;
};

// Main onboarding screens - these are the high-level steps
const ONBOARDING_SCREENS = [
  { id: 1, key: "restaurant" as const, name: "Restaurant" },
  { id: 2, key: "design" as const, name: "Design" },
  { id: 3, key: "menus" as const, name: "Menus" },
  { id: 4, key: "languages" as const, name: "Languages" },
  { id: 5, key: "qr" as const, name: "QR" },
] as const;

// Animation variants
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
  exit: {
    opacity: 0,
    x: -20,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1],
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

const progressIndicatorVariants: Variants = {
  hidden: {
    scale: 0.8,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

const progressLineVariants: Variants = {
  hidden: {
    scaleX: 0,
    opacity: 0,
  },
  visible: {
    scaleX: 1,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

const titleVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

const subtitleVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1],
      delay: 0.1,
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

export function OnboardingForm({ locale, copy }: OnboardingFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const isTestMode = searchParams.get("test") === "true" || searchParams.get("onboarding") === "true";
  const [submissionState, setSubmissionState] = useState<SubmissionState>({
    error: null,
    success: false,
  });
  const [slugAvailability, setSlugAvailability] = useState<SlugAvailability>({
    available: null,
    checking: false,
    slug: null,
  });

  // Restore form state from sessionStorage
  const getStoredFormData = (): Partial<OnboardingFormValues> => {
    if (typeof window === "undefined") return {};
    try {
      const stored = sessionStorage.getItem("onboarding-restaurant-form");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to parse stored form data", error);
    }
    return {};
  };

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      size: "",
      referralSource: undefined,
      ...getStoredFormData(),
    },
  });

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Save form state to sessionStorage whenever it changes
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("onboarding-restaurant-form", JSON.stringify(values));
        } catch (error) {
          console.error("Failed to save form data", error);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const watchedName = useWatch({
    control: form.control,
    name: "name",
  });

  const watchedSlug = useWatch({
    control: form.control,
    name: "slug",
  });

  // Always sync slug from name (unless manually edited)
  useEffect(() => {
    if (!slugManuallyEdited && watchedName && watchedName.trim().length > 0) {
      const generatedSlug = toSlug(watchedName.trim());
      if (generatedSlug) {
        form.setValue("slug", generatedSlug, { shouldValidate: false });
      }
    } else if (!slugManuallyEdited && (!watchedName || watchedName.trim().length === 0)) {
      form.setValue("slug", "", { shouldValidate: false });
    }
  }, [watchedName, form, slugManuallyEdited]);

  const checkSlugAvailability = async (slug: string) => {
    setSlugAvailability({ available: null, checking: true, slug });
    
    try {
      const response = await fetch("/api/restaurants/check-slug", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slug }),
      });

      if (!response.ok) {
        setSlugAvailability({ available: false, checking: false, slug });
        return;
      }

      const data = await response.json();
      const normalizedSlug = data.slug || slug;
      
      // Update form with normalized slug
      if (normalizedSlug !== watchedSlug) {
        form.setValue("slug", normalizedSlug, { shouldValidate: true });
      }

      setSlugAvailability({
        available: data.available,
        checking: false,
        slug: normalizedSlug,
      });
    } catch (error) {
      console.error("Failed to check slug availability", error);
      setSlugAvailability({ available: false, checking: false, slug });
    }
  };

  // Check slug availability when slug changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (watchedSlug && watchedSlug.trim().length > 0) {
        const normalizedSlug = toSlug(watchedSlug.trim());
        if (normalizedSlug && normalizedSlug !== slugAvailability.slug) {
          checkSlugAvailability(normalizedSlug);
        }
      }
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedSlug]);

  const resetState = () => {
    setSubmissionState({ error: null, success: false });
  };

  const onSubmit = async (values: OnboardingFormValues) => {
    resetState();

    try {
      const normalizedSlug = toSlug(values.slug.trim());
      
      if (!normalizedSlug) {
        setSubmissionState({ 
          error: "Invalid URL. Please check your restaurant name.", 
          success: false 
        });
        return;
      }
      
      const payload: {
        name: string;
        slug: string;
        size: "small" | "medium" | "large" | "maxi";
        referralSource?: string;
        testMode?: boolean;
      } = {
        name: values.name.trim(),
        slug: normalizedSlug,
        size: values.size as "small" | "medium" | "large" | "maxi",
        ...(values.referralSource && { referralSource: values.referralSource }),
        ...(isTestMode && { testMode: isTestMode }),
      };
      
      console.log("Submitting payload:", payload);
      
      const response = await fetch("/api/restaurants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = copy.errorFallback;
        
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const payload = await response.json().catch(() => null);
            
            if (payload) {
              // Handle string error
              if (typeof payload.error === "string") {
                errorMessage = payload.error;
              }
              // Handle form errors
              else if (payload.error?.formErrors && Array.isArray(payload.error.formErrors)) {
                errorMessage = payload.error.formErrors.join(" ");
              }
              // Handle field errors
              else if (payload.error?.fieldErrors && typeof payload.error.fieldErrors === "object") {
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
            // Try to get error text if not JSON
            const text = await response.text().catch(() => "");
            if (text) {
              errorMessage = text.length > 200 ? copy.errorFallback : text;
            }
          }
        } catch (parseError) {
          console.error("Failed to parse error response", parseError);
          // Use fallback message
        }

        setSubmissionState({ error: errorMessage, success: false });
        return;
      }

      setSubmissionState({ error: null, success: true });

      startTransition(() => {
        router.replace(`/${locale}/dashboard/design/onboarding` as Route);
      });
    } catch (error) {
      console.error("Onboarding failed", error);
      setSubmissionState({ error: copy.errorFallback, success: false });
    }
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
                {/* Restaurant Name */}
                <motion.div variants={formFieldVariants}>
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
                </motion.div>

                {/* URL - Synced with name, showing full domain, editable */}
                <motion.div variants={formFieldVariants} transition={{ delay: 0.15 }}>
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{copy.urlLabel}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <div className="flex items-center rounded-md border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-all">
                              <span className="px-3 py-2 text-sm text-muted-foreground bg-muted border-r border-input whitespace-nowrap">
                                go.nordqr.com/
                              </span>
                              <input
                                className="flex-1 h-10 px-3 py-2 text-sm bg-transparent focus:outline-none placeholder:text-muted-foreground"
                                placeholder={copy.urlPlaceholder}
                                value={field.value}
                                onChange={(e) => {
                                  const value = toSlug(e.target.value.trim());
                                  field.onChange(value);
                                  setSlugManuallyEdited(true);
                                }}
                                onBlur={field.onBlur}
                              />
                            </div>
                          </div>
                        </FormControl>
                        <AnimatePresence mode="wait">
                          {slugAvailability.checking && (
                            <motion.p
                              key="checking"
                              className="text-sm text-muted-foreground mt-1.5"
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              transition={{ duration: 0.2 }}
                            >
                              {copy.checkingAvailability}
                            </motion.p>
                          )}
                          {slugAvailability.available === true && !slugAvailability.checking && (
                            <motion.p
                              key="available"
                              className="text-sm font-medium text-emerald-600 mt-1.5"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.3 }}
                            >
                              {copy.urlAvailable}
                            </motion.p>
                          )}
                          {slugAvailability.available === false && !slugAvailability.checking && (
                            <motion.p
                              key="unavailable"
                              className="text-sm font-medium text-destructive mt-1.5"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.3 }}
                            >
                              {copy.urlUnavailable}
                            </motion.p>
                          )}
                        </AnimatePresence>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                {/* Restaurant Size - Dropdown */}
                <motion.div variants={formFieldVariants} transition={{ delay: 0.2 }}>
                  <FormField
                    control={form.control}
                    name="size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{copy.sizeLabel}</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            placeholder={copy.sizePlaceholder}
                            options={[
                              { value: "small", label: copy.sizeSmall },
                              { value: "medium", label: copy.sizeMedium },
                              { value: "large", label: copy.sizeLarge },
                              { value: "maxi", label: copy.sizeMaxi },
                            ]}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
              </motion.div>
            </motion.div>

        <AnimatePresence>
          {submissionState.error && (
            <motion.p
              className="text-sm font-semibold text-destructive"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              {submissionState.error}
            </motion.p>
          )}

          {submissionState.success && (
            <motion.p
              className="text-sm font-semibold text-emerald-600"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              {copy.success}
            </motion.p>
          )}
        </AnimatePresence>

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
              type="submit"
              className="w-full"
              disabled={isSubmitting}
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
