import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import type { ComponentProps } from "react";
import { ArrowRight, QrCode, Smartphone, Globe, BarChart3, Image as ImageIcon, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function LandingPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing" });

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-0">
        <div className="flex h-24 w-full items-stretch justify-between px-4 py-0 lg:px-8">
          <Link href={`/${locale}/landing`} className="flex items-stretch">
            <Image
              src="/assets/logo.png"
              alt="Menoo"
              width={250}
              height={83}
              className="w-auto h-full object-contain"
              priority
            />
          </Link>
          <div className="flex items-center gap-4">
            <Link href={`/${locale}/auth/sign-in`}>
              <Button variant="ghost">{t("nav.signIn")}</Button>
            </Link>
            <Link href={`/${locale}/auth/sign-up`}>
              <Button>{t("nav.cta")}</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 font-display text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl">
            {t("hero.title")}
          </h1>
          <p className="mb-8 text-lg text-muted-foreground md:text-xl lg:text-2xl">
            {t("hero.subtitle")}
          </p>
          <Link href={`/${locale}/auth/sign-up`}>
            <Button size="lg" className="text-lg">
              {t("hero.cta")}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <div className="mt-16 flex items-center justify-center">
            <Image
              src="/assets/hero-phone-mockup.png"
              alt="Mobile mockup showing QR code and digital menu"
              width={320}
              height={640}
              className="h-auto w-64 md:w-80"
              priority
            />
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="border-y border-border bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-lg leading-relaxed text-foreground md:text-xl md:leading-relaxed">
              {t("problem.description")}
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-6xl px-8">
          <h2 className="mb-12 text-center font-display text-3xl font-bold text-foreground md:text-4xl">
            {t("benefits.title")}
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2">
            {[1, 2, 3, 4].map((index) => {
              const iconKey = t(`benefits.items.${index}.icon`);
              const icons: Record<string, React.ReactNode> = {
                zap: <Zap className="h-8 w-8 text-primary" />,
                globe: <Globe className="h-8 w-8 text-primary" />,
                qr: <QrCode className="h-8 w-8 text-primary" />,
                smartphone: <Smartphone className="h-8 w-8 text-primary" />,
                image: <ImageIcon className="h-8 w-8 text-primary" />,
                chart: <BarChart3 className="h-8 w-8 text-primary" />,
              };
              return (
                <Card key={index} className="border-border">
                  <CardHeader>
                    <div className="mb-4">{icons[iconKey] || <Zap className="h-8 w-8 text-primary" />}</div>
                    <CardTitle>{t(`benefits.items.${index}.title`)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{t(`benefits.items.${index}.description`)}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Demo Visual Section */}
      <section className="border-y border-border bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-12 text-center font-display text-3xl font-bold text-foreground md:text-4xl">
              {t("demo.title")}
            </h2>
            <div className="grid gap-8 md:grid-cols-2">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle>{t("demo.panel.title")}</CardTitle>
                  <CardDescription>{t("demo.panel.description")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex h-64 items-center justify-center rounded-lg bg-muted">
                    <div className="text-center text-muted-foreground">{t("demo.panel.placeholder")}</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardHeader>
                  <CardTitle>{t("demo.menu.title")}</CardTitle>
                  <CardDescription>{t("demo.menu.description")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex h-64 items-center justify-center rounded-lg bg-muted">
                    <div className="text-center text-muted-foreground">{t("demo.menu.placeholder")}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-6 font-display text-3xl font-bold text-foreground md:text-4xl">
            {t("finalCta.title")}
          </h2>
          <Link href={`/${locale}/auth/sign-up`}>
            <Button size="lg" className="text-lg">
              {t("finalCta.cta")}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-8 md:grid-cols-4">
              <div>
                <div className="mb-4">
                  <Image
                    src="/assets/logo.png"
                    alt="Menoo"
                    width={100}
                    height={33}
                    className="h-6 w-auto"
                  />
                </div>
                <p className="text-sm text-muted-foreground">{t("footer.description")}</p>
              </div>
              <div>
                <h4 className="mb-4 font-semibold text-foreground">{t("footer.product.title")}</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {[1, 2, 3].map((index) => {
                    const href = t(`footer.product.links.${index}.href`);
                    return (
                      <li key={index}>
                        <Link href={href as ComponentProps<typeof Link>["href"]} className="hover:text-foreground">
                          {t(`footer.product.links.${index}.label`)}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div>
                <h4 className="mb-4 font-semibold text-foreground">{t("footer.company.title")}</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {[1, 2].map((index) => {
                    const href = t(`footer.company.links.${index}.href`);
                    return (
                      <li key={index}>
                        <Link href={href as ComponentProps<typeof Link>["href"]} className="hover:text-foreground">
                          {t(`footer.company.links.${index}.label`)}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div>
                <h4 className="mb-4 font-semibold text-foreground">{t("footer.legal.title")}</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {[1, 2, 3].map((index) => {
                    const href = t(`footer.legal.links.${index}.href`);
                    return (
                      <li key={index}>
                        <Link href={href as ComponentProps<typeof Link>["href"]} className="hover:text-foreground">
                          {t(`footer.legal.links.${index}.label`)}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
            <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
              {t("footer.copyright")}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

