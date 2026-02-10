import { getTranslations } from "next-intl/server";

import {
  AnimatedNavBar,
  HeroSection,
  ProblemSection,
  BenefitsSection,
  AiImageEnhanceSection,
  DemoSection,
  CTASection,
  AnimatedFooter,
} from "@/components/landing";

type Props = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function LandingPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing" });

  // Prepare benefits data
  const benefitItems = [1, 2, 3, 4].map((index) => ({
    icon: t(`benefits.items.${index}.icon`),
    title: t(`benefits.items.${index}.title`),
    description: t(`benefits.items.${index}.description`),
  }));

  const aiImageSteps = [1, 2, 3].map((index) => ({
    title: t(`aiImage.steps.${index}.title`),
    description: t(`aiImage.steps.${index}.description`),
  }));

  const aiImageContent = {
    eyebrow: t("aiImage.eyebrow"),
    title: t("aiImage.title"),
    subtitle: t("aiImage.subtitle"),
    steps: aiImageSteps,
    trialNote: t("aiImage.trialNote"),
    upload: {
      title: t("aiImage.upload.title"),
      description: t("aiImage.upload.description"),
      cta: t("aiImage.upload.cta"),
      loading: t("aiImage.upload.loading"),
      noTrials: t("aiImage.upload.noTrials"),
      download: t("aiImage.upload.download"),
      secondaryCta: t("aiImage.upload.secondaryCta"),
      empty: t("aiImage.upload.empty"),
      maxSize: t.raw("aiImage.upload.maxSize"),
      clear: t("aiImage.upload.clear"),
      remaining: t.raw("aiImage.upload.remaining"),
      error: t("aiImage.upload.error"),
    },
    before: t("aiImage.before"),
    after: t("aiImage.after"),
    placeholder: t("aiImage.placeholder"),
    watermark: t("aiImage.watermark"),
  };

  // Prepare footer data
  const footerData = {
    description: t("footer.description"),
    copyright: t("footer.copyright"),
    product: {
      title: t("footer.product.title"),
      links: [1, 2, 3].map((index) => ({
        label: t(`footer.product.links.${index}.label`),
        href: t(`footer.product.links.${index}.href`),
      })),
    },
    company: {
      title: t("footer.company.title"),
      links: [1, 2].map((index) => ({
        label: t(`footer.company.links.${index}.label`),
        href: t(`footer.company.links.${index}.href`),
      })),
    },
    legal: {
      title: t("footer.legal.title"),
      links: [1, 2, 3].map((index) => ({
        label: t(`footer.legal.links.${index}.label`),
        href: t(`footer.legal.links.${index}.href`),
      })),
    },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Animated Navigation */}
      <AnimatedNavBar
        locale={locale}
        signInText={t("nav.signIn")}
        ctaText={t("nav.cta")}
      />

      {/* Hero Section with entrance animations */}
      <HeroSection
        locale={locale}
        title={t("hero.title")}
        subtitle={t("hero.subtitle")}
        ctaText={t("hero.cta")}
      />

      {/* Problem Section with scroll animation */}
      <ProblemSection description={t("problem.description")} />

      {/* Benefits Section with staggered card animations */}
      <BenefitsSection title={t("benefits.title")} items={benefitItems} />

      {/* AI Image Enhancement Section */}
      <AiImageEnhanceSection locale={locale} content={aiImageContent} />

      {/* Demo Section with slide-in animations */}
      <DemoSection
        title={t("demo.title")}
        panel={{
          title: t("demo.panel.title"),
          description: t("demo.panel.description"),
          placeholder: t("demo.panel.placeholder"),
        }}
        menu={{
          title: t("demo.menu.title"),
          description: t("demo.menu.description"),
          placeholder: t("demo.menu.placeholder"),
        }}
      />

      {/* Final CTA with attention-grabbing animation */}
      <CTASection
        locale={locale}
        title={t("finalCta.title")}
        ctaText={t("finalCta.cta")}
      />

      {/* Animated Footer */}
      <AnimatedFooter {...footerData} />
    </div>
  );
}
