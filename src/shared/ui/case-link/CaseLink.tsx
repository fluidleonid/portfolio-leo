"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

const ARROW_PATH =
  "M6.92395 21.7257C5.97195 21.7257 5.20021 20.954 5.20019 20.002C5.20019 19.05 5.97194 18.2782 6.92395 18.2782L29.469 18.2782C28.7711 17.5461 27.914 16.7519 27.0265 15.9813C25.9457 15.0429 24.8599 14.171 24.0411 13.532C23.6326 13.2133 23.2923 12.9543 23.0555 12.7754C22.9373 12.6861 22.8451 12.6165 22.7828 12.57C22.7517 12.5468 22.7276 12.5293 22.7121 12.5178C22.7045 12.5122 22.6989 12.5079 22.6952 12.5052C22.6934 12.5039 22.691 12.5018 22.691 12.5018C21.9245 11.9373 21.7604 10.8578 22.3249 10.0913C22.8895 9.32496 23.9682 9.16153 24.7346 9.726L24.7372 9.72768C24.7372 9.72768 24.7406 9.73011 24.743 9.73189C24.7479 9.73549 24.7551 9.74041 24.7641 9.74704C24.7822 9.76047 24.8084 9.78067 24.8424 9.80596C24.9102 9.85653 25.009 9.92982 25.1336 10.024C25.3828 10.2122 25.7374 10.4828 26.1621 10.8143C27.0097 11.4758 28.1454 12.3873 29.2864 13.378C30.419 14.3614 31.5967 15.4568 32.5041 16.4838C32.956 16.9952 33.3773 17.5305 33.6951 18.0577C33.9844 18.5377 34.3247 19.2292 34.3247 20.002C34.3247 20.7748 33.9844 21.4663 33.6951 21.9462C33.3772 22.4735 32.9552 23.0087 32.5033 23.5202C31.5959 24.547 30.4189 25.6427 29.2864 26.6259C28.1454 27.6166 27.0097 28.5282 26.1621 29.1897C25.7375 29.521 25.3828 29.7909 25.1336 29.9792C25.0089 30.0733 24.9102 30.1474 24.8424 30.198C24.8085 30.2232 24.7822 30.2427 24.7641 30.2561C24.755 30.2628 24.748 30.2684 24.743 30.2721C24.7407 30.2738 24.7372 30.2763 24.7372 30.2763L24.7355 30.2771L24.7346 30.278C23.9681 30.8423 22.8894 30.6783 22.3249 29.9118C21.7605 29.1454 21.9239 28.0667 22.6902 27.5021L22.691 27.5013C22.691 27.5013 22.6935 27.5001 22.6952 27.4988C22.6989 27.4961 22.7044 27.4918 22.7121 27.4861C22.7276 27.4746 22.7516 27.4572 22.7828 27.4339C22.8451 27.3875 22.9372 27.3179 23.0555 27.2286C23.2923 27.0497 23.6326 26.7907 24.0411 26.4719C24.8599 25.8329 25.9456 24.9611 27.0265 24.0226C27.9138 23.2522 28.7703 22.4577 29.4682 21.7257L6.92395 21.7257Z";

export interface CaseLinkProps extends React.HTMLAttributes<HTMLElement> {
  /** Text label of the case study (line 1) */
  label: string;
  /** Optional secondary line / subtitle (line 2) */
  sublabel?: string;
  /** Optional external link destination */
  href?: string;
  /** Whether the case study is active and accessible (default true) */
  active?: boolean;
  /** Optional click handler */
  onClick?: () => void;
  /** Backwards-compatible prop (unused now that CV-style button is rendered) */
  lampSize?: number;
}

/**
 * Tactile Case Study Link / Button Component
 *
 * Features:
 * - Left: 2-line title (Hauora Semibold 18/26) + optional sublabel (Hauora Light 18/26)
 * - Right (top-aligned): Tactile 60x60px CV-style hardware button with custom arrow SVG shape
 * - Active toggle (`active`):
 *   - When true: arrow illuminates with incandescent amber gradient + contour glow on hover/press & navigates
 *   - When false: hardware cap still depresses on click, but amber light stays OFF and shows a soft toast ("Case study is in progress")
 */
