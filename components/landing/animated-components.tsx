"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef, type ReactNode } from "react";

import {
  fadeInVariants,
  slideUpVariants,
  slideFromLeftVariants,
  slideFromRightVariants,
  staggerContainerVariants,
  scaleOnHoverVariants,
  heroTextVariants,
  cardRevealVariants,
  floatingVariants,
  scrollViewportConfig,
  fastStaggerContainerVariants,
} from "./animation-variants";

type AnimatedDivProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
};

/**
 * Fade in animation wrapper
 */
export const FadeIn = forwardRef<HTMLDivElement, AnimatedDivProps>(
  ({ children, ...props }, ref) => (
    <motion.div
      ref={ref}
      variants={fadeInVariants}
      initial="hidden"
      whileInView="visible"
      viewport={scrollViewportConfig}
      {...props}
    >
      {children}
    </motion.div>
  )
);
FadeIn.displayName = "FadeIn";

/**
 * Slide up animation wrapper
 */
export const SlideUp = forwardRef<HTMLDivElement, AnimatedDivProps>(
  ({ children, ...props }, ref) => (
    <motion.div
      ref={ref}
      variants={slideUpVariants}
      initial="hidden"
      whileInView="visible"
      viewport={scrollViewportConfig}
      {...props}
    >
      {children}
    </motion.div>
  )
);
SlideUp.displayName = "SlideUp";

/**
 * Slide from left animation wrapper
 */
export const SlideFromLeft = forwardRef<HTMLDivElement, AnimatedDivProps>(
  ({ children, ...props }, ref) => (
    <motion.div
      ref={ref}
      variants={slideFromLeftVariants}
      initial="hidden"
      whileInView="visible"
      viewport={scrollViewportConfig}
      {...props}
    >
      {children}
    </motion.div>
  )
);
SlideFromLeft.displayName = "SlideFromLeft";

/**
 * Slide from right animation wrapper
 */
export const SlideFromRight = forwardRef<HTMLDivElement, AnimatedDivProps>(
  ({ children, ...props }, ref) => (
    <motion.div
      ref={ref}
      variants={slideFromRightVariants}
      initial="hidden"
      whileInView="visible"
      viewport={scrollViewportConfig}
      {...props}
    >
      {children}
    </motion.div>
  )
);
SlideFromRight.displayName = "SlideFromRight";

/**
 * Container that staggers its children's animations
 */
export const StaggerContainer = forwardRef<HTMLDivElement, AnimatedDivProps>(
  ({ children, ...props }, ref) => (
    <motion.div
      ref={ref}
      variants={staggerContainerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={scrollViewportConfig}
      {...props}
    >
      {children}
    </motion.div>
  )
);
StaggerContainer.displayName = "StaggerContainer";

/**
 * Fast stagger container for quicker animations
 */
export const FastStaggerContainer = forwardRef<HTMLDivElement, AnimatedDivProps>(
  ({ children, ...props }, ref) => (
    <motion.div
      ref={ref}
      variants={fastStaggerContainerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={scrollViewportConfig}
      {...props}
    >
      {children}
    </motion.div>
  )
);
FastStaggerContainer.displayName = "FastStaggerContainer";

/**
 * Child item for stagger containers
 */
export const StaggerItem = forwardRef<HTMLDivElement, AnimatedDivProps>(
  ({ children, ...props }, ref) => (
    <motion.div ref={ref} variants={slideUpVariants} {...props}>
      {children}
    </motion.div>
  )
);
StaggerItem.displayName = "StaggerItem";

/**
 * Hero text with dramatic entrance animation
 */
export const HeroText = forwardRef<HTMLDivElement, AnimatedDivProps>(
  ({ children, ...props }, ref) => (
    <motion.div
      ref={ref}
      variants={heroTextVariants}
      initial="hidden"
      animate="visible"
      {...props}
    >
      {children}
    </motion.div>
  )
);
HeroText.displayName = "HeroText";

/**
 * Card with reveal animation and hover effects
 */
export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedDivProps>(
  ({ children, ...props }, ref) => (
    <motion.div
      ref={ref}
      variants={cardRevealVariants}
      whileHover="hover"
      whileTap="tap"
      {...scaleOnHoverVariants}
      {...props}
    >
      {children}
    </motion.div>
  )
);
AnimatedCard.displayName = "AnimatedCard";

/**
 * Floating element for decorative purposes
 */
export const FloatingElement = forwardRef<HTMLDivElement, AnimatedDivProps>(
  ({ children, ...props }, ref) => (
    <motion.div
      ref={ref}
      variants={floatingVariants}
      initial="initial"
      animate="animate"
      {...props}
    >
      {children}
    </motion.div>
  )
);
FloatingElement.displayName = "FloatingElement";

/**
 * Animated button wrapper with scale effects
 */
export const AnimatedButton = forwardRef<HTMLDivElement, AnimatedDivProps>(
  ({ children, ...props }, ref) => (
    <motion.div
      ref={ref}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15 }}
      {...props}
    >
      {children}
    </motion.div>
  )
);
AnimatedButton.displayName = "AnimatedButton";

/**
 * Section wrapper with scroll-triggered fade in
 */
export const AnimatedSection = forwardRef<HTMLDivElement, AnimatedDivProps>(
  ({ children, ...props }, ref) => (
    <motion.div
      ref={ref}
      variants={fadeInVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      {...props}
    >
      {children}
    </motion.div>
  )
);
AnimatedSection.displayName = "AnimatedSection";

/**
 * Animated navigation bar
 */
export const AnimatedNav = forwardRef<HTMLDivElement, AnimatedDivProps>(
  ({ children, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      {...props}
    >
      {children}
    </motion.div>
  )
);
AnimatedNav.displayName = "AnimatedNav";

/**
 * Re-export motion for custom animations
 */
export { motion };
