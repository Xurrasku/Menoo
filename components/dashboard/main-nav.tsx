"use client";

import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";
import * as Icons from "lucide-react";
import {
  type ComponentProps,
  type ComponentType,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { DASHBOARD_NAV_HIGHLIGHT_TRANSITION } from "@/lib/constants/layout";
import { cn } from "@/lib/utils";

export type NavItem = {
  label: string;
  href: ComponentProps<typeof Link>["href"];
  segment: string;
  icon: keyof typeof Icons;
};

type MainNavProps = {
  items: NavItem[];
};

export function MainNav({ items }: MainNavProps) {
  const segments = useSelectedLayoutSegments();
  const activeSegment = segments[1] ?? segments[0];
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const frameRef = useRef<number | null>(null);
  const [indicator, setIndicator] = useState({
    left: 0,
    width: 0,
    visible: false,
  });

  const measureIndicator = useCallback(() => {
    const container = containerRef.current;
    const activeItem = activeSegment ? itemRefs.current[activeSegment] : null;

    if (!container || !activeItem) {
      setIndicator((prev) =>
        prev.visible ? { left: prev.left, width: prev.width, visible: false } : prev
      );
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();

    setIndicator({
      left: itemRect.left - containerRect.left,
      width: itemRect.width,
      visible: true,
    });
  }, [activeSegment]);

  const scheduleIndicatorUpdate = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (frameRef.current) {
      window.cancelAnimationFrame(frameRef.current);
    }

    frameRef.current = window.requestAnimationFrame(() => {
      measureIndicator();
    });
  }, [measureIndicator]);

  useLayoutEffect(() => {
    scheduleIndicatorUpdate();

    return () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [scheduleIndicatorUpdate, items]);

  useEffect(() => {
    const handleResize = () => scheduleIndicatorUpdate();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [scheduleIndicatorUpdate]);

  return (
    <nav className="relative flex items-center gap-2 rounded-full bg-slate-100 p-1 text-sm font-medium">
      <div ref={containerRef} className="relative flex items-center gap-2">
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute left-0 top-1 h-[calc(100%-0.5rem)] rounded-full bg-white shadow-sm transition-[opacity,transform,width]",
            DASHBOARD_NAV_HIGHLIGHT_TRANSITION,
            indicator.visible ? "opacity-100" : "opacity-0"
          )}
          style={{
            width: indicator.visible ? indicator.width : 0,
            transform: `translateX(${indicator.left}px)`,
          }}
        />
      {items.map((item) => {
        const isActive = item.segment === activeSegment;
        const Icon = Icons[item.icon] as ComponentType<{ className?: string }>;
        return (
          <Link
            key={item.segment}
            href={item.href}
              ref={(node) => {
                itemRefs.current[item.segment] = node;
              }}
            className={cn(
              "relative z-10 flex items-center gap-2 rounded-full px-4 py-2 transition-all",
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
      </div>
    </nav>
  );
}

