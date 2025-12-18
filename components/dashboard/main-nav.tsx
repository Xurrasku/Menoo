"use client";

import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";
import { Utensils, Wand2, BarChart3, QrCode, type LucideIcon } from "lucide-react";
import {
  type ComponentProps,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { DASHBOARD_NAV_HIGHLIGHT_TRANSITION } from "@/lib/constants/layout";
import { cn } from "@/lib/utils";

/** Static icon map - only import icons actually used in nav to minimize bundle */
export const DASHBOARD_NAV_ICONS = {
  Utensils,
  Wand2,
  BarChart3,
  QrCode,
} as const;

export type NavItem = {
  label: string;
  href: ComponentProps<typeof Link>["href"];
  segment: string;
  icon: keyof typeof DASHBOARD_NAV_ICONS;
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
  const pendingSegmentRef = useRef<string | null>(null);
  const [indicator, setIndicator] = useState({
    left: 0,
    width: 0,
    visible: false,
  });

  const measureIndicator = useCallback(() => {
    const container = containerRef.current;
    const targetSegment = pendingSegmentRef.current ?? activeSegment;
    const activeItem = targetSegment ? itemRefs.current[targetSegment] : null;

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

  useEffect(() => {
    if (pendingSegmentRef.current === activeSegment) {
      pendingSegmentRef.current = null;
    }
    scheduleIndicatorUpdate();
  }, [activeSegment, scheduleIndicatorUpdate]);

  useEffect(() => {
    if (typeof window === "undefined" || !("ResizeObserver" in window)) {
      return;
    }

    const observer = new ResizeObserver(() => scheduleIndicatorUpdate());
    const elements = [
      containerRef.current,
      ...Object.values(itemRefs.current),
    ].filter(
      (node): node is HTMLDivElement | HTMLAnchorElement => node !== null
    );

    elements.forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, [scheduleIndicatorUpdate, items]);

  const previewSegment = useCallback(
    (segment: string | null) => {
      if (segment === activeSegment) {
        pendingSegmentRef.current = null;
      } else {
        pendingSegmentRef.current = segment;
      }
      scheduleIndicatorUpdate();
    },
    [activeSegment, scheduleIndicatorUpdate]
  );

  const resetPreview = useCallback(() => {
    pendingSegmentRef.current = null;
    scheduleIndicatorUpdate();
  }, [scheduleIndicatorUpdate]);

  return (
    <nav className="relative flex items-center justify-center rounded-full bg-slate-100 p-1">
      <div ref={containerRef} className="relative flex items-center justify-center gap-1 sm:gap-2">
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute left-0 top-1 h-[calc(100%-0.5rem)] rounded-full bg-white shadow-sm transition-[opacity,transform,width] motion-reduce:transition-none",
            DASHBOARD_NAV_HIGHLIGHT_TRANSITION,
            indicator.visible ? "opacity-100" : "opacity-0"
          )}
          style={{
            width: indicator.visible ? indicator.width : 0,
            transform: `translate3d(${indicator.left}px, 0, 0)`,
            willChange: "transform,width",
          }}
        />
        {items.map((item) => {
          const isActive = item.segment === activeSegment;
          const Icon: LucideIcon | undefined = DASHBOARD_NAV_ICONS[item.icon];
          return (
            <Link
              key={item.segment}
              href={item.href}
              onMouseEnter={() => previewSegment(item.segment)}
              onMouseLeave={resetPreview}
              onFocus={() => previewSegment(item.segment)}
              onBlur={resetPreview}
              ref={(node) => {
                itemRefs.current[item.segment] = node;
              }}
              className={cn(
                "relative z-10 flex items-center justify-center gap-2 rounded-full px-3 py-2 text-sm transition-colors sm:px-4",
                isActive
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              )}
              title={item.label}
              aria-label={item.label}
            >
              {Icon ? <Icon className="h-4 w-4 flex-shrink-0" /> : null}
              <span className="hidden min-[580px]:inline whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

