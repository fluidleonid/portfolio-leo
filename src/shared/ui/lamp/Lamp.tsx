import React from "react";

export interface LampProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Size of the outer lamp socket in px (default 20) */
  size?: number;
  /** Whether the lamp is currently glowing (default true) */
  active?: boolean;
}

/**
 * Skeuomorphic Circular Amber Indicator Lamp (Jewel LED)
 * 1:1 calibrated with Figma skeuomorphic lamp nodes (108:768 & 118:1320).
 *
 * Hardware anatomy:
 * 1. Outer Socket Bezel: Recessed dark cavity with inner shadow & subtle hardware ring
 * 2. Amber Glass Lens: Multi-stop incandescent core gradient with specular highlight
 * 3. Atmospheric Radial Halo: Warm amber ambient emission (when active)
 * 4. Frosted Glass Dome: Translucent white lens (when inactive)
 */
export const Lamp = React.forwardRef<HTMLSpanElement, LampProps>(
  ({ size = 20, active = true, className = "", style, ...props }, ref) => {
    const isLarge = size >= 20;
    const lensSize = isLarge ? 12 : Math.max(6, size - 4);
    const paddingClass = isLarge ? "p-[4px]" : "p-[2px]";

    return (
      <span
        ref={ref}
        aria-hidden="true"
        className={`relative inline-flex shrink-0 items-center justify-center rounded-full bg-black/[0.12] ${paddingClass} ${
          active
            ? "shadow-[inset_0_1.5px_2px_rgba(0,0,0,0.35),inset_0_-1px_1px_rgba(255,255,255,0.05)] border border-[#2a2a2f]/60"
            : "shadow-[inset_0_1.5px_2px_rgba(0,0,0,0.70),inset_0_-1px_1px_rgba(255,255,255,0.04)] border border-[#2a2a2f]/40"
        } select-none ${className}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          ...style,
        }}
        {...props}
      >
        {/* Core Jewel Lens (1:1 from Figma nodes 108:768 & 118:1320) */}
        <span
          className="relative block rounded-full transition-all duration-300"
          style={{
            width: `${lensSize}px`,
            height: `${lensSize}px`,
            background: active
              ? "radial-gradient(circle at 35% 35%, #FFF4B8 0%, #FFB733 35%, #FFAA00 65%, #C25E00 100%)"
              : "radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.32) 0%, rgba(255, 255, 255, 0.24) 100%), rgba(255, 255, 255, 0.08)",
            boxShadow: active
              ? isLarge
                ? "0 0 10px 2px rgba(255, 170, 0, 0.85), 0 0 4px 1px rgba(255, 170, 0, 0.5), inset 0 -1px 2px rgba(255, 255, 255, 0.60)"
                : "0 0 5px 1px rgba(255, 170, 0, 0.60), inset 0 0.5px 1px rgba(255, 255, 255, 0.50)"
              : "inset 0 1px 1px rgba(255, 255, 255, 0.08), inset 0 -1px 1px rgba(0, 0, 0, 0.50)",
          }}
        />
      </span>
    );
  }
);

Lamp.displayName = "Lamp";
