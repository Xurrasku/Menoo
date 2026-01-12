"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { heroTextVariants, slideUpVariants, floatingVariants } from "./animation-variants";
import { AnimatedButton } from "./animated-components";

type HeroSectionProps = {
  locale: string;
  title: string;
  subtitle: string;
  ctaText: string;
};

export function HeroSection({ locale, title, subtitle, ctaText }: HeroSectionProps) {
  return (
    <section className="container mx-auto px-4 py-20 md:py-32">
      <div className="mx-auto max-w-4xl text-center">
        <motion.h1
          className="mb-6 font-display text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl"
          variants={heroTextVariants}
          initial="hidden"
          animate="visible"
        >
          {title}
        </motion.h1>
        <motion.p
          className="mb-8 text-lg text-muted-foreground md:text-xl lg:text-2xl"
          variants={slideUpVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          {subtitle}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Link href={`/${locale}/auth/sign-up`}>
            <AnimatedButton className="inline-block">
              <Button size="lg" className="text-lg">
                {ctaText}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </AnimatedButton>
          </Link>
        </motion.div>
        <motion.div
          className="mt-16 flex items-center justify-center"
          variants={floatingVariants}
          initial="initial"
          animate="animate"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
          >
            <Image
              src="/assets/hero-phone-mockup.png"
              alt="Mobile mockup showing QR code and digital menu"
              width={320}
              height={640}
              className="h-auto w-64 md:w-80"
              priority
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
