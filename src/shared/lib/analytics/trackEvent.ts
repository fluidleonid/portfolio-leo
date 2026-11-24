import { track } from "@vercel/analytics";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/**
 * Unified event tracker that dispatches custom events to both
 * Google Analytics 4 (gtag.js) and Vercel Web Analytics.
 */
export function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean>
) {
  track(name, params);

  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", name, params || {});
  }
}
