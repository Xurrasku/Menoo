"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type UpgradePlanButtonProps = {
  locale: string;
  label: string;
  loadingLabel: string;
  priceLabel?: string;
  errorLabel?: string;
  restaurantId?: string;
  customerEmail?: string;
  returnPath?: string;
  className?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  align?: "inline" | "stacked";
  fullWidth?: boolean;
};

type FetchError = Error & { status?: number };

export function UpgradePlanButton({
  locale,
  label,
  loadingLabel,
  priceLabel,
  errorLabel = "We couldn't start the checkout. Please try again.",
  restaurantId,
  customerEmail,
  returnPath,
  className,
  variant = "default",
  size,
  align = "inline",
  fullWidth,
}: UpgradePlanButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locale,
          restaurantId,
          customerEmail,
          returnPath,
        }),
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        const errorMessage = (error?.error ?? response.statusText) || "Request failed";
        const err = new Error(errorMessage) as FetchError;
        err.status = response.status;
        throw err;
      }

      const data = (await response.json().catch(() => null)) as
        | { url?: string }
        | null;

      if (!data?.url) {
        throw new Error("Missing Stripe checkout URL");
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("Failed to start Stripe checkout", error);
      setIsLoading(false);

      if (typeof window !== "undefined" && errorLabel) {
        window.alert(errorLabel);
      }
    }
  }

  const ContentIcon = isLoading ? Loader2 : Sparkles;
  const showPrice = Boolean(priceLabel) && !isLoading;

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={cn(fullWidth && "w-full", "items-center", className)}
    >
      <ContentIcon className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
      <div
        className={cn(
          "flex min-w-0 items-center gap-2",
          align === "stacked" && "flex-col items-start gap-0"
        )}
      >
        <span className="text-sm font-semibold">
          {isLoading ? loadingLabel : label}
        </span>
        {showPrice ? (
          <span
            className={cn(
              "truncate text-xs font-medium",
              align === "stacked" ? "text-slate-500" : "text-primary"
            )}
          >
            {priceLabel}
          </span>
        ) : null}
      </div>
    </Button>
  );
}


