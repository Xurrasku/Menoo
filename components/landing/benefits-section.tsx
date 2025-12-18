"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { QrCode, Smartphone, Globe, BarChart3, Image as ImageIcon, Zap } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  slideUpVariants,
  staggerContainerVariants,
  cardRevealVariants,
  scaleOnHoverVariants,
  scrollViewportConfig,
} from "./animation-variants";

type BenefitItem = {
  icon: string;
  title: string;
  description: string;
};

type BenefitsSectionProps = {
  title: string;
  items: BenefitItem[];
};

const icons: Record<string, ReactNode> = {
  zap: <Zap className="h-8 w-8 text-primary" />,
  globe: <Globe className="h-8 w-8 text-primary" />,
  qr: <QrCode className="h-8 w-8 text-primary" />,
  smartphone: <Smartphone className="h-8 w-8 text-primary" />,
  image: <ImageIcon className="h-8 w-8 text-primary" />,
  chart: <BarChart3 className="h-8 w-8 text-primary" />,
};

export function BenefitsSection({ title, items }: BenefitsSectionProps) {
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="mx-auto max-w-6xl px-8">
        <motion.h2
          className="mb-12 text-center font-display text-3xl font-bold text-foreground md:text-4xl"
          variants={slideUpVariants}
          initial="hidden"
          whileInView="visible"
          viewport={scrollViewportConfig}
        >
          {title}
        </motion.h2>
        <motion.div
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-2"
          variants={staggerContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={scrollViewportConfig}
        >
          {items.map((item, index) => (
            <motion.div
              key={index}
              variants={cardRevealVariants}
              whileHover={scaleOnHoverVariants.hover}
              whileTap={scaleOnHoverVariants.tap}
            >
              <Card className="border-border h-full transition-shadow hover:shadow-lg">
                <CardHeader>
                  <motion.div
                    className="mb-4"
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + index * 0.1, duration: 0.5, type: "spring" }}
                  >
                    {icons[item.icon] || <Zap className="h-8 w-8 text-primary" />}
                  </motion.div>
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{item.description}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
