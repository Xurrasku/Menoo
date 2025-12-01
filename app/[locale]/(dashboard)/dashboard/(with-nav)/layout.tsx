import { type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MainNav } from "@/components/dashboard/main-nav";
import { UserMenu } from "@/components/dashboard/user-menu";
import { getBillingPagePath } from "@/lib/billing/paths";
import { DASHBOARD_EDGE_PADDING } from "@/lib/constants/layout";
import { cn } from "@/lib/utils";

type ShellLayoutProps = {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export default async function ShellLayout({ children, params }: ShellLayoutProps) {
  const { locale } = await params;
  const tNavigation = await getTranslations({
    locale,
    namespace: "navigation",
  });
  const tBilling = await getTranslations({
    locale,
    namespace: "billing",
  });
  const billingPath = getBillingPagePath(locale);
  const billingHref = { pathname: billingPath };
  const navItems = [
    {
      label: tNavigation("menus"),
      href: { pathname: `/${locale}/dashboard/menus` },
      segment: "menus",
      icon: "Utensils" as const,
    },
    {
      label: tNavigation("customize"),
      href: { pathname: `/${locale}/dashboard/settings` },
      segment: "settings",
      icon: "Wand2" as const,
    },
    {
      label: tNavigation("statistics"),
      href: { pathname: `/${locale}/dashboard/statistics` },
      segment: "statistics",
      icon: "BarChart3" as const,
    },
    {
      label: tNavigation("qr"),
      href: { pathname: `/${locale}/dashboard/qr` },
      segment: "qr",
      icon: "QrCode" as const,
    },
  ];

  return (
    <div>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div
          className={cn(
            "flex h-[10vw] w-full items-center gap-[2.5%] sm:h-20 sm:gap-6",
            DASHBOARD_EDGE_PADDING
          )}
        >
          <Link
            href={`/${locale}/dashboard/menus`}
            className="flex h-[7vw] items-center flex-shrink-0 sm:h-10"
          >
            <Image
              src="/assets/logo.png"
              alt="Menoo"
              width={120}
              height={40}
              className="h-auto w-[18vw] object-contain sm:w-auto"
              priority
            />
          </Link>

          <div className="flex flex-1 justify-center min-w-0 max-w-[50%] sm:max-w-none">
            <MainNav items={navItems} />
          </div>

          <div className="flex flex-shrink-0 items-center gap-[1.5%] sm:gap-3">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="flex items-center justify-center rounded-full border border-primary/10 bg-primary/10 px-[2%] py-[1%] font-display font-semibold tracking-tight text-primary hover:bg-primary/15 sm:gap-2 sm:px-4 sm:py-2"
            >
              <Link href={billingHref} className="flex items-center gap-[1%] sm:gap-2">
                <Sparkles className="h-[3vw] w-[3vw] sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="hidden min-[380px]:inline text-[2.2vw] sm:text-sm">{tBilling("pro.ctaShort")}</span>
              </Link>
            </Button>
            <UserMenu locale={locale} />
          </div>
        </div>
      </header>

      <main className={cn("pt-[15vw] sm:pt-[120px]", DASHBOARD_EDGE_PADDING)}>{children}</main>
    </div>
  );
}