export const CaseLink = React.forwardRef<HTMLElement, CaseLinkProps>(
  (
    {
      label,
      sublabel,
      href,
      active = true,
      onClick,
      className = "",
      ...props
    },
    ref
  ) => {
    const isAvailable = active !== false;
    const uid = useId().replace(/:/g, "");
    const gradientId = `caseArrowGrad-${uid}`;
    const filterId = `caseArrowGlow-${uid}`;

    const [toastVisible, setToastVisible] = useState(false);
    const [mounted, setMounted] = useState(false);
    const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
      setMounted(true);
      return () => {
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      };
    }, []);

    const handleInactiveClick = () => {
      setToastVisible(true);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => {
        setToastVisible(false);
      }, 2500);
    };

    const innerContent = (
      <>
        {/* Case Title and optional Sublabel (2-line structure on the LEFT) */}
        <div className="flex flex-1 min-w-0 flex-col items-start text-left">
          <span
            className={`w-full font-hauora font-semibold text-[18px] leading-[26px] ${
              isAvailable
                ? "text-content-primary group-hover:text-content-contrast"
                : "text-content-muted"
            } transition-colors duration-150 break-words whitespace-normal text-left`}
          >
            {label}
          </span>

          {sublabel && (
            <span
              className={`w-full font-hauora font-light text-[18px] leading-[26px] ${
                isAvailable
                  ? "text-content-secondary group-hover:text-content-primary"
                  : "text-content-muted"
              } transition-colors duration-150 break-words whitespace-normal text-left`}
            >
              {sublabel}
            </span>
          )}
        </div>

        {/* Right Top-Aligned Tactile Hardware Button (CV Button style with custom lamp 2 arrow shape) */}
        <span
          aria-hidden="true"
          className="relative inline-flex h-[60px] w-[60px] shrink-0 select-none items-center justify-center rounded-[16px] bg-black/15 p-[4px] pt-[3px] shadow-[inset_0_2px_3px_rgba(0,0,0,0.25),inset_0_-1px_1px_rgba(255,255,255,0.02)] transition-all duration-150"
        >
          {/* Tactile Cap (52x52px, radius 12px) */}
          <span
            className="relative flex h-[52px] w-[52px] items-center justify-center rounded-[12px] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),inset_0_-1px_0_rgba(0,0,0,0.25),0_2px_2px_rgba(0,0,0,0.20)] transition-all duration-150 ease-out group-hover:translate-y-[1px] group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),inset_0_-1px_0_rgba(0,0,0,0.25),0_1px_1px_rgba(0,0,0,0.15)] group-active:translate-y-[1px] group-active:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),inset_0_-1px_0_rgba(0,0,0,0.25),0_1px_1px_rgba(0,0,0,0.15)]"
            style={{
              background:
                "linear-gradient(175deg, var(--color-surface-pill, #2c2c2c) 0%, var(--color-surface, #242424) 100%)",
            }}
          >
            <svg
              viewBox="0 0 40 40"
              className="h-[26px] w-[26px] overflow-visible"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {isAvailable && (
                <defs>
                  <linearGradient
                    id={gradientId}
                    x1="20"
                    y1="9"
                    x2="20"
                    y2="31"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0%" stopColor="#FFF8C4" />
                    <stop offset="35%" stopColor="#FFDF64" />
                    <stop offset="65%" stopColor="#FFC438" />
                    <stop offset="85%" stopColor="#F59820" />
                    <stop offset="100%" stopColor="#E57810" />
                  </linearGradient>

                  <filter
                    id={filterId}
                    x="-30%"
                    y="-30%"
                    width="160%"
                    height="160%"
                    filterUnits="userSpaceOnUse"
                  >
                    <feGaussianBlur
                      in="SourceAlpha"
                      stdDeviation="2"
                      result="contourBlur"
                    />
                    <feFlood
                      floodColor="#E58E1A"
                      floodOpacity="0.28"
                      result="amberFlood"
                    />
                    <feComposite
                      in="amberFlood"
                      in2="contourBlur"
                      operator="in"
                      result="coloredOutline"
                    />
                    <feMerge>
                      <feMergeNode in="coloredOutline" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
              )}

              {/* Inactive / Unlit Arrow */}
              <path
                d={ARROW_PATH}
                fill="var(--color-border-hardware, #383838)"
                className={
                  isAvailable
                    ? "transition-opacity duration-200 ease-out group-hover:opacity-0 group-active:opacity-0"
                    : ""
                }
              />

              {/* Illuminated Arrow (ONLY rendered when active toggle is ON) */}
              {isAvailable && (
                <path
                  d={ARROW_PATH}
                  fill={`url(#${gradientId})`}
                  filter={`url(#${filterId})`}
                  className="opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100 group-active:opacity-100"
                />
              )}
            </svg>
          </span>
        </span>
      </>
    );

    const baseClasses = `group flex w-full flex-row items-start justify-between gap-[16px] select-none cursor-pointer transition-colors duration-150 ${className}`;

    const hasNavigation = Boolean((href || onClick) && isAvailable);

    const toastPortal =
      mounted && !hasNavigation
        ? createPortal(
            <div
              role="status"
              aria-live="polite"
              className={`fixed bottom-[24px] sm:bottom-[32px] left-1/2 -translate-x-1/2 z-50 flex h-[56px] w-auto max-w-[calc(100vw-32px)] items-center justify-center rounded-[12px] bg-surface px-[24px] shadow-[0_12px_36px_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.25)] transition-all duration-300 ease-out select-none ${
                toastVisible
                  ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                  : "opacity-0 translate-y-[12px] scale-95 pointer-events-none"
              }`}
            >
              <span className="font-hauora text-[15px] sm:text-[16px] font-normal leading-none text-content-contrast whitespace-nowrap">
                Case study is in progress
              </span>
            </div>,
            document.body
          )
        : null;

    if (href && isAvailable) {
      const isInternal = href.startsWith("/");

      if (isInternal) {
        return (
          <Link
            ref={ref as React.Ref<HTMLAnchorElement>}
            href={href}
            className={baseClasses}
            {...(props as any)}
          >
            {innerContent}
          </Link>
        );
      }

      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={baseClasses}
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {innerContent}
        </a>
      );
    }

    if (onClick && isAvailable) {
      return (
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          type="button"
          onClick={onClick}
          className={`${baseClasses} bg-transparent border-0 p-0 text-left`}
          {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        >
          {innerContent}
        </button>
      );
    }

    return (
      <>
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          type="button"
          onClick={handleInactiveClick}
          className={`${baseClasses} bg-transparent border-0 p-0 text-left`}
          {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        >
          {innerContent}
        </button>
        {toastPortal}
      </>
    );
  }
);

CaseLink.displayName = "CaseLink";

/** Backwards-compatible alias */
export const CaseItem = CaseLink;
export type CaseItemProps = CaseLinkProps;
