"use client";

import React, { useState } from "react";
import {
  type CassetteDesignConfig,
  type CassetteStyle,
  getPresetConfig,
} from "../model/cassetteConfig";

interface CassetteCustomizerPanelProps {
  config: CassetteDesignConfig;
  onChange: (next: CassetteDesignConfig) => void;
}

type PanelTab = "colors" | "elements" | "shadows";

interface ColorField {
  key: keyof CassetteDesignConfig;
  label: string;
}

const COLOR_FIELDS: ColorField[] = [
  { key: "shellColor", label: "Корпус кассеты" },
  { key: "shellBorderColor", label: "Грань / обводка" },
  { key: "labelBgColor", label: "Фон наклейки" },
  { key: "accentColor", label: "Акцент (полосы / клипсы)" },
  { key: "labelTextColor", label: "Текст наклейки" },
  { key: "bottomPrintColor", label: "Нижняя печать / детали" },
  { key: "reelColor", label: "Бобины (зубцы)" },
  { key: "tapeColor", label: "Магнитная лента" },
  { key: "windowBgColor", label: "Фон окна ленты" },
];

interface ToggleField {
  key: keyof CassetteDesignConfig;
  label: string;
}

const TOGGLE_FIELDS: ToggleField[] = [
  { key: "showTexture", label: "Текстура / рёбра корпуса" },
  { key: "showScrews", label: "Винты" },
  { key: "showWindowScale", label: "Шкала в окне ленты" },
  { key: "showBadge", label: "Бейдж слева (A / квадрат)" },
  { key: "showBottomInfo", label: "Нижняя печать / полосы" },
  { key: "showRedClips", label: "Цветные клипсы бобин (TDK)" },
];

interface SliderField {
  key: keyof CassetteDesignConfig;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  decimals?: number;
}

const SHADOW_SLIDERS: SliderField[] = [
  { key: "scale", label: "Масштаб кассеты", min: 0.75, max: 1.15, step: 0.01, decimals: 2 },
  { key: "cornerRadius", label: "Скругление углов", min: 4, max: 28, step: 1, unit: "px", decimals: 0 },
  { key: "shadowBlur", label: "Размытие тени", min: 0, max: 80, step: 2, unit: "px", decimals: 0 },
  { key: "shadowOffsetY", label: "Смещение тени Y", min: 0, max: 44, step: 1, unit: "px", decimals: 0 },
  { key: "shadowOpacity", label: "Прозрачность тени", min: 0, max: 0.95, step: 0.05, decimals: 2 },
  { key: "glassOpacity", label: "Блик стекла окна", min: 0, max: 0.75, step: 0.02, decimals: 2 },
  { key: "grainOpacity", label: "Зерно пластика", min: 0, max: 0.25, step: 0.01, decimals: 2 },
];

