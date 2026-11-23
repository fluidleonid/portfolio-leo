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
  const mobileBodyRef = useRef<HTMLDivElement | null>(null);
  const bodyTouchStartYRef = useRef<number | null>(null);
  const handleTouchStartYRef = useRef<number | null>(null);
  const titleId = useId();
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [isDesktop, setIsDesktop] = useState<boolean>(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState<boolean>(false);

  // Track desktop (>= 768px) vs mobile (< 768px) breakpoint
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Reset iframe loading & mobile expanded state whenever active project changes
  useEffect(() => {
    setIframeLoaded(false);
    setIsMobileExpanded(false);
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
      setIsMobileExpanded(false);
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

  // Mobile gesture handlers: scroll/swipe UP expands to fullscreen & unlocks embed; swipe DOWN on top bar collapses/closes
  const handleMobileExpand = useCallback(() => {
    setIsMobileExpanded(true);
    if (mobileBodyRef.current) {
      mobileBodyRef.current.scrollTop = 0;
    }
  }, []);

  const handleTopBarTouchStart = (e: React.TouchEvent) => {
    handleTouchStartYRef.current = e.touches[0]?.clientY ?? null;
  };

  const handleTopBarTouchMove = (e: React.TouchEvent) => {
    const startY = handleTouchStartYRef.current;
    const currentY = e.touches[0]?.clientY;
    if (startY === null || currentY === undefined) return;
    const deltaDown = currentY - startY;

    if (deltaDown > 36) {
      handleTouchStartYRef.current = null;
      if (isMobileExpanded) {
        setIsMobileExpanded(false);
      } else {
        void closeMobileModal();
      }
    } else if (deltaDown < -24 && !isMobileExpanded) {
      handleTouchStartYRef.current = null;
      handleMobileExpand();
    }
  };

  const handleTopBarTouchEnd = () => {
    handleTouchStartYRef.current = null;
  };

  const handleMobileBodyTouchStart = (e: React.TouchEvent) => {
    if (isMobileExpanded) return;
    bodyTouchStartYRef.current = e.touches[0]?.clientY ?? null;
  };

  const handleMobileBodyTouchMove = (e: React.TouchEvent) => {
    if (isMobileExpanded) return;
    const startY = bodyTouchStartYRef.current;
    const currentY = e.touches[0]?.clientY;
    if (startY === null || currentY === undefined) return;
    const swipeUp = startY - currentY;

    if (swipeUp > 20) {
      bodyTouchStartYRef.current = null;
      handleMobileExpand();
    }
  };

  const handleMobileBodyTouchEnd = () => {
    bodyTouchStartYRef.current = null;
  };

  const handleMobileBodyScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!isMobileExpanded && e.currentTarget.scrollTop > 8) {
      handleMobileExpand();
    }
  };

  const handleMobileBodyWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!isMobileExpanded && e.deltaY > 8) {
      handleMobileExpand();
    }
  };

  const externalHref = project?.externalUrl || project?.embedUrl || "";
  const badgeLabel = project
    ? `PET • ${(project.shortName || project.title).toUpperCase()}`
    : "PET";

  const renderTopBar = (handleCloseClick: () => void, isMobileMode: boolean) => (
    <div
      className="shrink-0"
      onTouchStart={isMobileMode ? handleTopBarTouchStart : undefined}
      onTouchMove={isMobileMode ? handleTopBarTouchMove : undefined}
      onTouchEnd={isMobileMode ? handleTopBarTouchEnd : undefined}
    >
      {isMobileMode && (
        <button
          type="button"
          onClick={() => setIsMobileExpanded((prev) => !prev)}
          aria-label={isMobileExpanded ? "Collapse sheet" : "Expand sheet to fullscreen"}
          className="flex w-full cursor-pointer justify-center pt-[10px] pb-[2px] focus-visible:outline-none"
        >
          <span className="h-[4px] w-[40px] rounded-full bg-border-subtle/70" />
        </button>
      )}

      {/* Top Controls Row */}
      <div className="flex w-full items-center justify-between gap-[12px] px-[20px] md:px-[24px] pt-[12px] md:pt-[20px] pb-[12px]">
        <span
          className="text-[14px] font-normal leading-[24px] font-hauora uppercase tracking-normal truncate"
          style={{
            color: "var(--color-content-badge, rgba(204, 204, 204, 0.16))",
          }}
        >
          {badgeLabel}
        </span>

        <div className="flex items-center gap-[16px] shrink-0">
          {externalHref && (
            <a
              href={externalHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-[6px] font-hauora text-[16px] font-light leading-[24px] text-content-secondary hover:text-content-primary transition-colors duration-150"
            >
              <span>open</span>
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
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
            className="inline-flex cursor-pointer items-center justify-center font-hauora text-[16px] font-light leading-[24px] text-content-secondary hover:text-content-primary transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500/40 rounded-[4px]"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
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
    </div>
  );

  const renderEmbedContent = (isEmbedInteractive: boolean) =>
    project?.embedUrl ? (
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
          className={`h-full w-full rounded-[44px] border-0 bg-surface-deep ${
            isEmbedInteractive ? "pointer-events-auto" : "pointer-events-none"
          }`}
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
        {isDesktop && project ? (
          <>
            {renderTopBar(onClose, false)}
            <div className="flex flex-1 min-h-0 flex-col gap-[20px] px-[24px] pb-[24px] overflow-y-auto">
              <header className="flex w-full flex-col gap-[8px] shrink-0">
                <h2
                  id={titleId}
                  className="text-[20px] font-semibold leading-[28px] text-content-primary font-hauora tracking-normal"
                >
                  {project.title}
                </h2>
                {project.pitch && (
                  <p className="text-[18px] font-light leading-[26px] text-content-secondary font-hauora whitespace-pre-line tracking-normal">
                    {project.pitch}
                  </p>
                )}
              </header>

              <div className="relative mx-auto flex w-full max-w-[380px] aspect-[1/2] max-h-[760px] shrink-0 overflow-hidden rounded-[44px] bg-surface-deep">
                {renderEmbedContent(true)}
              </div>
            </div>
          </>
        ) : null}
      </aside>

      {/* Mobile (< 768px): Native modal Bottom Sheet that smoothly expands to fullscreen overlay on scroll/swipe */}
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        data-expanded={isMobileExpanded ? "true" : "false"}
        className="pet-sheet-dialog"
        {...({ closedby: "any" } as Record<string, string>)}
      >
        {!isDesktop && project ? (
          <>
            {renderTopBar(() => void closeMobileModal(), true)}

            <div
              ref={mobileBodyRef}
              onTouchStart={handleMobileBodyTouchStart}
              onTouchMove={handleMobileBodyTouchMove}
              onTouchEnd={handleMobileBodyTouchEnd}
              onScroll={handleMobileBodyScroll}
              onWheel={handleMobileBodyWheel}
              className={`flex flex-1 min-h-0 flex-col px-[20px] pb-[20px] transition-[gap] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isMobileExpanded
                  ? "gap-0 overflow-hidden"
                  : "gap-[20px] overflow-y-auto"
              }`}
            >
              {/* Title & Pitch smoothly collapse out when expanded to full-screen overlay */}
              <div
                className={`grid shrink-0 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  isMobileExpanded
                    ? "grid-rows-[0fr] opacity-0 -translate-y-[8px] pointer-events-none"
                    : "grid-rows-[1fr] opacity-100 translate-y-0"
                }`}
              >
                <div className="overflow-hidden">
                  <header className="flex w-full flex-col gap-[8px]">
                    <h2
                      id={titleId}
                      className="text-[20px] font-semibold leading-[28px] text-content-primary font-hauora tracking-normal"
                    >
                      {project.title}
                    </h2>
                    {project.pitch && (
                      <p className="text-[18px] font-light leading-[26px] text-content-secondary font-hauora whitespace-pre-line tracking-normal">
                        {project.pitch}
                      </p>
                    )}
                  </header>
                </div>
              </div>

              {/* Embed: initially scroll-locked; when expanded, fits 100% inside the fullscreen overlay & unlocks scroll */}
              <div
                onClick={!isMobileExpanded ? handleMobileExpand : undefined}
                className={`relative mx-auto flex w-full max-w-[380px] overflow-hidden rounded-[44px] bg-surface-deep transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  isMobileExpanded
                    ? "flex-1 min-h-0 h-full"
                    : "aspect-[1/2] max-h-[760px] shrink-0 cursor-pointer"
                }`}
              >
                {renderEmbedContent(isMobileExpanded)}
              </div>
            </div>
          </>
        ) : null}
      </dialog>
    </>
  );
};
