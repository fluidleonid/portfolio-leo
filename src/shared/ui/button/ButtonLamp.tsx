import React from "react";

export interface ButtonLampProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string | number;
  /** Size variant: default (48x48), sm (40x40), or responsive (sm on mobile, default on desktop) */
  size?: "default" | "sm" | "responsive";
}

/**
 * ButtonLamp (Tactile Illuminated Indicator Button)
 * 1:1 direct mathematical extraction from Figma node `52:1767` / `76:623`:
 *
 * Size specifications:
 * - default: outer socket 48x48px (rounded 12px, p-4px), inner btn 40x40px (rounded 8px)
 * - sm: outer socket 40x40px (rounded 10px, p-3px), inner btn 34x34px (rounded 7px)
 * - responsive: sm on mobile (<sm), default on desktop (sm+)
 *
 * Upward shadow: 0 -4px 4px rgba(0,0,0,0.25)
 * Glass micro-facet: inset 0 1px 4px rgba(38,36,36,0.04)
 * Hover / active: illuminated multi-center organic mesh gradient + gentle contained amber glow
 * Exact backdrop blur 20px with subtle 2%->4% linear diffuser
 * Numeral: AA Stetica 18px medium (text-content-primary)
 */
export const ButtonLamp = React.forwardRef<HTMLButtonElement, ButtonLampProps>(
  ({ className = "", label = "1", size = "default", disabled, children, ...props }, ref) => {
    // Outer socket classes
    const socketSizeClass =
      size === "sm"
        ? "h-[40px] w-[40px] rounded-[10px] p-[3px]"
        : size === "responsive"
        ? "h-[40px] sm:h-[48px] w-[40px] sm:w-[48px] rounded-[10px] sm:rounded-[12px] p-[3px] sm:p-[4px]"
        : "h-[48px] w-[48px] rounded-[12px] p-[4px]";

    // Inner btn frame classes
    const innerSizeClass =
      size === "sm"
        ? "h-[34px] w-[34px] rounded-[7px]"
        : size === "responsive"
        ? "h-[34px] sm:h-[40px] w-[34px] sm:w-[40px] rounded-[7px] sm:rounded-[8px]"
        : "h-[40px] w-[40px] rounded-[8px]";

    // Inner rounded class for overlays
    const roundedClass =
      size === "sm"
        ? "rounded-[7px]"
        : size === "responsive"
        ? "rounded-[7px] sm:rounded-[8px]"
        : "rounded-[8px]";

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        aria-label={props["aria-label"] || `Button lamp ${label}`}
        className={`group relative inline-flex shrink-0 cursor-pointer select-none items-center justify-center bg-black/16 shadow-[inset_0_-1px_2px_rgba(0,0,0,0.25),inset_0_-3px_2px_rgba(0,0,0,0.25)] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500/40 disabled:pointer-events-none disabled:opacity-40 [transform:translateZ(0)] ${socketSizeClass} ${className}`}
        {...props}
      >
        {/* Inner btn frame */}
        <span
          className={`relative flex items-center justify-center overflow-hidden shadow-[0_-4px_4px_rgba(0,0,0,0.25),inset_0_1px_4px_rgba(38,36,36,0.04)] transition-all duration-150 ease-out group-hover:shadow-[0_0_4px_rgba(207,107,6,0.25),inset_0_1px_2px_rgba(255,255,255,0.12)] group-active:translate-y-[0.5px] [transform:translateZ(0)] [-webkit-mask-image:-webkit-radial-gradient(white,black)] ${innerSizeClass}`}
        >
          {/* Multi-Center Organic Mesh Gradient (Lights up on hover) */}
          <span
            className={`pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100 group-active:opacity-100 ${roundedClass}`}
            style={{
              background: `
                radial-gradient(circle at 48% 36%, #FFE57F 0%, #FFCC5D 32%, transparent 68%),
                radial-gradient(circle at 22% 72%, #FFB726 0%, transparent 62%),
                radial-gradient(circle at 78% 78%, #CF4206 0%, #A52800 55%, transparent 78%),
                radial-gradient(circle at 18% 22%, #CF6B06 0%, transparent 65%),
                linear-gradient(145deg, #CF6B06 0%, #CF4206 65%, #8A2000 100%)
              `,
            }}
          />

          {/* Exact Figma Glass Diffuser (linear gradient 2% -> 4% + backdrop blur 20px) */}
          <span
            className={`pointer-events-none absolute inset-0 backdrop-blur-[20px] ${roundedClass}`}
            style={{
              background:
                "linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.04) 100%)",
            }}
          />

          {/* Centered Numeral with Font Token font-stetica & text-content-primary (#CCCCCC) */}
          <span
            className="pointer-events-none relative z-10 flex h-full w-full items-center justify-center text-center text-[18px] font-medium leading-none tracking-normal text-content-primary font-stetica transition-colors duration-150 group-hover:text-surface group-active:text-surface"
          >
            <span className="translate-y-[-0.5px]">{children ?? label}</span>
          </span>
        </span>
      </button>
    );
  }
);

ButtonLamp.displayName = "ButtonLamp";
