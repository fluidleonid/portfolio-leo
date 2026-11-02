import React from "react";

export interface SectionProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional hardware notched label (e.g. "NAV", "CV", "COMM", "KEY", "CASE") */
  label?: string;
  /** Direction of internal flex items: "row" (default) or "column" */
  direction?: "row" | "column";
  /** Optional class name for the notched label wrapper */
  labelClassName?: string;
  /** Optional class name for the notched label text */
  textClassName?: string;
}

/**
 * Tactile Section Container with Notched Hardware Badge
 * Fully tokenized with Tailwind design tokens:
 * - Outline: border border-border-hardware (#383838)
 * - Canvas background mask: bg-canvas (#292929)
 * - Typography: font-hauora 14px / 24px, font-normal, text-content-primary (#CCCCCC)
 */
export const Section = React.forwardRef<HTMLDivElement, SectionProps>(
  (
    {
      label,
      direction = "row",
      className = "",
      labelClassName = "",
      textClassName = "",
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`relative flex ${
          direction === "column" ? "flex-col" : "flex-row"
        } items-center rounded-none border border-border-hardware bg-transparent ${className}`}
        {...props}
      >
        {children}

        {label && (
          <div
            className={`absolute left-[16px] sm:left-[28px] -bottom-[12px] flex h-[24px] items-center justify-center bg-canvas px-[4px] select-none ${labelClassName}`}
          >
            <span
              className={`text-[14px] font-normal leading-[24px] text-content-badge font-hauora uppercase tracking-normal ${textClassName}`}
              style={{ color: "var(--color-content-badge, rgba(204, 204, 204, 0.16))" }}
            >
              {label}
            </span>
          </div>
        )}
      </div>
    );
  }
);

Section.displayName = "Section";