export const CassetteCustomizerPanel: React.FC<CassetteCustomizerPanelProps> = ({
  config,
  onChange,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [tab, setTab] = useState<PanelTab>("colors");
  const [copied, setCopied] = useState(false);

  const patch = (updates: Partial<CassetteDesignConfig>) => {
    onChange({ ...config, ...updates });
  };

  const handleStyleSwitch = (style: CassetteStyle) => {
    onChange(getPresetConfig(style));
  };

  const handleReset = () => {
    onChange(getPresetConfig(config.style));
  };

  const handleCopy = async () => {
    const payload = JSON.stringify(config, null, 2);
    try {
      await navigator.clipboard.writeText(payload);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = payload;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="fixed right-3 top-1/2 -translate-y-1/2 z-[90] rounded-[10px] border border-[#3a3a3a] bg-[#1e1e1e]/95 px-3 py-2 text-[12px] font-medium text-[#e5e5e5] shadow-2xl backdrop-blur-md hover:border-[#555] cursor-pointer font-hauora"
      >
        Кассета
      </button>
    );
  }

  return (
    <aside
      aria-label="Cassette Design Lab"
      className="fixed right-3 top-1/2 -translate-y-1/2 z-[90] flex w-[304px] max-h-[calc(100dvh-24px)] flex-col rounded-[14px] border border-[#383838] bg-[#1c1c1c]/95 text-[#e5e5e5] shadow-[0_20px_50px_rgba(0,0,0,0.65)] backdrop-blur-md select-none font-hauora"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2e2e2e] px-3.5 py-2.5">
        <span className="text-[12px] font-semibold tracking-wide text-[#f0f0f0]">
          CASSETTE LAB
        </span>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="rounded-[6px] px-2 py-0.5 text-[11px] text-[#999] hover:bg-[#2a2a2a] hover:text-white cursor-pointer"
        >
          Свернуть
        </button>
      </div>

      {/* Cassette Model Switcher */}
      <div className="border-b border-[#2a2a2a] px-3.5 py-2.5 bg-[#171717]">
        <div className="mb-1.5 text-[10px] uppercase tracking-wider text-[#888]">
          Модель кассеты
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {(
            [
              { id: "tdk", label: "TDK D90 Black" },
              { id: "vintage", label: "Retro Cream" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleStyleSwitch(item.id)}
              className={`rounded-[8px] py-1.5 px-2 text-[11px] font-medium transition-colors cursor-pointer border ${
                config.style === item.id
                  ? "bg-[#2c2c2c] text-[#ffb84d] border-[#4a4a4a]"
                  : "bg-[#202020] text-[#999] border-[#2c2c2c] hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="grid grid-cols-3 gap-1 border-b border-[#2a2a2a] p-1.5 bg-[#151515]">
        {(
          [
            { id: "colors", label: "Цвета" },
            { id: "elements", label: "Элементы" },
            { id: "shadows", label: "Тени" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-[8px] py-1.5 text-[11px] font-medium transition-colors cursor-pointer ${
              tab === item.id
                ? "bg-[#2c2c2c] text-white shadow-sm"
                : "text-[#8c8c8c] hover:text-[#ccc]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto px-3.5 py-2.5 space-y-2.5">
        {tab === "colors" &&
          COLOR_FIELDS.map((field) => {
            const val = String(config[field.key]);
            return (
              <label
                key={field.key}
                className="flex items-center justify-between gap-2 text-[11px] cursor-pointer"
              >
                <span className="text-[#bdbdbd]">{field.label}</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] uppercase text-[#888]">
                    {val}
                  </span>
                  <input
                    type="color"
                    value={val}
                    onChange={(e) => patch({ [field.key]: e.target.value })}
                    className="h-5 w-7 cursor-pointer rounded border border-[#444] bg-transparent p-0"
                  />
                </div>
              </label>
            );
          })}

        {tab === "elements" &&
          TOGGLE_FIELDS.map((field) => {
            const checked = Boolean(config[field.key]);
            return (
              <button
                key={field.key}
                type="button"
                onClick={() => patch({ [field.key]: !checked })}
                className="flex w-full items-center justify-between rounded-[8px] border border-[#2b2b2b] bg-[#212121] px-2.5 py-2 text-[11px] hover:border-[#3d3d3d] cursor-pointer"
              >
                <span className="text-[#ccc]">{field.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    checked
                      ? "bg-[#ffb84d]/20 text-[#ffb84d]"
                      : "bg-[#2d2d2d] text-[#777]"
                  }`}
                >
                  {checked ? "ON" : "OFF"}
                </span>
              </button>
            );
          })}

        {tab === "shadows" && (
          <>
            <label className="flex items-center justify-between gap-2 text-[11px] cursor-pointer pb-1 border-b border-[#292929]">
              <span className="text-[#bdbdbd]">Цвет тени</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] uppercase text-[#888]">
                  {config.shadowColor}
                </span>
                <input
                  type="color"
                  value={config.shadowColor}
                  onChange={(e) => patch({ shadowColor: e.target.value })}
                  className="h-5 w-7 cursor-pointer rounded border border-[#444] bg-transparent p-0"
                />
              </div>
            </label>

            {SHADOW_SLIDERS.map((s) => {
              const val = Number(config[s.key]);
              const formatted =
                s.decimals !== undefined ? val.toFixed(s.decimals) : String(val);
              return (
                <div key={s.key} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#bdbdbd]">{s.label}</span>
                    <span className="tabular-nums text-[#efefef]">
                      {formatted}
                      {s.unit ? ` ${s.unit}` : ""}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={s.min}
                    max={s.max}
                    step={s.step}
                    value={val}
                    onChange={(e) =>
                      patch({ [s.key]: parseFloat(e.target.value) })
                    }
                    className="h-1.5 w-full cursor-pointer accent-[#ffb84d]"
                  />
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center gap-2 border-t border-[#2e2e2e] p-3">
        <button
          type="button"
          onClick={handleReset}
          className="rounded-[8px] border border-[#383838] bg-[#242424] px-2.5 py-1.5 text-[11px] text-[#aaa] hover:bg-[#2d2d2d] hover:text-white cursor-pointer"
        >
          Сброс
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="flex-1 rounded-[8px] bg-[#efefef] px-3 py-1.5 text-[11px] font-semibold text-[#181818] hover:bg-white active:scale-[0.99] transition cursor-pointer"
        >
          {copied ? "Скопировано!" : "Скопировать настройки"}
        </button>
      </div>
    </aside>
  );
};
