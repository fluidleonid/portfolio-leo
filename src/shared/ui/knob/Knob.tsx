"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

export interface KnobProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Current rotation angle in degrees (controlled, e.g. -58, 58, -122, 122) */
  value?: number;
  /** Initial rotation angle in degrees (uncontrolled, default -58) */
  defaultValue?: number;
  /** Minimum angle in degrees (optional, undefined = full 360° unconstrained rotation) */
  minAngle?: number;
  /** Maximum angle in degrees (optional, undefined = full 360° unconstrained rotation) */
  maxAngle?: number;
  /** Magnetic snap angles (e.g. [-122, -58, 58, 122]) */
  snapAngles?: number[];
  /** Callback fired on continuous rotation change */
  onChange?: (angle: number) => void;
  /** Callback fired when magnetically snapping to a target point */
  onSnap?: (angle: number, snapIndex: number) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Label for screen readers */
  "aria-label"?: string;
}

/**
 * Tactile Rotary Knob Component with True 360° Radial Slider Drag & Shortest-Path Easing
 * 1:1 Spec-matched from Figma node `knob (75:592)`
 */
export const Knob = React.forwardRef<HTMLDivElement, KnobProps>(
  (
    {
      value: controlledValue,
      defaultValue = -58,
      minAngle,
      maxAngle,
      snapAngles = [-122, -58, 58, 122],
      onChange,
      onSnap,
      disabled = false,
      className = "",
      "aria-label": ariaLabel = "Tactile Rotary Knob",
      ...props
    },
    ref
  ) => {
    const knobContainerRef = useRef<HTMLDivElement | null>(null);

    const [currentAngle, setCurrentAngle] = useState<number>(
      controlledValue !== undefined ? controlledValue : defaultValue
    );
    const [isDragging, setIsDragging] = useState<boolean>(false);

    const isControlled = controlledValue !== undefined;
    const internalAngleRef = useRef<number>(currentAngle);
    internalAngleRef.current = currentAngle;

    // Helper: Normalize any angle to [-180, 180)
    const normalizeAngle = (angle: number): number => {
      let a = angle % 360;
      if (a > 180) a -= 360;
      if (a <= -180) a += 360;
      return a;
    };

    // Helper: Calculate shortest angular difference between from and to (-180 to 180)
    const getShortestDelta = (from: number, to: number): number => {
      return normalizeAngle(to - from);
    };

    // Find nearest snap point from a given angle
    const findNearestSnap = useCallback(
      (angle: number): { angle: number; index: number } => {
        if (!snapAngles || snapAngles.length === 0) {
          return { angle, index: -1 };
        }
        let minDiff = Infinity;
        let bestSnap = snapAngles[0];
        let bestIndex = 0;

        snapAngles.forEach((snap, idx) => {
          const diff = Math.abs(getShortestDelta(angle, snap));
          if (diff < minDiff) {
            minDiff = diff;
            bestSnap = snap;
            bestIndex = idx;
          }
        });

        return { angle: bestSnap, index: bestIndex };
      },
      [snapAngles]
    );

    // Sync controlledValue updates with shortest path continuous rotation (only when not actively dragging)
    useEffect(() => {
      if (controlledValue === undefined || isDragging) return;

      const current = internalAngleRef.current;
      const delta = getShortestDelta(current, controlledValue);
      const nextContinuousAngle = current + delta;

      setCurrentAngle(nextContinuousAngle);
      internalAngleRef.current = nextContinuousAngle;
    }, [controlledValue, isDragging]);

    // Calculate angle from pointer event relative to knob center
    const calculateAngleFromPointer = (
      e: React.PointerEvent<HTMLDivElement> | PointerEvent
    ): number => {
      if (!knobContainerRef.current) return 0;
      const rect = knobContainerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;

      let radians = Math.atan2(deltaY, deltaX);
      let degrees = radians * (180 / Math.PI) + 90;

      return normalizeAngle(degrees);
    };

    // Drag handlers - incremental delta tracking for true 360° unconstrained radial slider rotation
    const lastPointerAngleRef = useRef<number>(0);

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled || e.button !== 0) return;
      e.preventDefault();

      const pointerAngle = calculateAngleFromPointer(e);
      lastPointerAngleRef.current = pointerAngle;

      setIsDragging(true);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging || disabled) return;
      e.preventDefault();

      const pointerAngle = calculateAngleFromPointer(e);
      const delta = getShortestDelta(
        lastPointerAngleRef.current,
        pointerAngle
      );
      lastPointerAngleRef.current = pointerAngle;

      let nextAngle = internalAngleRef.current + delta;

      if (minAngle !== undefined) nextAngle = Math.max(minAngle, nextAngle);
      if (maxAngle !== undefined) nextAngle = Math.min(maxAngle, nextAngle);

      setCurrentAngle(nextAngle);
      internalAngleRef.current = nextAngle;

      onChange?.(normalizeAngle(nextAngle));
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;

      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }

      setIsDragging(false);

      const nearest = findNearestSnap(internalAngleRef.current);
      const delta = getShortestDelta(internalAngleRef.current, nearest.angle);
      const snappedAngle = internalAngleRef.current + delta;

      // Magnetically glide to exact nearest snap position on release
      setCurrentAngle(snappedAngle);
      internalAngleRef.current = snappedAngle;

      onChange?.(nearest.angle);
      onSnap?.(nearest.angle, nearest.index);
    };

    // Mouse wheel support
    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
      if (disabled) return;
      e.preventDefault();

      const step = 6;
      const direction = e.deltaY > 0 ? 1 : -1;
      let nextAngle = internalAngleRef.current + direction * step;

      if (minAngle !== undefined) nextAngle = Math.max(minAngle, nextAngle);
      if (maxAngle !== undefined) nextAngle = Math.min(maxAngle, nextAngle);

      setCurrentAngle(nextAngle);
      internalAngleRef.current = nextAngle;

      onChange?.(normalizeAngle(nextAngle));
    };

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;

      let step = 0;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") step = 10;
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") step = -10;

      if (step !== 0) {
        e.preventDefault();
        let nextAngle = internalAngleRef.current + step;
        if (minAngle !== undefined) nextAngle = Math.max(minAngle, nextAngle);
        if (maxAngle !== undefined) nextAngle = Math.min(maxAngle, nextAngle);

        const nearest = findNearestSnap(nextAngle);
        const delta = getShortestDelta(internalAngleRef.current, nearest.angle);
        const snappedAngle = internalAngleRef.current + delta;

        if (!isControlled) {
          setCurrentAngle(snappedAngle);
          internalAngleRef.current = snappedAngle;
        }

        onChange?.(nearest.angle);
        onSnap?.(nearest.angle, nearest.index);
      }
    };

    return (
      <div
        ref={ref}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabel}
        aria-valuemin={minAngle ?? -360}
        aria-valuemax={maxAngle ?? 360}
        aria-valuenow={Math.round(currentAngle)}
        aria-disabled={disabled}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => {
          if (isDragging) e.preventDefault();
        }}
        onWheel={handleWheel}
        onKeyDown={handleKeyDown}
        style={{ touchAction: "none" }}
        className={`group relative inline-flex h-[68px] w-[68px] shrink-0 touch-none select-none items-center justify-center rounded-full bg-black/15 p-[4px] shadow-[inset_0_4px_4px_rgba(0,0,0,0.12),inset_0_-1px_1px_rgba(255,255,255,0.02)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500/40 ${
          disabled
            ? "pointer-events-none opacity-40"
            : isDragging
            ? "cursor-grabbing"
            : "cursor-grab"
        } ${className}`}
        {...props}
      >
        {/* Rotary Cap (60x60px) */}
        <div
          ref={knobContainerRef}
          className="relative h-[60px] w-[60px] rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.12),0_3px_0_rgba(0,0,0,0.08)]"
          style={{
            background: "linear-gradient(180deg, var(--color-surface-pill, #2c2c2c) 0%, var(--color-surface, #242424) 100%)",
            transform: `rotate(${currentAngle}deg)`,
            transition: isDragging
              ? "none"
              : "transform 550ms cubic-bezier(0.22, 1, 0.36, 1)",
            boxShadow:
              "inset 0.5px 1px 0 rgba(255,255,255,0.08), inset -0.5px -1px 0 rgba(0,0,0,0.20), 0 3px 0 rgba(0,0,0,0.08), 0 2px 12px rgba(0,0,0,0.12)",
          }}
        >
          {/* Tactile Dimple / Dragger (10x10px at 12 o'clock, x: 25px, y: 6px) */}
          <div
            className="absolute left-[25px] top-[6px] h-[10px] w-[10px] rounded-full"
            style={{
              background: "linear-gradient(180deg, var(--color-surface-pill, #262626) 0%, var(--color-surface-groove, #1f1f1f) 100%)",
              boxShadow:
                "inset 0 0 8.2px 0.55px rgba(0,0,0,0.10), inset 0 0.55px 2.2px 1.11px rgba(0,0,0,0.10)",
            }}
          />
        </div>
      </div>
    );
  }
);

Knob.displayName = "Knob";
