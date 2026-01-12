"use client";

import { useState, useTransition, useEffect } from "react";
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
    downloadQr?: string;
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
  const [qrBlob, setQrBlob] = useState<Blob | null>(null);

  // Clear onboarding session storage when reaching the final step
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("onboarding-restaurant-form");
      sessionStorage.removeItem("onboarding-design-form");
      sessionStorage.removeItem("onboarding-menu-state");
    }
  }, []);

  // Generate QR code
  useEffect(() => {
    let objectUrl: string | null = null;

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
          setQrBlob(blob);
          objectUrl = URL.createObjectURL(blob);
          setQrDataUrl(objectUrl);
        }
      } catch (error) {
        console.error("Failed to generate QR code", error);
      }
    };

    generateQr();

    // Cleanup function to revoke object URL
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [menuUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (qrDataUrl) {
        URL.revokeObjectURL(qrDataUrl);
      }
    };
  }, [qrDataUrl]);

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

  const handleDownloadQr = () => {
    if (!qrBlob) return;
    
    const url = URL.createObjectURL(qrBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `menu-qr-${restaurantName.toLowerCase().replace(/\s+/g, "-")}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      className="flex flex-col gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Title & Subtitle */}
      <motion.div 
        className="text-center space-y-3 mb-4"
        variants={itemVariants}
      >
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
          {copy.title}
        </h1>
        <p className="text-base text-slate-500 max-w-md mx-auto leading-relaxed">
          {copy.subtitle}
        </p>
        {restaurantName && (
          <p className="text-sm font-medium text-primary mt-2">
            {restaurantName}
          </p>
        )}
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

        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm font-medium text-slate-700">{copy.scanQr}</p>
          <a
            href={menuUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
          >
            {menuUrl}
            <ExternalLink className="h-4 w-4" />
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

        {qrBlob && copy.downloadQr && (
          <Button
            variant="outline"
            onClick={handleDownloadQr}
            disabled={isPending}
            size="lg"
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            {copy.downloadQr}
          </Button>
        )}

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
