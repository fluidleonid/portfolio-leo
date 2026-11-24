"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "./trackEvent";

const SCROLL_MILESTONES = [25, 50, 75, 100] as const;

/**
 * Tracks page scroll depth milestones (25%, 50%, 75%, 100%) via GA4 & Vercel Analytics.
 * Fires each milestone at most once per pathname visit.
 */
export function ScrollDepthTracker() {
  const pathname = usePathname();
  const firedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    firedRef.current = new Set();

    const checkScrollDepth = () => {
      const doc = document.documentElement;
      const scrollableHeight = doc.scrollHeight - window.innerHeight;
      if (scrollableHeight <= 0) return;

      const percent = Math.min(
        100,
        Math.round((window.scrollY / scrollableHeight) * 100)
      );

      for (const milestone of SCROLL_MILESTONES) {
        if (percent >= milestone && !firedRef.current.has(milestone)) {
          firedRef.current.add(milestone);
          trackEvent("scroll_depth", {
            percent: milestone,
            path: pathname || "/",
          });
        }
      }
    };

    window.addEventListener("scroll", checkScrollDepth, { passive: true });
    return () => window.removeEventListener("scroll", checkScrollDepth);
  }, [pathname]);

  return null;
}
