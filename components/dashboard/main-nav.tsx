"use client";

import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";
import * as Icons from "lucide-react";

import { cn } from "@/lib/utils";

export type NavItem = {
  label: string;
  href: string;
  segment: string;
  icon: keyof typeof Icons;
};

type MainNavProps = {
  items: NavItem[];
};

export function MainNav({ items }: MainNavProps) {
  const segments = useSelectedLayoutSegments();
  const activeSegment = segments[1] ?? segments[0];

  return (
    <nav className="flex items-center gap-2 rounded-full bg-slate-100 p-1 text-sm font-medium">
      {items.map((item) => {
        const isActive = item.segment === activeSegment;
        const Icon = Icons[item.icon];
        return (
          <Link
            key={item.segment}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 transition-all",
              isActive
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            {Icon ? <Icon className="h-4 w-4" /> : null}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

