"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { slideUpVariants, scrollViewportConfig, pulseVariants } from "./animation-variants";
import { AnimatedButton } from "./animated-components";

type CTASectionProps = {
  locale: string;
  title: string;
  ctaText: string;
};

export function CTASection({ locale, title, ctaText }: CTASectionProps) {
  return (
    <section className="container mx-auto px-4 py-20">
      <motion.div
        className="mx-auto max-w-2xl text-center"
        variants={slideUpVariants}
        initial="hidden"
        whileInView="visible"
        viewport={scrollViewportConfig}
      >
        <motion.h2
          className="mb-6 font-display text-3xl font-bold text-foreground md:text-4xl"
          variants={pulseVariants}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          {title}
        </motion.h2>
        <Link href={`/${locale}/auth/sign-up`}>
          <AnimatedButton className="inline-block">
            <Button size="lg" className="text-lg">
              {ctaText}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </AnimatedButton>
        </Link>
      </motion.div>
    </section>
  );
}
