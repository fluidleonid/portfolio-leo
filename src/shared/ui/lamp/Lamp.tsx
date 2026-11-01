import React from "react";

export interface LampProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Size of the outer lamp socket in px (default 16) */
  size?: number;
  /** Whether the lamp is currently glowing (default true) */
  active?: boolean;
}

/**
 * Skeuomorphic Circular Amber Indicator Lamp (Jewel LED)
 *
 * Hardware anatomy:
 * 1. Outer Socket Bezel: Recessed dark metal cavity with inner shadow
 * 2. Amber Glass Lens: Multi-stop incandescent core gradient
 * 3. Specular Micro-Highlight: Top-left light catch on the curved glass dome
 * 4. Atmospheric Radial Halo: Warm amber ambient emission
 */
export const Lamp = React.forwardRef<HTMLSpanElement, LampProps>(
  ({ size = 16, active = true, className = "", style, ...props }, ref) => {
    const lensSize = Math.max(8, size - 4);

    return (
      <span
        ref={ref}
        aria-hidden="true"
        className={`relative inline-flex shrink-0 items-center justify-center rounded-full bg-black/40 p-[2px] shadow-[inset_0_1.5px_2px_rgba(0,0,0,0.6),inset_0_-1px_1px_rgba(255,255,255,0.04)] select-none ${className}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          ...style,
        }}
        {...props}
      >
        {/* Amber Glass Core Lens */}
        <span
          className="relative block rounded-full transition-all duration-300"
          style={{
            width: `${lensSize}px`,
            height: `${lensSize}px`,
            background: active
              ? "radial-gradient(circle at 36% 32%, #FFF4B8 0%, #FFB733 35%, #FFAA00 65%, #C25E00 100%)"
              : "radial-gradient(circle at 40% 36%, #4A3A28 0%, #2E251A 70%, #1A1510 100%)",
            boxShadow: active
              ? "0 0 6px 1.5px rgba(255, 170, 0, 0.55), 0 0 14px 3px rgba(255, 170, 0, 0.22), inset 0 1px 1.5px rgba(255, 255, 255, 0.45), inset 0 -1px 1px rgba(0, 0, 0, 0.35)"
              : "inset 0 1px 1px rgba(255, 255, 255, 0.08), inset 0 -1px 1px rgba(0, 0, 0, 0.5)",
          }}
        />
      </span>
    );
  }
);

Lamp.displayName = "Lamp";
