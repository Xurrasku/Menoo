"use client";

import type { ComponentProps } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

import {
  staggerContainerVariants,
  slideUpVariants,
  scrollViewportConfig,
} from "./animation-variants";

type FooterLink = {
  label: string;
  href: string;
};

type FooterProps = {
  description: string;
  copyright: string;
  product: {
    title: string;
    links: FooterLink[];
  };
  company: {
    title: string;
    links: FooterLink[];
  };
  legal: {
    title: string;
    links: FooterLink[];
  };
};

export function AnimatedFooter({ description, copyright, product, company, legal }: FooterProps) {
  return (
    <motion.footer
      className="border-t border-border bg-muted/30 py-12"
      variants={slideUpVariants}
      initial="hidden"
      whileInView="visible"
      viewport={scrollViewportConfig}
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          <motion.div
            className="grid gap-8 md:grid-cols-4"
            variants={staggerContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={scrollViewportConfig}
          >
            <motion.div variants={slideUpVariants}>
              <div className="mb-4">
                <Image
                  src="/assets/logo.png"
                  alt="Menoo"
                  width={100}
                  height={33}
                  className="h-6 w-auto"
                />
              </div>
              <p className="text-sm text-muted-foreground">{description}</p>
            </motion.div>
            <motion.div variants={slideUpVariants}>
              <h4 className="mb-4 font-semibold text-foreground">{product.title}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {product.links.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href as ComponentProps<typeof Link>["href"]}
                      className="hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div variants={slideUpVariants}>
              <h4 className="mb-4 font-semibold text-foreground">{company.title}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {company.links.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href as ComponentProps<typeof Link>["href"]}
                      className="hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div variants={slideUpVariants}>
              <h4 className="mb-4 font-semibold text-foreground">{legal.title}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {legal.links.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href as ComponentProps<typeof Link>["href"]}
                      className="hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
          <motion.div
            className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            {copyright}
          </motion.div>
        </div>
      </div>
    </motion.footer>
  );
}
