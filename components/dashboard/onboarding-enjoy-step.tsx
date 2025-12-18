"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { motion, type Variants } from "framer-motion";
import { ExternalLink, ArrowRight, ArrowLeft, Download } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";

type OnboardingEnjoyStepProps = {
  locale: string;
  copy: {
    title: string;
    subtitle: string;
    description: string;
    scanQr: string;
    menuUrl: string;
    goToDashboard: string;
    back: string;
  };
  menuUrl: string;
  restaurantName: string;
};

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, staggerChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function OnboardingEnjoyStep({ 
  locale, 
  copy, 
  menuUrl,
  restaurantName,
}: OnboardingEnjoyStepProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Generate QR code
  useState(() => {
    const generateQr = async () => {
      try {
        const response = await fetch("/api/qr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            url: menuUrl,
            size: 512,
          }),
        });

        if (response.ok) {
          const blob = await response.blob();
          const dataUrl = URL.createObjectURL(blob);
          setQrDataUrl(dataUrl);
        }
      } catch (error) {
        console.error("Failed to generate QR code", error);
      }
    };

    generateQr();
  });

  const handleGoToDashboard = () => {
    startTransition(() => {
      router.replace(`/${locale}/dashboard/menus` as Route);
    });
  };

  const handleBack = () => {
    startTransition(() => {
      router.push(`/${locale}/dashboard/menus/onboarding` as Route);
    });
  };

  return (
    <motion.div
      className="flex flex-col gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Progress indicator */}
      <motion.div 
        className="space-y-3"
        variants={itemVariants}
      >
        <div className="relative h-1 w-full rounded-full bg-slate-100 overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-violet-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400">
          <span className="text-primary font-medium">Restaurant Details</span>
          <span className="text-primary font-medium">Design</span>
          <span className="text-primary font-medium">Menu</span>
          <span className="text-primary font-medium">Enjoy</span>
        </div>
      </motion.div>

      {/* Title & Subtitle */}
      <motion.div 
        className="text-center space-y-3 mb-2"
        variants={itemVariants}
      >
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
          {copy.title}
        </h1>
        <p className="text-base text-slate-500 max-w-md mx-auto leading-relaxed">
          {copy.subtitle}
        </p>
      </motion.div>

      {/* QR Code Display */}
      <motion.div
        className="flex flex-col items-center gap-6"
        variants={itemVariants}
      >
        <div className="relative rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-200/60">
          {qrDataUrl ? (
            <Image
              src={qrDataUrl}
              alt="Menu QR Code"
              width={256}
              height={256}
              className="rounded-lg"
              priority
            />
          ) : (
            <div className="h-64 w-64 animate-pulse rounded-lg bg-slate-100" />
          )}
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm font-medium text-slate-700">{copy.scanQr}</p>
          <a
            href={menuUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            {menuUrl}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </motion.div>

      {/* Description */}
      <motion.div
        className="rounded-xl bg-slate-50/50 p-6 text-center ring-1 ring-slate-200/60"
        variants={itemVariants}
      >
        <p className="text-slate-600 leading-relaxed">
          {copy.description}
        </p>
      </motion.div>

      {/* Action Buttons */}
      <motion.div 
        className="flex flex-col gap-3"
        variants={itemVariants}
      >
        <Button
          onClick={handleGoToDashboard}
          disabled={isPending}
          size="lg"
          className="w-full"
        >
          {copy.goToDashboard}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          onClick={handleBack}
          disabled={isPending}
          size="lg"
          className="w-full"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {copy.back}
        </Button>
      </motion.div>
    </motion.div>
  );
}
