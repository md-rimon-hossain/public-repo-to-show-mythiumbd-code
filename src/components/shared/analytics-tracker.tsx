"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function AnalyticsTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (lastTrackedPath.current === pathname) return;
    lastTrackedPath.current = pathname;

    if (pathname.startsWith("/admin") || pathname.startsWith("/api") || pathname.startsWith("/dashboard")) return;

    let visitorId = localStorage.getItem("mythium_visitor_id");
    if (!visitorId) {
      visitorId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem("mythium_visitor_id", visitorId);
    }

    const trackView = async () => {
      let productId = null;
      if (pathname.startsWith("/products/")) {
        productId = pathname.split("/").pop();
      }

      try {
        await fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: pathname, visitorId, productId }),
        });
      } catch {
        // Fail silently for analytics
      }
    };

    trackView();
  }, [pathname]);

  return null;
}
