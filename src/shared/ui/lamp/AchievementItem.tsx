import React from "react";
import { Lamp, type LampProps } from "./Lamp";

export interface AchievementItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Text content of the key achievement */
  label: string;
  /** Whether the indicator lamp is active (default true) */
  active?: boolean;
  /** Custom lamp size in px (default 16) */
  lampSize?: number;
  /** Optional custom lamp props */
  lampProps?: Partial<LampProps>;
}

/**
 * Key Achievement List Item Component
 * Features an authentic skeuomorphic amber indicator lamp with typographic achievement label
 */
export const AchievementItem = React.forwardRef<HTMLDivElement, AchievementItemProps>(
  (
    {
      label,
      active = true,
      lampSize = 16,
      lampProps,
      className = "",
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`group flex w-full flex-row items-start sm:items-center gap-[12px] select-none ${className}`}
        {...props}
      >
        {/* Amber Indicator Lamp */}
        <div className="shrink-0 pt-[3px] sm:pt-0">
          <Lamp size={lampSize} active={active} {...lampProps} />
        </div>

        {/* Achievement Label with font-stetica & text-content-primary */}
        <span className="flex-1 min-w-0 text-[16px] sm:text-[18px] leading-[20px] sm:leading-[22px] font-normal text-content-primary font-stetica tracking-normal break-words whitespace-normal transition-colors duration-150 group-hover:text-content-contrast">
          {label}
        </span>
      </div>
    );
  }
);

AchievementItem.displayName = "AchievementItem";
