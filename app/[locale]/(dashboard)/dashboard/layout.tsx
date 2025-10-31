import { type ReactNode } from "react";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f4f5fb] text-slate-900">
      <main className="flex-1 px-12 pb-10">
        <div className="mx-auto w-full max-w-[1440px] space-y-10">{children}</div>
      </main>
    </div>
  );
}

