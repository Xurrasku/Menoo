import { type ReactNode } from "react";
import Link from "next/link";
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
    {
      label: tNavigation("settings"),
      href: { pathname: `/${locale}/dashboard/settings` },
      segment: "settings",
      icon: "Settings" as const,
    },
  ];

  return (
    <div>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div
          className={cn(
            "flex h-20 w-full items-center gap-6",
            DASHBOARD_EDGE_PADDING
          )}
        >
          <Link
            href={`/${locale}/dashboard/menus`}
            className="flex-shrink-0 text-lg font-semibold text-primary"
          >
            <span className="rounded-full bg-primary/10 px-4 py-1 text-sm font-semibold uppercase tracking-wider">
              {tNavigation("brand")}
            </span>
          </Link>

          <div className="flex flex-1 justify-center">
            <MainNav items={navItems} />
          </div>

          <div className="flex flex-shrink-0 items-center gap-3">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden items-center gap-2 rounded-full border border-primary/10 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/15 md:flex"
            >
              <Link href={billingHref}>
                <Sparkles className="h-4 w-4" />
                {tBilling("pro.ctaShort")}
              </Link>
            </Button>
            <UserMenu locale={locale} />
          </div>
        </div>
      </header>

      <main className={cn("pt-[120px]", DASHBOARD_EDGE_PADDING)}>{children}</main>
    </div>
  );
}

