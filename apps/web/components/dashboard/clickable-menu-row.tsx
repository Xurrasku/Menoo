"use client";

import { useRouter } from "next/navigation";
import { type ReactNode } from "react";
import { TableRow } from "@/components/ui/table";

type ClickableMenuRowProps = {
  menuId: string;
  locale: string;
  children: ReactNode;
  className?: string;
};

export function ClickableMenuRow({ menuId, locale, children, className }: ClickableMenuRowProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("a") ||
      target.closest('[role="switch"]') ||
      target.closest("[role='menuitem']")
    ) {
      return;
    }
    router.push(`/${locale}/dashboard/menus/${menuId}/edit`);
  };

  return (
    <TableRow onClick={handleClick} className={className}>
      {children}
    </TableRow>
  );
}

