"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FunLedMatrix, type FunAnimationMode } from "@/shared/ui/led-matrix";
import { Section } from "@/shared/ui/section";

export default function LedTestPage() {
  const [mode, setMode] = useState<FunAnimationMode>("picasso");
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1.0);
  const [intensity, setIntensity] = useState<number>(1.0);
  const [theme, setTheme] = useState<"amber" | "monochrome">("amber");
  const [igniteTrigger, setIgniteTrigger] = useState<boolean>(false);
  const [isManualScrub, setIsManualScrub] = useState<boolean>(false);
  const [morphPercent, setMorphPercent] = useState<number>(100);

  const handleTriggerIgnite = () => {
    setIgniteTrigger(true);
    setTimeout(() => setIgniteTrigger(false), 100);
  };

  const modeDescriptions: Record<FunAnimationMode, string> = {
    "squished-goofy":
      "Глаза опускаются вниз (+13 строк), а рот подтягивается вверх (-5 строк) прямо к ним в упор. Получается смешное компактное микро-лицо, нос уезжает на лоб, а правое ухо — на макушку.",
    "pixel-sort":
      "Попиксельный сдвиг со струйной турбулентностью: в моменты перехода пиксели вибрируют и текут цифровыми полосами, собираясь в комичную гримасу.",
    picasso:
      "Полный скрамбл портрета (98 квадратиков): двигается весь портрет целиком, включая плечи и футболку. Левый глаз (группа 4 квадратика 2×2) и правый глаз (группа 2 квадратика 2×1) перемещаются целиком вниз в бороду. Рот и нос на макушке перевернуты вверх ногами. Футболка и плечи перекрестно перетасованы. 100% без наложений.",
    swap: "Рот и глаза плавно меняются местами по дуге, задерживаются и возвращаются обратно.",
    "rolling-ears":
      "Уши отсоединяются от головы и катаются в стороны к границам экрана на синусоиде.",
    carnival:
      "Полный фановый разнос: глаза и рот поменялись местами, уши катаются по краям, нос вибрирует.",
    scatter:
      "Модули экрана разлетаются во все стороны и с эффектом магнетизма собираются обратно.",
    liquid:
      "Психоделические горизонтальные волны плавят и сдвигают слои портрета в реальном времени.",
    idle: "Оригинальный спокойный портрет без искажений.",
  };

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-start bg-canvas px-[16px] py-[32px] sm:py-[48px] select-none text-content-primary font-hauora">
      <div className="flex w-full max-w-[564px] flex-col gap-[24px] sm:gap-[32px]">
        {/* Top Back Link */}
        <nav className="flex w-full items-center justify-start">
          <Link
            href="/"
            className="inline-flex items-center gap-[8px] font-hauora text-[16px] font-light leading-[24px] text-content-secondary hover:text-content-primary transition-colors duration-150"
          >
            <span>←</span>
            <span>back to portfolio</span>
          </Link>
        </nav>

        {/* Title Header */}
        <div className="flex w-full flex-col gap-[8px]">
          <h1 className="text-[20px] font-semibold leading-[28px] text-content-primary tracking-normal">
            LED Matrix Lab · /portrait-2.png
          </h1>
          <p className="text-[18px] font-light leading-[26px] text-content-secondary">
            Попиксельная пересортировка: глаза и рот стягиваются вместе в упор, создавая смешную гримасу с цифровой турбулентностью.
          </p>
        </div>

        {/* THE LED SCREEN STAGE */}
        <div className="relative flex w-full max-w-[564px] h-[258px] items-center justify-center overflow-hidden rounded-[8px] bg-[#1a1a1a] shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)]">
          <FunLedMatrix
            src="/portrait-2.png"
            mode={mode}
            speed={speed}
            intensity={intensity}
            isPlaying={isPlaying}
            manualMorphProgress={isManualScrub ? morphPercent / 100 : undefined}
            theme={theme}
            cols={28}
            rows={13}
            pixelSize={18}
            gap={2}
            subPixelSize={2}
            interactive={true}
            triggerIgnite={igniteTrigger}
          />
        </div>

        {/* Mode Description Bar */}
        <div className="flex w-full flex-col gap-[4px] rounded-[10px] bg-surface p-[16px] border border-border-hardware">
          <span className="font-hauora font-medium text-[14px] text-signal-amber uppercase tracking-wider">
            {mode === "squished-goofy" && "🤪 Режим: Глаза + Рот вместе (Микро-лицо)"}
            {mode === "pixel-sort" && "⚡ Режим: Попиксельная сортировка (Stream Sort)"}
            {mode === "picasso" && "🎨 Режим: Пикассо / Кубизм"}
            {mode === "swap" && "🎭 Режим: Рот ↔ Глаза"}
            {mode === "rolling-ears" && "👂 Режим: Катающиеся уши"}
            {mode === "carnival" && "🎪 Режим: Карнавал / Полный разнос"}
            {mode === "scatter" && "💥 Режим: Распад и сборка"}
            {mode === "liquid" && "🌊 Режим: Волна / Плавление"}
            {mode === "idle" && "👤 Режим: Оригинал"}
          </span>
          <p className="font-hauora font-light text-[14px] leading-[20px] text-content-secondary">
            {modeDescriptions[mode]}
          </p>
        </div>

        {/* SECTION 1: ANIMATION MODES SELECTOR */}
        <Section
          label="MODE"
          direction="column"
          className="w-full gap-[12px] p-[16px] sm:p-[20px]"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-[8px] w-full">
            <button
              type="button"
              onClick={() => setMode("squished-goofy")}
              className={`flex h-[42px] items-center justify-center rounded-[8px] px-[12px] font-hauora text-[13px] font-medium transition-all duration-150 ${
                mode === "squished-goofy"
                  ? "bg-signal-amber text-[#1a1a1a] shadow-[0_0_12px_rgba(255,170,0,0.4)]"
                  : "bg-surface-pill text-content-secondary hover:text-content-primary hover:bg-[#383838]"
              }`}
            >
              🤪 Рот + Глаза
            </button>

            <button
              type="button"
              onClick={() => setMode("pixel-sort")}
              className={`flex h-[42px] items-center justify-center rounded-[8px] px-[12px] font-hauora text-[13px] font-medium transition-all duration-150 ${
                mode === "pixel-sort"
                  ? "bg-signal-amber text-[#1a1a1a] shadow-[0_0_12px_rgba(255,170,0,0.4)]"
                  : "bg-surface-pill text-content-secondary hover:text-content-primary hover:bg-[#383838]"
              }`}
            >
              ⚡ Сортировка
            </button>

            <button
              type="button"
              onClick={() => setMode("picasso")}
              className={`flex h-[42px] items-center justify-center rounded-[8px] px-[12px] font-hauora text-[13px] font-medium transition-all duration-150 ${
                mode === "picasso"
                  ? "bg-signal-amber text-[#1a1a1a] shadow-[0_0_12px_rgba(255,170,0,0.4)]"
                  : "bg-surface-pill text-content-secondary hover:text-content-primary hover:bg-[#383838]"
              }`}
            >
              🎨 Пикассо
            </button>

            <button
              type="button"
              onClick={() => setMode("swap")}
              className={`flex h-[42px] items-center justify-center rounded-[8px] px-[12px] font-hauora text-[13px] font-medium transition-all duration-150 ${
                mode === "swap"
                  ? "bg-signal-amber text-[#1a1a1a] shadow-[0_0_12px_rgba(255,170,0,0.4)]"
                  : "bg-surface-pill text-content-secondary hover:text-content-primary hover:bg-[#383838]"
              }`}
            >
              🎭 Рот ↔ Глаза
            </button>

            <button
              type="button"
              onClick={() => setMode("rolling-ears")}
              className={`flex h-[42px] items-center justify-center rounded-[8px] px-[12px] font-hauora text-[13px] font-medium transition-all duration-150 ${
                mode === "rolling-ears"
                  ? "bg-signal-amber text-[#1a1a1a] shadow-[0_0_12px_rgba(255,170,0,0.4)]"
                  : "bg-surface-pill text-content-secondary hover:text-content-primary hover:bg-[#383838]"
              }`}
            >
              👂 Уши
            </button>

            <button
              type="button"
              onClick={() => setMode("carnival")}
              className={`flex h-[42px] items-center justify-center rounded-[8px] px-[12px] font-hauora text-[13px] font-medium transition-all duration-150 ${
                mode === "carnival"
                  ? "bg-signal-amber text-[#1a1a1a] shadow-[0_0_12px_rgba(255,170,0,0.4)]"
                  : "bg-surface-pill text-content-secondary hover:text-content-primary hover:bg-[#383838]"
              }`}
            >
              🎪 Карнавал
            </button>

            <button
              type="button"
              onClick={() => setMode("scatter")}
              className={`flex h-[42px] items-center justify-center rounded-[8px] px-[12px] font-hauora text-[13px] font-medium transition-all duration-150 ${
                mode === "scatter"
                  ? "bg-signal-amber text-[#1a1a1a] shadow-[0_0_12px_rgba(255,170,0,0.4)]"
                  : "bg-surface-pill text-content-secondary hover:text-content-primary hover:bg-[#383838]"
              }`}
            >
              💥 Распад
            </button>

            <button
              type="button"
              onClick={() => setMode("liquid")}
              className={`flex h-[42px] items-center justify-center rounded-[8px] px-[12px] font-hauora text-[13px] font-medium transition-all duration-150 ${
                mode === "liquid"
                  ? "bg-signal-amber text-[#1a1a1a] shadow-[0_0_12px_rgba(255,170,0,0.4)]"
                  : "bg-surface-pill text-content-secondary hover:text-content-primary hover:bg-[#383838]"
              }`}
            >
              🌊 Плавление
            </button>

            <button
              type="button"
              onClick={() => setMode("idle")}
              className={`flex h-[42px] items-center justify-center rounded-[8px] px-[12px] font-hauora text-[13px] font-medium transition-all duration-150 ${
                mode === "idle"
                  ? "bg-signal-amber text-[#1a1a1a] shadow-[0_0_12px_rgba(255,170,0,0.4)]"
                  : "bg-surface-pill text-content-secondary hover:text-content-primary hover:bg-[#383838]"
              }`}
            >
              👤 Оригинал
            </button>
          </div>
        </Section>

        {/* SECTION 2: MORPH SCRUBBER (PIXEL-BY-PIXEL POSITIONING) */}
        <Section
          label="SCRUB"
          direction="column"
          className="w-full gap-[12px] p-[16px] sm:p-[20px]"
        >
          <div className="flex w-full items-center justify-between">
            <span className="font-hauora text-[14px] font-medium text-content-primary">
              Скраб перемещения пикселей
            </span>
            <div className="flex items-center gap-[6px] bg-[#1a1a1a] p-[3px] rounded-[8px]">
              <button
                type="button"
                onClick={() => setIsManualScrub(false)}
                className={`h-[28px] px-[10px] rounded-[6px] font-hauora text-[12px] font-medium transition-colors ${
                  !isManualScrub
                    ? "bg-signal-amber text-[#1a1a1a]"
                    : "text-content-secondary hover:text-content-primary"
                }`}
              >
                Auto-Loop
              </button>
              <button
                type="button"
                onClick={() => setIsManualScrub(true)}
                className={`h-[28px] px-[10px] rounded-[6px] font-hauora text-[12px] font-medium transition-colors ${
                  isManualScrub
                    ? "bg-signal-amber text-[#1a1a1a]"
                    : "text-content-secondary hover:text-content-primary"
                }`}
              >
                Ручной скраб
              </button>
            </div>
          </div>

          {isManualScrub ? (
            <div className="flex w-full flex-col gap-[10px] pt-[4px]">
              <div className="flex w-full items-center gap-[12px]">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={morphPercent}
                  onChange={(e) => setMorphPercent(Number(e.target.value))}
                  className="w-full accent-signal-amber cursor-pointer"
                />
                <span className="font-mono text-[14px] text-signal-amber w-[48px] text-right">
                  {morphPercent}%
                </span>
              </div>
              <div className="flex items-center justify-between text-[12px] text-content-secondary">
                <button
                  type="button"
                  onClick={() => setMorphPercent(0)}
                  className="hover:text-content-primary underline decoration-dotted"
                >
                  0% (Оригинал)
                </button>
                <button
                  type="button"
                  onClick={() => setMorphPercent(50)}
                  className="hover:text-content-primary underline decoration-dotted"
                >
                  50% (В движении)
                </button>
                <button
                  type="button"
                  onClick={() => setMorphPercent(100)}
                  className="hover:text-content-primary underline decoration-dotted"
                >
                  100% (Глаза + рот вместе)
                </button>
              </div>
            </div>
          ) : (
            <p className="font-hauora font-light text-[13px] text-content-secondary">
              Включен циклический авто-луп: лицо держит форму, затем плавно перетекает в смешную позу, фиксируется и возвращается обратно. Переключите на «Ручной скраб», чтобы двигать ползунок вручную.
            </p>
          )}
        </Section>

        {/* SECTION 3: HARDWARE PLAYBACK CONTROLS */}
        <Section
          label="CTRL"
          direction="column"
          className="w-full gap-[12px] p-[16px] sm:p-[20px]"
        >
          <div className="flex w-full flex-wrap items-center justify-between gap-[12px]">
            {/* Play/Pause */}
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex h-[38px] px-[16px] items-center justify-center rounded-[8px] font-hauora text-[14px] font-medium transition-colors ${
                isPlaying
                  ? "bg-surface-pill text-content-primary hover:bg-[#3a3a3a]"
                  : "bg-signal-amber text-[#1a1a1a]"
              }`}
            >
              {isPlaying ? "⏸ Пауза" : "▶ Воспроизвести"}
            </button>

            {/* Spark Ignition */}
            <button
              type="button"
              onClick={handleTriggerIgnite}
              className="flex h-[38px] px-[16px] items-center justify-center rounded-[8px] bg-surface-pill text-content-primary hover:text-signal-amber hover:bg-[#3a3a3a] transition-colors font-hauora text-[14px] font-medium"
            >
              ⚡ Вспышка / Ignition
            </button>

            {/* Theme Toggle */}
            <div className="flex items-center gap-[6px] bg-[#1a1a1a] p-[3px] rounded-[8px]">
              <button
                type="button"
                onClick={() => setTheme("amber")}
                className={`h-[32px] px-[12px] rounded-[6px] font-hauora text-[12px] font-medium transition-colors ${
                  theme === "amber"
                    ? "bg-signal-amber text-[#1a1a1a]"
                    : "text-content-secondary hover:text-content-primary"
                }`}
              >
                Amber
              </button>
              <button
                type="button"
                onClick={() => setTheme("monochrome")}
                className={`h-[32px] px-[12px] rounded-[6px] font-hauora text-[12px] font-medium transition-colors ${
                  theme === "monochrome"
                    ? "bg-white text-[#1a1a1a]"
                    : "text-content-secondary hover:text-content-primary"
                }`}
              >
                Studio Mono
              </button>
            </div>
          </div>

          {/* Speed & Intensity Sliders */}
          <div className="flex w-full flex-col gap-[12px] pt-[8px] border-t border-border-hardware">
            <div className="flex items-center justify-between gap-[12px]">
              <span className="font-hauora text-[14px] font-light text-content-secondary">
                Скорость анимации ({speed}x)
              </span>
              <div className="flex items-center gap-[6px]">
                {[0.5, 1.0, 1.5, 2.0].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSpeed(s)}
                    className={`h-[28px] w-[44px] rounded-[6px] font-hauora text-[12px] font-medium transition-colors ${
                      speed === s
                        ? "bg-signal-amber text-[#1a1a1a]"
                        : "bg-surface-pill text-content-secondary hover:text-content-primary"
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-[12px]">
              <span className="font-hauora text-[14px] font-light text-content-secondary">
                Амплитуда смещения ({Math.round(intensity * 100)}%)
              </span>
              <div className="flex items-center gap-[6px]">
                {[0.5, 0.75, 1.0, 1.3].map((intVal) => (
                  <button
                    key={intVal}
                    type="button"
                    onClick={() => setIntensity(intVal)}
                    className={`h-[28px] w-[44px] rounded-[6px] font-hauora text-[12px] font-medium transition-colors ${
                      intensity === intVal
                        ? "bg-signal-amber text-[#1a1a1a]"
                        : "bg-surface-pill text-content-secondary hover:text-content-primary"
                    }`}
                  >
                    {Math.round(intVal * 100)}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* SECTION 4: HARDWARE SPECIFICATIONS */}
        <div className="flex w-full flex-col gap-[8px] pb-[40px] text-content-secondary text-[12px] font-hauora font-light">
          <div className="flex justify-between border-b border-border-hardware py-[6px]">
            <span>Модульная сетка:</span>
            <span className="text-content-primary">28 колонок × 13 строк (364 модуля 18×18px)</span>
          </div>
          <div className="flex justify-between border-b border-border-hardware py-[6px]">
            <span>Микро-светодиоды:</span>
            <span className="text-content-primary">9×9 в модуле = 29,484 светодиода 2×2px</span>
          </div>
          <div className="flex justify-between border-b border-border-hardware py-[6px]">
            <span>Исходный ассет:</span>
            <span className="text-content-primary">/portrait-2.png (313×260px contain)</span>
          </div>
          <div className="flex justify-between py-[6px]">
            <span>Анатомический сдвиг:</span>
            <span className="text-content-primary">Глаза (+13 строк), Рот (-5 строк), Нос (-24 строки на лоб)</span>
          </div>
        </div>
      </div>
    </main>
  );
}
