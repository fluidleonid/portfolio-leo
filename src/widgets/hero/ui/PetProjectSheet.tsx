"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import type { PetProjectData } from "@/entities/pet-project";

export interface PetProjectSheetProps {
  project: PetProjectData | null;
  onClose: () => void;
}

let cachedDisplayTransitionSupport: boolean | undefined;

function canTransitionDisplay(): boolean {
  if (cachedDisplayTransitionSupport !== undefined) {
    return cachedDisplayTransitionSupport;
  }
  if (
    typeof window === "undefined" ||
    !window.CSS?.supports?.("transition-behavior", "allow-discrete") ||
    !document.body
  ) {
    return false;
  }
  const probe = document.createElement("div");
  probe.style.cssText =
    "transition: display 1s allow-discrete !important; display: block;";
  document.body.appendChild(probe);
  getComputedStyle(probe).display;
  probe.style.display = "none";
  cachedDisplayTransitionSupport = getComputedStyle(probe).display === "block";
  probe.remove();
  return cachedDisplayTransitionSupport;
}

function supportsTopLayerExit(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    window.CSS?.supports?.("overlay", "auto") && canTransitionDisplay()
  );
}

export const PetProjectSheet: React.FC<PetProjectSheetProps> = ({
  project,
  onClose,
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const titleId = useId();
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [isDesktop, setIsDesktop] = useState<boolean>(false);

  // Track desktop (>= 768px) vs mobile (< 768px) breakpoint
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Reset iframe loading state whenever active project changes
  useEffect(() => {
    setIframeLoaded(false);
  }, [project?.id]);

  // Allow Escape key to close the non-modal desktop split pane
  useEffect(() => {
    if (!isDesktop || !project) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDesktop, project, onClose]);

  const closeMobileModal = useCallback(async () => {
    const dialog = dialogRef.current;
    if (!dialog || !dialog.open) return;

    if (!supportsTopLayerExit()) {
      dialog.setAttribute("data-closing", "");
      const animations = dialog.getAnimations({ subtree: true });
      if (animations.length > 0) {
        await Promise.race([
          Promise.allSettled(animations.map((a) => a.finished)),
          new Promise((resolve) => setTimeout(resolve, 600)),
        ]);
      }
      if (!dialog.hasAttribute("data-closing")) return;
      dialog.removeAttribute("data-closing");
    }

    if (dialog.open) {
      dialog.close();
    }
  }, []);

  // Open/close native modal <dialog> ONLY on mobile (< 768px)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!isDesktop && project) {
      dialog.removeAttribute("data-closing");
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      if (isDesktop) {
        // Switching to desktop split pane: close modal immediately without firing onClose
        dialog.removeAttribute("data-closing");
        dialog.close("breakpoint");
      } else {
        void closeMobileModal();
      }
    }
  }, [project, isDesktop, closeMobileModal]);

  // Attach native close, cancel (exit fallback), and light-dismiss fallback (Safari) for mobile <dialog>
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      const reason = dialog.returnValue;
      dialog.removeAttribute("data-closing");
      dialog.returnValue = "";
      if (reason !== "breakpoint") {
        onClose();
      }
    };

    const handleCancel = (event: Event) => {
      if (!supportsTopLayerExit()) {
        event.preventDefault();
        void closeMobileModal();
      }
    };

    dialog.addEventListener("close", handleClose);
    dialog.addEventListener("cancel", handleCancel);

    let cleanupLightDismiss: (() => void) | undefined;
    if (
      typeof HTMLDialogElement !== "undefined" &&
      !("closedBy" in HTMLDialogElement.prototype)
    ) {
      const isOutside = (e: PointerEvent) => {
        const rect = dialog.getBoundingClientRect();
        return (
          e.clientX < rect.left ||
          e.clientX > rect.right ||
          e.clientY < rect.top ||
          e.clientY > rect.bottom
        );
      };

      let pressedOutside = false;
      const handlePointerDown = (e: PointerEvent) => {
        pressedOutside = isOutside(e);
      };
      const handlePointerUp = (e: PointerEvent) => {
        if (pressedOutside && isOutside(e)) {
          void closeMobileModal();
        }
        pressedOutside = false;
      };

      dialog.addEventListener("pointerdown", handlePointerDown);
      dialog.addEventListener("pointerup", handlePointerUp);
      cleanupLightDismiss = () => {
        dialog.removeEventListener("pointerdown", handlePointerDown);
        dialog.removeEventListener("pointerup", handlePointerUp);
      };
    }

    return () => {
      dialog.removeEventListener("close", handleClose);
      dialog.removeEventListener("cancel", handleCancel);
      cleanupLightDismiss?.();
    };
  }, [onClose, closeMobileModal]);

  const externalHref = project?.externalUrl || project?.embedUrl || "";
  const badgeLabel = project
    ? `PET • ${(project.shortName || project.title).toUpperCase()}`
    : "PET";

  const renderSheetBody = (handleCloseClick: () => void, showHandle: boolean) => (
    <>
      {showHandle && (
        <div className="flex w-full justify-center pt-[10px] pb-[2px] shrink-0">
          <span className="h-[4px] w-[40px] rounded-full bg-border-subtle/70" />
        </div>
      )}

      {/* Top Controls Row */}
      <div className="flex w-full items-center justify-between gap-[12px] px-[20px] md:px-[24px] pt-[12px] md:pt-[20px] pb-[12px] shrink-0">
        <span
          className="text-[14px] font-normal leading-[24px] font-hauora uppercase tracking-normal truncate"
          style={{
            color: "var(--color-content-badge, rgba(204, 204, 204, 0.16))",
          }}
        >
          {badgeLabel}
        </span>

        <div className="flex items-center gap-[8px] shrink-0">
          {externalHref && (
            <a
              href={externalHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-[34px] items-center gap-[6px] rounded-[8px] border border-border-hardware bg-surface px-[12px] font-hauora text-[14px] font-light text-content-secondary hover:text-content-primary hover:border-border-subtle transition-colors duration-150"
            >
              <span>open</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M7 17 17 7" />
                <path d="M7 7h10v10" />
              </svg>
            </a>
          )}

          <button
            type="button"
            onClick={handleCloseClick}
            aria-label="Close pet project sheet"
            className="inline-flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-[8px] border border-border-hardware bg-surface text-content-secondary hover:text-content-primary hover:border-border-subtle transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500/40"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Sheet Content */}
      <div className="flex flex-1 min-h-0 flex-col gap-[20px] px-[20px] md:px-[24px] pb-[20px] md:pb-[24px] overflow-y-auto">
        {/* Title & Pitch — styled 1:1 like Case Study Header */}
        <header className="flex w-full flex-col gap-[8px] shrink-0">
          <h2
            id={titleId}
            className="text-[20px] font-semibold leading-[28px] text-content-primary font-hauora tracking-normal"
          >
            {project?.title || "Pet Project"}
          </h2>
          {project?.pitch && (
            <p className="text-[18px] font-light leading-[26px] text-content-secondary font-hauora whitespace-pre-line tracking-normal">
              {project.pitch}
            </p>
          )}
        </header>

        {/* Interactive Project Embed */}
        <div className="relative flex flex-1 min-h-[300px] w-full overflow-hidden rounded-[44px] bg-surface-deep">
          {project?.embedUrl ? (
            <>
              {!iframeLoaded && (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-surface-deep">
                  <span className="font-hauora text-[14px] font-light text-content-tertiary animate-pulse">
                    Loading embed...
                  </span>
                </div>
              )}
              <iframe
                key={project.id}
                src={project.embedUrl}
                title={project.title}
                onLoad={() => setIframeLoaded(true)}
                className="h-full w-full rounded-[44px] border-0 bg-surface-deep"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
              />
            </>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-[8px] p-[24px] text-center">
              <span className="font-hauora text-[16px] font-medium text-content-primary">
                Embed URL not configured yet
              </span>
              <span className="font-hauora text-[14px] font-light text-content-secondary max-w-[320px]">
                Add an Embed URL for this project in Sanity Studio under Pet Projects.
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop (>= 768px): Non-modal 480px right split-screen panel — main page stays 100% interactive */}
      <aside
        aria-label={project ? `Pet project: ${project.title}` : "Pet project panel"}
        aria-hidden={!isDesktop || !project}
        className={`hidden md:flex fixed top-0 right-0 bottom-0 z-40 h-[100dvh] w-[480px] flex-col bg-canvas border-l border-border-hardware transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isDesktop && project
            ? "translate-x-0 pointer-events-auto"
            : "translate-x-full pointer-events-none"
        }`}
      >
        {isDesktop && project ? renderSheetBody(onClose, false) : null}
      </aside>

      {/* Mobile (< 768px): Native modal Bottom Sheet */}
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="pet-sheet-dialog"
        {...({ closedby: "any" } as Record<string, string>)}
      >
        {!isDesktop && project
          ? renderSheetBody(() => void closeMobileModal(), true)
          : null}
      </dialog>
    </>
  );
};
