"use client";

import { useEffect, useState, type ReactNode } from "react";

type MobilePreviewWrapperProps = {
  children: ReactNode;
  hasHtmlMenu: boolean;
};

const DESKTOP_BREAKPOINT = 768; // md breakpoint
const PHONE_WIDTH = 375;
const PHONE_HEIGHT = 812;
const PHONE_PADDING = 12; // p-3 = 12px
const PHONE_BORDER_RADIUS_OUTER = 48; // rounded-[3rem]

export function MobilePreviewWrapper({ children, hasHtmlMenu }: MobilePreviewWrapperProps) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [mounted] = useState(() => typeof window !== "undefined");
  const [frameScale, setFrameScale] = useState(1);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateLayout = () => {
      const isNowDesktop = window.innerWidth >= DESKTOP_BREAKPOINT;
      setIsDesktop(isNowDesktop);
      
      if (isNowDesktop) {
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const padding = 48;
        
        // Total phone frame dimensions
        const totalPhoneHeight = PHONE_HEIGHT + (PHONE_PADDING * 2);
        const totalPhoneWidth = PHONE_WIDTH + (PHONE_PADDING * 2);
        
        // Calculate frame scale to fit in viewport
        const maxHeight = viewportHeight - padding;
        const maxWidth = viewportWidth - padding;
        
        const scaleByHeight = maxHeight / totalPhoneHeight;
        const scaleByWidth = maxWidth / totalPhoneWidth;
        
        const newFrameScale = Math.min(scaleByHeight, scaleByWidth, 1);
        setFrameScale(newFrameScale);
      }
    };
    
    updateLayout();
    window.addEventListener("resize", updateLayout);
    
    return () => window.removeEventListener("resize", updateLayout);
  }, []);

  // During SSR and initial mount, render children directly to avoid layout shift
  if (!mounted) {
    return <>{children}</>;
  }

  // On mobile, render children directly
  if (!isDesktop) {
    return <>{children}</>;
  }

  // On desktop, show mobile preview frame scaled to fit viewport
  // Note: vw units will be calculated from desktop viewport, not 375px
  // This is a limitation - for perfect preview, we'd need an iframe or CSS container queries
  return (
    <div className="flex h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 p-6">
      {/* Phone Frame - scaled to fit */}
      <div 
        className="relative flex flex-col"
        style={{
          transform: `scale(${frameScale})`,
          transformOrigin: "center center",
        }}
      >
        {/* Phone Notch */}
        <div className="absolute left-1/2 top-0 z-10 h-7 w-32 -translate-x-1/2 rounded-b-2xl bg-black" />
        
        {/* Phone Body */}
        <div 
          className="relative overflow-hidden bg-black"
          style={{
            borderRadius: `${PHONE_BORDER_RADIUS_OUTER}px`,
            padding: `${PHONE_PADDING}px`,
            boxShadow: "0 50px 100px -20px rgba(0, 0, 0, 0.25), 0 30px 60px -30px rgba(0, 0, 0, 0.3), inset 0 0 0 2px rgba(255, 255, 255, 0.1)"
          }}
        >
          {/* Screen */}
          <div 
            className="relative bg-white"
            style={{ 
              width: `${PHONE_WIDTH}px`, 
              height: `${PHONE_HEIGHT}px`,
              borderRadius: `${PHONE_BORDER_RADIUS_OUTER - PHONE_PADDING}px`,
              overflow: "hidden",
            }}
          >
            {/* Content container - exactly 375px, no scaling */}
            <div 
              className="overflow-y-auto overflow-x-hidden bg-white"
              style={{
                width: `${PHONE_WIDTH}px`,
                height: `${PHONE_HEIGHT}px`,
              }}
            >
              {hasHtmlMenu ? (
                <div className="min-h-full w-full bg-white">
                  {children}
                </div>
              ) : (
                <div className="flex min-h-full w-full flex-col bg-white">
                  {children}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Phone Home Indicator */}
        <div className="absolute bottom-5 left-1/2 h-1 w-32 -translate-x-1/2 rounded-full bg-white/30" />
      </div>
      
    </div>
  );
}

