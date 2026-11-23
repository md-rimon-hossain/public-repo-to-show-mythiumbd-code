"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const completeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Complete progress on route change
  useEffect(() => {
    if (!visible) return;

    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(100);

    completeTimerRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 300);

    return () => {
      if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
    };
  }, [pathname, searchParams, visible]);

  // Intercept link clicks across the entire app
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Don't intercept if modifier keys were pressed
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.defaultPrevented) return;

      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor || !anchor.href) return;

      // Ignore target="_blank", downloads, or hash-only links
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      try {
        const targetUrl = new URL(anchor.href, window.location.href);
        const currentUrl = new URL(window.location.href);

        // Only handle internal navigation
        if (targetUrl.origin !== currentUrl.origin) return;

        // Ignore same-page hash changes
        if (targetUrl.pathname === currentUrl.pathname && targetUrl.search === currentUrl.search) {
          return;
        }

        // Start progress bar immediately
        if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
        if (timerRef.current) clearInterval(timerRef.current);

        setVisible(true);
        setProgress(25);

        // Simulate progress crawling
        timerRef.current = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 85) {
              if (timerRef.current) clearInterval(timerRef.current);
              return 85;
            }
            return prev + 15;
          });
        }, 150);
      } catch {
        // Ignore invalid URLs
      }
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      if (timerRef.current) clearInterval(timerRef.current);
      if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
    };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div
        className="h-[3px] bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 shadow-[0_0_10px_rgba(245,158,11,0.8)] transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
export default NavigationProgress;
