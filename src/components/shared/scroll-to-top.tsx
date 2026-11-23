"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      // Ensure we don't divide by zero and clamp the progress between 0 and 100
      const scrolled = docHeight > 0 ? Math.min(Math.max((scrollY / docHeight) * 100, 0), 100) : 0;
      
      setProgress(scrolled);
      setIsVisible(scrollY > 200);
    };

    // Calculate initial progress
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      className={cn(
        "fixed bottom-[70px] md:bottom-6 right-2 z-40 transition-all duration-300 transform",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12 pointer-events-none"
      )}
    >
      <button
        onClick={scrollToTop}
        className="relative group flex items-center justify-center rounded-full bg-background dark:bg-black border border-border shadow-lg hover:shadow-xl transition-all w-10 h-10 md:w-14 md:h-14"
        aria-label="Scroll to top"
      >
        <svg
          className="absolute inset-0 w-full h-full -rotate-90 drop-shadow-sm"
          width="56"
          height="56"
          viewBox="0 0 56 56"
        >
          {/* Background track circle */}
          <circle
            cx="28"
            cy="28"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-muted/40 dark:text-muted/20"
          />
          {/* Progress circle */}
          <circle
            cx="28"
            cy="28"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            className="text-foreground transition-all duration-150 ease-out"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
            }}
          />
        </svg>
        <ArrowUp className="w-4 h-4 md:w-5 md:h-5 text-foreground group-hover:-translate-y-1 transition-transform" />
      </button>
    </div>
  );
}
