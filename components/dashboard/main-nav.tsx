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
    (segment: string) => {
      if (segment === activeSegment) {
        pendingSegmentRef.current = null;
        return;
      }
      pendingSegmentRef.current = segment;
      scheduleIndicatorUpdate();
    },
    [activeSegment, scheduleIndicatorUpdate]
  );

  return (
    <nav className="relative flex items-center justify-center gap-[0.3%] rounded-full bg-slate-100 p-[0.4%] h-[7vw] sm:h-auto sm:gap-2 sm:p-1 overflow-x-auto scrollbar-hide w-full">
      <div ref={containerRef} className="relative flex items-center justify-center gap-[0.3%] sm:gap-2 w-full h-full">
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute left-0 top-[0.4%] h-[calc(100%-0.8%)] rounded-full bg-white shadow-sm transition-[opacity,transform,width] motion-reduce:transition-none sm:top-1 sm:h-[calc(100%-0.5rem)]",
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
        const Icon = Icons[item.icon] as ComponentType<{ className?: string }>;
        return (
          <Link
            key={item.segment}
            href={item.href}
            onPointerDown={() => previewSegment(item.segment)}
            onFocus={() => previewSegment(item.segment)}
              ref={(node) => {
                itemRefs.current[item.segment] = node;
              }}
            className={cn(
              "relative z-10 flex items-center justify-center rounded-full px-[1.2%] py-[1.2%] h-full transition-all flex-1 min-w-0 overflow-hidden sm:flex-initial sm:gap-2 sm:px-4 sm:py-2",
              isActive
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            )}
            title={item.label}
            aria-label={item.label}
          >
            {Icon ? <Icon className="h-[4vw] w-[4vw] flex-shrink-0 sm:h-4 sm:w-4" /> : null}
            <span className="hidden min-[580px]:inline text-[1.6vw] min-[640px]:text-[1.8vw] sm:text-sm whitespace-nowrap ml-[0.8%] sm:ml-0 truncate">{item.label}</span>
          </Link>
        );
      })}
      </div>
    </nav>
  );
}

