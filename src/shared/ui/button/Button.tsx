import React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Optional hardware label (1:1 from Figma node `button (75:619)` / `heading (75:621)`) */
  label?: React.ReactNode;
  /** Position of the label relative to the button pill (default "bottom") */
  labelPosition?: "bottom" | "right";
  /** Optional class name for the label text */
  labelClassName?: string;
  /** Optional class name for the inner tactile pill */
  buttonClassName?: string;
  /** Size variant: default (64x36), sm (44x28), or responsive (sm on mobile, default on desktop) */
  size?: "default" | "sm" | "responsive";
}

/**
 * Tactile Skeuomorphic Button
 * 1:1 Color-calibrated extraction from Figma using Semantic Design Tokens:
 * - Canvas: bg-canvas (#292929)
 * - Outer recessed well: bg-black/15
 * - Inner tactile cap: linear gradient surface-pill -> surface
 * - Full interactive hit zone: includes both the tactile pill and the label
 * - Label positions: "bottom" (default for COMM pills) or "right" (for CASE rows)
 * - Size specifications:
 *   - default: whole base 64x36px, inner cap 56x28px
 *   - sm: whole base 44x28px, inner cap 38x22px
 *   - responsive: sm on mobile (<sm), default on desktop (sm+)
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      buttonClassName = "",
      labelClassName = "",
      label,
      labelPosition = "bottom",
      size = "default",
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isHorizontal = labelPosition === "right";

    // Well size classes (outer base of the button)
    const wellSizeClass =
      size === "sm"
        ? "h-[28px] w-[44px] rounded-[36px] p-[3px] pt-[2.5px]"
        : size === "responsive"
        ? "h-[28px] sm:h-[36px] w-[44px] sm:w-[64px] rounded-[36px] sm:rounded-[44px] p-[3px] sm:p-[4px] pt-[2.5px] sm:pt-[3px]"
        : "h-[36px] w-[64px] rounded-[44px] p-[4px] pt-[3px]";

    // Cap size classes (inner tactile cap)
    const capSizeClass =
      size === "sm"
        ? "h-[22px] w-[38px] rounded-[32px]"
        : size === "responsive"
        ? "h-[22px] sm:h-[28px] w-[38px] sm:w-[56px] rounded-[32px] sm:rounded-[40px]"
        : "h-[28px] w-[56px] rounded-[40px]";

    // Hit-target / container width when label is stacked below
    const containerWidthClass =
      isHorizontal
        ? ""
        : size === "sm"
        ? "w-[44px]"
        : size === "responsive"
        ? "w-[44px] sm:w-[64px]"
        : "w-[64px]";

    // Label width class
    const labelWidthClass =
      isHorizontal
        ? "text-left"
        : size === "sm"
        ? "w-[44px] text-center"
        : size === "responsive"
        ? "w-[44px] sm:w-[64px] text-center"
        : "w-[64px] text-center";

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        aria-label={
          props["aria-label"] ||
          (typeof label === "string" ? label : "Tactile Button")
        }
        className={`group relative inline-flex ${
          isHorizontal
            ? "flex-row items-center gap-[16px]"
            : `flex-col items-center gap-[4px] ${containerWidthClass}`
        } cursor-pointer select-none focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40 ${className}`}
        {...props}
      >
        {/* Tactile Pill Well (Base: 44x28 in sm, 64x36 in default) */}
        <span
          className={`relative inline-flex shrink-0 items-center justify-center bg-black/15 shadow-[inset_0_2px_3px_rgba(0,0,0,0.25),inset_0_-1px_1px_rgba(255,255,255,0.02)] transition-all duration-150 group-focus-visible:ring-2 group-focus-visible:ring-neutral-500/40 ${wellSizeClass} ${buttonClassName}`}
        >
          {/* Inner Tactile Cap */}
          <span
            className={`relative block shadow-[inset_0_1px_0_rgba(255,255,255,0.06),inset_0_-1px_0_rgba(0,0,0,0.25),0_2px_2px_rgba(0,0,0,0.20)] transition-all duration-150 ease-out group-hover:translate-y-[1px] group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),inset_0_-1px_0_rgba(0,0,0,0.25),0_1px_1px_rgba(0,0,0,0.15)] group-active:translate-y-[1px] group-active:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),inset_0_-1px_0_rgba(0,0,0,0.25),0_1px_1px_rgba(0,0,0,0.15)] ${capSizeClass}`}
            style={{
              background:
                "linear-gradient(175deg, var(--color-surface-pill, #2c2c2c) 0%, var(--color-surface, #242424) 100%)",
            }}
          >
            {children}
          </span>
        </span>

        {/* Hardware Label: AA Stetica styled with text-content-primary (#CCCCCC) */}
        {label && (
          <span
            className={`${labelWidthClass} text-[18px] leading-[22px] font-normal text-content-primary transition-colors duration-150 select-none tracking-normal font-stetica group-hover:text-content-contrast ${labelClassName}`}
          >
            {label}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
