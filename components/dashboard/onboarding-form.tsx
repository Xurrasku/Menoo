"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { motion, AnimatePresence, type Variants } from "framer-motion";
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
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toSlug } from "@/lib/restaurants/domain";
import { cn } from "@/lib/utils";

// Validation helper for design step
function validateDesignUrl(url: string): boolean {
  if (!url || url.trim().length === 0) return true; // Optional field
  try {
    // Normalize URL by adding https:// if no protocol is provided
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

const onboardingFormSchema = z.object({
  name: z.string().min(1, "Restaurant name is required"),
  slug: z.string().min(1, "URL is required"),
  size: z.string().min(1, "Please select a restaurant size"),
  referralSource: z.string().min(1, "Please tell us how you found us"),
  designUrl: z.string().optional(),
  designDescription: z.string().optional(),
}).refine(
  (data) => {
    // If designUrl is provided, it must be valid
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
    // At least one of designUrl or designDescription must be provided
    const hasUrl = data.designUrl && data.designUrl.trim().length > 0;
    const hasDescription = data.designDescription && data.designDescription.trim().length > 0;
    return hasUrl || hasDescription;
  },
  {
    message: "Please provide either a website URL or design description",
    path: ["designDescription"],
  }
);

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
  const [currentScreen, setCurrentScreen] = useState(1);
  const [submissionState, setSubmissionState] = useState<SubmissionState>({
    error: null,
    success: false,
  });
  const [slugAvailability, setSlugAvailability] = useState<SlugAvailability>({
    available: null,
    checking: false,
    slug: null,
  });

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      size: "",
      referralSource: "",
      designUrl: "",
      designDescription: "",
    },
  });

  const watchedName = useWatch({
    control: form.control,
    name: "name",
  });

  const watchedSlug = useWatch({
    control: form.control,
    name: "slug",
  });

  const watchedDesignUrl = useWatch({
    control: form.control,
    name: "designUrl",
  });

  const watchedDesignDescription = useWatch({
    control: form.control,
    name: "designDescription",
  });

  // Check if design step has valid input (at least one field filled)
  const isDesignStepValid = useMemo(() => {
    const hasUrl = watchedDesignUrl && watchedDesignUrl.trim().length > 0;
    const hasDescription = watchedDesignDescription && watchedDesignDescription.trim().length > 0;
    
    // If URL is provided, validate it
    if (hasUrl && !validateDesignUrl(watchedDesignUrl)) {
      return false;
    }
    
    return hasUrl || hasDescription;
  }, [watchedDesignUrl, watchedDesignDescription]);

  // Always sync slug from name
  useEffect(() => {
    if (watchedName && watchedName.trim().length > 0) {
      const generatedSlug = toSlug(watchedName.trim());
      if (generatedSlug) {
        form.setValue("slug", generatedSlug, { shouldValidate: false });
      }
    } else {
      form.setValue("slug", "", { shouldValidate: false });
    }
  }, [watchedName, form]);

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

  // Validate step 1 fields
  const validateStep1 = async (): Promise<boolean> => {
    const result = await form.trigger(["name", "slug", "size", "referralSource"]);
    return result;
  };

  // Validate design step - at least one field required
  const validateStep2 = async (): Promise<boolean> => {
    const hasUrl = watchedDesignUrl && watchedDesignUrl.trim().length > 0;
    const hasDescription = watchedDesignDescription && watchedDesignDescription.trim().length > 0;
    
    // At least one field must be provided
    if (!hasUrl && !hasDescription) {
      form.setError("designDescription", { message: copy.designValidationError });
      return false;
    }
    
    // If URL is provided, it must be valid
    if (hasUrl) {
      const isValidUrl = validateDesignUrl(watchedDesignUrl);
      if (!isValidUrl) {
        form.setError("designUrl", { message: copy.designInvalidUrl });
        return false;
      }
    }
    
    return true;
  };

  // Handle next step
  const handleNextStep = async () => {
    resetState();
    
    if (currentScreen === 1) {
      const isValid = await validateStep1();
      if (isValid) {
        setCurrentScreen(2);
      }
    } else if (currentScreen === 2) {
      // On design step, validate (design is optional) and submit to proceed to menu onboarding
      const isValid = await validateStep2();
      if (isValid) {
        await form.handleSubmit(onSubmit)();
      }
    }
  };

  // Handle back step
  const handleBackStep = () => {
    if (currentScreen > 1) {
      setCurrentScreen(currentScreen - 1);
    }
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
      
      const payload = {
        name: values.name.trim(),
        slug: normalizedSlug,
        size: values.size as "small" | "medium" | "large" | "maxi",
        referralSource: values.referralSource,
        designUrl: normalizeDesignUrl(values.designUrl),
        designDescription: values.designDescription?.trim() || null,
        testMode: isTestMode,
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
        const payload = await response.json().catch(() => null);
        console.error("API Error:", payload);
        const message =
          typeof payload?.error === "string"
            ? payload.error
            : payload?.error?.formErrors?.join(" ") 
            ?? payload?.error?.fieldErrors 
            ? Object.entries(payload.error.fieldErrors || {})
                .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(", ") : errors}`)
                .join("; ")
            : copy.errorFallback;

        setSubmissionState({ error: message, success: false });
        return;
      }

      setSubmissionState({ error: null, success: true });

      startTransition(() => {
        router.replace(`/${locale}/dashboard/menus/onboarding` as Route);
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
        {/* Progress indicator */}
        <motion.div 
          className="space-y-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <div className="relative">
            {/* Diamond markers */}
            <div className="absolute -top-2 left-0 right-0 flex justify-between px-0">
              {[1, 2, 3, 4].map((step) => (
                <motion.div
                  key={step}
                  className="relative flex items-center justify-center"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ 
                    delay: 0.3 + (step * 0.1),
                    duration: 0.4,
                    ease: [0.25, 0.1, 0.25, 1]
                  }}
                >
                  <motion.div
                    className={cn(
                      "w-3 h-3 rotate-45 border-2 transition-colors duration-300",
                      currentScreen >= step
                        ? "bg-gradient-to-br from-primary to-violet-500 border-primary"
                        : "bg-white border-slate-300"
                    )}
                    animate={{
                      scale: currentScreen === step ? [1, 1.2, 1] : 1,
                    }}
                    transition={{
                      scale: {
                        duration: 0.6,
                        repeat: currentScreen === step ? Infinity : 0,
                        repeatType: "reverse",
                        ease: "easeInOut",
                      },
                    }}
                  />
                </motion.div>
              ))}
            </div>
            
            {/* Progress bar */}
            <div className="relative h-1 w-full rounded-full bg-slate-100 overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-violet-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${currentScreen * 25}%` }}
                transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              />
            </div>
          </div>
          
          <div className="flex justify-between text-xs text-slate-400">
            <span className={currentScreen >= 1 ? "text-primary font-medium" : ""}>Restaurant Details</span>
            <span className={currentScreen >= 2 ? "text-primary font-medium" : ""}>Design</span>
            <span>Menu</span>
            <span>Enjoy</span>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Step 1: Restaurant Info */}
          {currentScreen === 1 && (
            <motion.div
              key="step1"
              className="space-y-6"
              variants={stepContainerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <motion.div
                className="grid gap-5"
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

                {/* URL - Synced with name, showing full domain */}
                <motion.div variants={formFieldVariants} transition={{ delay: 0.15 }}>
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{copy.urlLabel}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <div className="flex items-center rounded-md border border-input bg-slate-50 overflow-hidden">
                              <span className="px-3 py-2 text-sm text-slate-500 bg-slate-100 border-r border-input whitespace-nowrap">
                                go.nordqr.com/
                              </span>
                              <input
                                className="flex-1 h-10 px-3 py-2 text-sm bg-transparent focus:outline-none"
                                placeholder={copy.urlPlaceholder}
                                value={field.value}
                                readOnly
                              />
                            </div>
                          </div>
                        </FormControl>
                        <AnimatePresence>
                          {slugAvailability.checking && (
                            <motion.p
                              className="text-sm text-slate-600"
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              transition={{ duration: 0.2 }}
                            >
                              {copy.checkingAvailability}
                            </motion.p>
                          )}
                          {slugAvailability.available === true && (
                            <motion.p
                              className="text-sm font-semibold text-emerald-600"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.3 }}
                            >
                              {copy.urlAvailable}
                            </motion.p>
                          )}
                          {slugAvailability.available === false && (
                            <motion.p
                              className="text-sm font-semibold text-destructive"
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

                {/* Referral Source - Dropdown */}
                <motion.div variants={formFieldVariants} transition={{ delay: 0.25 }}>
                  <FormField
                    control={form.control}
                    name="referralSource"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{copy.referralLabel}</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            placeholder={copy.referralPlaceholder}
                            options={[
                              { value: "google", label: copy.referralGoogle },
                              { value: "social", label: copy.referralSocial },
                              { value: "friend", label: copy.referralFriend },
                              { value: "other_restaurant", label: copy.referralOtherRestaurant },
                              { value: "other", label: copy.referralOther },
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
          )}

          {/* Step 2: Design Preferences */}
          {currentScreen === 2 && (
            <motion.div
              key="step2"
              className="space-y-6"
              variants={stepContainerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <motion.div
                className="grid gap-5"
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
          )}
        </AnimatePresence>

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
          {/* Back button - only show on step 2+ */}
          {currentScreen > 1 && (
            <motion.div
              className="flex-1"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                type="button"
                variant="outline"
                onClick={handleBackStep}
                disabled={isSubmitting}
                size="lg"
                className="w-full gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {copy.backButton}
              </Button>
            </motion.div>
          )}

          {/* Step 1: Next button */}
          {currentScreen === 1 && (
            <motion.div
              className="flex-1"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                type="button"
                onClick={handleNextStep}
                className="w-full"
                disabled={isSubmitting}
                size="lg"
              >
                {copy.nextButton}
              </Button>
            </motion.div>
          )}

          {/* Step 2: Continue to Menu */}
          {currentScreen === 2 && (
            <motion.div
              className="flex-1"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                type="button"
                onClick={handleNextStep}
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
          )}
        </motion.div>
      </form>
    </Form>
  );
}
