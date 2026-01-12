"use client";

import { motion } from "framer-motion";

import { slideUpVariants, scrollViewportConfig } from "./animation-variants";

type ProblemSectionProps = {
  description: string;
};

export function ProblemSection({ description }: ProblemSectionProps) {
  return (
    <section className="border-y border-border bg-muted/30 py-20">
      <div className="container mx-auto px-4">
        <motion.div
          className="mx-auto max-w-3xl text-center"
          variants={slideUpVariants}
          initial="hidden"
          whileInView="visible"
          viewport={scrollViewportConfig}
        >
          <p className="text-lg leading-relaxed text-foreground md:text-xl md:leading-relaxed">
            {description}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
