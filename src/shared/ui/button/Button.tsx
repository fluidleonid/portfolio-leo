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
}

/**
 * Tactile Skeuomorphic Button
 * 1:1 Color-calibrated extraction from Figma using Semantic Design Tokens:
 * - Canvas: bg-canvas (#292929)
 * - Outer recessed well: bg-black/15
 * - Inner tactile cap: linear gradient surface-pill -> surface
 * - Full interactive hit zone: includes both the tactile pill and the label
 * - Label positions: "bottom" (default for COMM pills) or "right" (for CASE rows)
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      buttonClassName = "",
      labelClassName = "",
      label,
      labelPosition = "bottom",
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isHorizontal = labelPosition === "right";

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
            : "flex-col items-center gap-[4px] w-[64px]"
        } cursor-pointer select-none focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40 ${className}`}
        {...props}
      >
        {/* Tactile Pill Well (36x64px) */}
        <span
          className={`relative inline-flex h-[36px] w-[64px] shrink-0 items-center justify-center rounded-[44px] bg-black/15 p-[4px] pt-[3px] shadow-[inset_0_2px_3px_rgba(0,0,0,0.25),inset_0_-1px_1px_rgba(255,255,255,0.02)] transition-all duration-150 group-focus-visible:ring-2 group-focus-visible:ring-neutral-500/40 ${buttonClassName}`}
        >
          {/* Inner Tactile Cap (28x56px) */}
          <span
            className="relative block h-[28px] w-[56px] rounded-[40px] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),inset_0_-1px_0_rgba(0,0,0,0.25),0_2px_2px_rgba(0,0,0,0.20)] transition-all duration-150 ease-out group-hover:translate-y-[1px] group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),inset_0_-1px_0_rgba(0,0,0,0.25),0_1px_1px_rgba(0,0,0,0.15)] group-active:translate-y-[1px] group-active:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),inset_0_-1px_0_rgba(0,0,0,0.25),0_1px_1px_rgba(0,0,0,0.15)]"
            style={{
              background: "linear-gradient(175deg, var(--color-surface-pill, #2c2c2c) 0%, var(--color-surface, #242424) 100%)",
            }}
          >
            {children}
          </span>
        </span>

        {/* Hardware Label: AA Stetica styled with text-content-primary (#CCCCCC) */}
        {label && (
          <span
            className={`${
              isHorizontal ? "text-left" : "w-[64px] text-center"
            } text-[18px] leading-[22px] font-normal text-content-primary transition-colors duration-150 select-none tracking-normal font-stetica group-hover:text-content-contrast ${labelClassName}`}
          >
            {label}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
