import { type ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MainNav } from "@/components/dashboard/main-nav";
import { UserMenu } from "@/components/dashboard/user-menu";

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
  const navItems = [
    {
      label: tNavigation("menus"),
      href: `/${locale}/dashboard/menus`,
      segment: "menus",
      icon: "Utensils" as const,
    },
    {
      label: tNavigation("statistics"),
      href: `/${locale}/dashboard/statistics`,
      segment: "statistics",
      icon: "BarChart3" as const,
    },
    {
      label: tNavigation("qr"),
      href: `/${locale}/dashboard/qr`,
      segment: "qr",
      icon: "QrCode" as const,
    },
    {
      label: tNavigation("settings"),
      href: `/${locale}/dashboard/settings`,
      segment: "settings",
      icon: "Settings" as const,
    },
  ];

  return (
    <div>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-20 w-full max-w-[1440px] items-center gap-6">
          <Link
            href={`/${locale}/dashboard/menus`}
            className="text-lg font-semibold text-primary"
          >
            <span className="rounded-full bg-primary/10 px-4 py-1 text-sm font-semibold uppercase tracking-wider">
              {tNavigation("brand")}
            </span>
          </Link>

          <div className="flex flex-1 justify-center">
            <MainNav items={navItems} />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <Button
              variant="ghost"
              className="hidden items-center gap-2 rounded-full border border-primary/10 bg-primary/10 px-5 py-2 text-sm font-semibold text-primary hover:bg-primary/15 md:flex"
            >
              <Sparkles className="h-4 w-4" />
              {tNavigation("upgrade")}
            </Button>
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="pt-[120px]">{children}</div>
    </div>
  );
}

