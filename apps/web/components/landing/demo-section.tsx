"use client";

import { motion } from "framer-motion";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  slideUpVariants,
  slideFromLeftVariants,
  slideFromRightVariants,
  scrollViewportConfig,
} from "./animation-variants";

type DemoSectionProps = {
  title: string;
  panel: {
    title: string;
    description: string;
    placeholder: string;
  };
  menu: {
    title: string;
    description: string;
    placeholder: string;
  };
};

export function DemoSection({ title, panel, menu }: DemoSectionProps) {
  return (
    <section className="border-y border-border bg-muted/30 py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          <motion.h2
            className="mb-12 text-center font-display text-3xl font-bold text-foreground md:text-4xl"
            variants={slideUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={scrollViewportConfig}
          >
            {title}
          </motion.h2>
          <div className="grid gap-8 md:grid-cols-2">
            <motion.div
              variants={slideFromLeftVariants}
              initial="hidden"
              whileInView="visible"
              viewport={scrollViewportConfig}
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="border-border h-full transition-shadow hover:shadow-lg">
                <CardHeader>
                  <CardTitle>{panel.title}</CardTitle>
                  <CardDescription>{panel.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <motion.div
                    className="flex h-64 items-center justify-center rounded-lg bg-muted overflow-hidden"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="text-center text-muted-foreground">{panel.placeholder}</div>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              variants={slideFromRightVariants}
              initial="hidden"
              whileInView="visible"
              viewport={scrollViewportConfig}
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="border-border h-full transition-shadow hover:shadow-lg">
                <CardHeader>
                  <CardTitle>{menu.title}</CardTitle>
                  <CardDescription>{menu.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <motion.div
                    className="flex h-64 items-center justify-center rounded-lg bg-muted overflow-hidden"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="text-center text-muted-foreground">{menu.placeholder}</div>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
