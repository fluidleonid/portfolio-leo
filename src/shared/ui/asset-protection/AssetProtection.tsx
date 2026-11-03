"use client";

import { useEffect } from "react";

/**
 * AssetProtection
 * Protects portfolio assets (images, canvas, videos) from unauthorized downloading,
 * dragging, and saving via context menu or drag-and-drop.
 */
export function AssetProtection() {
  useEffect(() => {
    // 1. Intercept contextmenu (right-click / long-tap) on media elements and galleries
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const isProtectedMedia =
        target.tagName === "IMG" ||
        target.tagName === "CANVAS" ||
        target.tagName === "VIDEO" ||
        target.tagName === "PICTURE" ||
        Boolean(target.closest("img")) ||
        Boolean(target.closest("canvas")) ||
        Boolean(target.closest("[data-asset-protected]"));

      if (isProtectedMedia) {
        e.preventDefault();
      }
    };

    // 2. Intercept dragstart to prevent drag-to-desktop or dragging into new tabs
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const isProtectedMedia =
        target.tagName === "IMG" ||
        target.tagName === "CANVAS" ||
        target.tagName === "VIDEO" ||
        Boolean(target.closest("img")) ||
        Boolean(target.closest("[data-asset-protected]"));

      if (isProtectedMedia) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu, { capture: true });
    document.addEventListener("dragstart", handleDragStart, { capture: true });

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu, { capture: true });
      document.removeEventListener("dragstart", handleDragStart, { capture: true });
    };
  }, []);

  return null;
}
