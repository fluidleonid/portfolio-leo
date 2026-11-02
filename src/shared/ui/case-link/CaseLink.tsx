import React from "react";
import { Lamp } from "@/shared/ui/lamp";

export interface CaseLinkProps extends React.HTMLAttributes<HTMLElement> {
  /** Text label of the case study */
  label: string;
  /** Optional external link destination */
  href?: string;
  /** Whether the case study is active and accessible (default true) */
  active?: boolean;
  /** Optional click handler */
  onClick?: () => void;
  /** Indicator lamp size in px (default 10) */
  lampSize?: number;
}

/**
 * Tactile Case Study Link / Button Component
 * 1:1 styled for the CASE section in project blocks.
 *
 * Features:
 * - Minimum height of 28px for effortless touch & click targets
 * - Skeuomorphic indicator Lamp (size 10px, glowing when active)
 * - Typography: Hauora Light 18px / 24px in text-content-primary (#CCCCCC)
 * - Hover state: shifts to text-content-contrast (#FFFFFF)
 * - Inactive state: text-content-muted (#8C8C8C), opacity 50%, cursor-default
 * - Semantic rendering: <a> when href is present, <button> when onClick is present, <div> when inactive
 */
export const CaseLink = React.forwardRef<HTMLElement, CaseLinkProps>(
  (
    {
      label,
      href,
      active = true,
      onClick,
      lampSize = 10,
      className = "",
      ...props
    },
    ref
  ) => {
    const isAvailable = active !== false;

    const innerContent = (
      <>
        {/* Skeuomorphic Indicator Lamp */}
        <div className="shrink-0 flex items-center justify-center">
          <Lamp size={lampSize} active={isAvailable} />
        </div>

        {/* Case Title with Hauora Light 18 */}
        <span
          className={`flex-1 min-w-0 font-hauora font-light text-[18px] leading-[24px] ${
            isAvailable
              ? "text-content-primary group-hover:text-content-contrast"
              : "text-content-muted"
          } transition-colors duration-150 break-words whitespace-normal text-left`}
        >
          {label}
        </span>
      </>
    );

    const baseClasses = `group flex min-h-[28px] w-full flex-row items-center gap-[10px] select-none transition-colors duration-150 ${
      isAvailable
        ? "cursor-pointer"
        : "cursor-default opacity-50"
    } ${className}`;

    if (href && isAvailable) {
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
          className={`${baseClasses} bg-transparent border-0 p-0`}
          {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        >
          {innerContent}
        </button>
      );
    }

    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        className={baseClasses}
        {...(props as React.HTMLAttributes<HTMLDivElement>)}
      >
        {innerContent}
      </div>
    );
  }
);

CaseLink.displayName = "CaseLink";

/** Backwards-compatible alias */
export const CaseItem = CaseLink;
export type CaseItemProps = CaseLinkProps;
