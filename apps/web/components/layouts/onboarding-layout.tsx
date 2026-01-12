"use client";

import { type ReactNode } from "react";
import { motion, type Variants } from "framer-motion";
import Image from "next/image";

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } 
  },
};

const slideUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } 
  },
};

const stagger: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

type OnboardingLayoutProps = {
  children: ReactNode;
  /** Engaging subtitle shown below the logo */
  subtitle?: string;
  showTestBanner?: boolean;
  /** Global onboarding progress stepper */
  currentStep?: number;
  totalSteps?: number;
  stepLabels?: string[];
};

export function OnboardingLayout({ 
  children, 
  subtitle,
  showTestBanner = false,
  currentStep,
  totalSteps,
  stepLabels,
}: OnboardingLayoutProps) {
  const showStepper = currentStep !== undefined && totalSteps !== undefined;

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-violet-50/30" />
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-primary/5 to-violet-100/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-blue-50/40 to-primary/5 blur-3xl" />
      </div>

      <motion.div 
        className="relative flex min-h-screen flex-col"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        {/* Logo + Subtitle Header */}
        <motion.header 
          className="flex flex-col items-center pt-10 pb-8 md:pt-14 md:pb-10"
          variants={fadeIn}
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Image
              src="/assets/logo.png"
              alt="Menoo"
              width={180}
              height={60}
              className="h-auto w-40 object-contain md:w-48"
              priority
            />
          </motion.div>
          
          {subtitle && (
            <motion.p 
              className="mt-4 text-center text-lg text-slate-500 max-w-md leading-relaxed"
              variants={slideUp}
            >
              {subtitle}
            </motion.p>
          )}
        </motion.header>

        {/* Main Content */}
        <main className="flex flex-1 flex-col px-6 pb-16 md:px-8">
          <motion.div 
            className="mx-auto w-full max-w-xl"
            variants={slideUp}
          >
            {showTestBanner && (
              <motion.div 
                className="mb-8 rounded-full bg-amber-50 border border-amber-200/60 px-4 py-2 text-center"
                variants={fadeIn}
              >
                <p className="text-sm font-medium text-amber-700">
                  🧪 Test Mode: Onboarding flow is enabled
                </p>
              </motion.div>
            )}

            {/* Global Progress Stepper */}
            {showStepper && (
              <OnboardingProgress
                currentStep={currentStep}
                totalSteps={totalSteps}
                labels={stepLabels}
              />
            )}

            <motion.div variants={slideUp}>
              {children}
            </motion.div>
          </motion.div>
        </main>

        {/* Footer spacer for visual balance */}
        <div className="h-8 md:h-12" />
      </motion.div>
    </div>
  );
}

// Progress indicator component for multi-step onboarding
type ProgressIndicatorProps = {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
};

export function OnboardingProgress({ 
  currentStep, 
  totalSteps,
  labels,
}: ProgressIndicatorProps) {
  return (
    <motion.div 
      className="mb-12"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      {/* Progress bar */}
      <div className="relative h-1 w-full rounded-full bg-slate-100 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-violet-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </div>
      
      {/* Step indicators */}
      <div className="mt-4 flex justify-between">
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNumber = i + 1;
          const isActive = stepNumber <= currentStep;
          const isCurrent = stepNumber === currentStep;
          
          return (
            <motion.div 
              key={stepNumber}
              className="flex flex-col items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.05 }}
            >
              <div 
                className={`
                  flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all duration-300
                  ${isCurrent 
                    ? 'bg-primary text-white shadow-lg shadow-primary/25' 
                    : isActive 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-slate-100 text-slate-400'
                  }
                `}
              >
                {stepNumber}
              </div>
              {labels?.[i] && (
                <span className={`mt-2 text-xs font-medium transition-colors ${
                  isActive ? 'text-slate-700' : 'text-slate-400'
                }`}>
                  {labels[i]}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// Card component for option selection (like upload vs example data)
type OptionCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
};

export function OnboardingOptionCard({
  icon,
  title,
  description,
  onClick,
  variant = 'secondary',
}: OptionCardProps) {
  const isPrimary = variant === 'primary';
  
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={`
        group relative flex flex-col items-center gap-4 rounded-2xl p-8 text-center transition-all duration-300
        ${isPrimary 
          ? 'bg-gradient-to-br from-primary/5 to-violet-50 hover:from-primary/10 hover:to-violet-100/50 ring-1 ring-primary/20 hover:ring-primary/40' 
          : 'bg-slate-50/50 hover:bg-slate-100/50 ring-1 ring-slate-200/60 hover:ring-slate-300/60'
        }
      `}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2 }}
    >
      <div className={`
        flex h-14 w-14 items-center justify-center rounded-xl transition-colors duration-300
        ${isPrimary 
          ? 'bg-primary/10 text-primary group-hover:bg-primary/15' 
          : 'bg-slate-200/60 text-slate-600 group-hover:bg-slate-200'
        }
      `}>
        {icon}
      </div>
      <div className="space-y-1.5">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
      </div>
    </motion.button>
  );
}
