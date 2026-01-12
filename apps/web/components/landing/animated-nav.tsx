"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";

type AnimatedNavBarProps = {
  locale: string;
  signInText: string;
  ctaText: string;
};

export function AnimatedNavBar({ locale, signInText, ctaText }: AnimatedNavBarProps) {
  return (
    <motion.nav
      className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-0"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="flex h-24 w-full items-stretch justify-between px-4 py-0 lg:px-8">
        <Link href={`/${locale}/landing`} className="flex items-stretch">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <Image
              src="/assets/logo.png"
              alt="Menoo"
              width={250}
              height={83}
              className="w-auto h-full object-contain"
              priority
            />
          </motion.div>
        </Link>
        <motion.div
          className="flex items-center gap-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <Link href={`/${locale}/auth/sign-in`}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="ghost">{signInText}</Button>
            </motion.div>
          </Link>
          <Link href={`/${locale}/auth/sign-up`}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button>{ctaText}</Button>
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </motion.nav>
  );
}
