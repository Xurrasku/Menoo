import { type ReactNode } from "react";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 px-4 py-8 md:px-8 md:py-12">
        <div className="mx-auto w-full max-w-[1440px] space-y-8">{children}</div>
      </main>
    </div>
  );
}

