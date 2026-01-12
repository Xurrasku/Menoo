import type { ReactNode } from "react";

import { AuthProvider } from "@/components/providers/auth-provider";
import { requireUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

type DashboardGroupLayoutProps = {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export default async function DashboardGroupLayout({
  children,
  params,
}: DashboardGroupLayoutProps) {
  const { locale } = await params;
  const user = await requireUser(locale);

  return <AuthProvider user={user}>{children}</AuthProvider>;
}
















