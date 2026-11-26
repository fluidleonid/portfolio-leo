"use client";

import React, { useState } from "react";
import {
  DEFAULT_TAPE_DSP_PARAMS,
  type TapeDspParams,
} from "../model/vintageTapeEngine";

interface TapeDspTunerPanelProps {
  params: TapeDspParams;
  onChange: (next: TapeDspParams) => void;
}

interface SliderDef {
  key: keyof Omit<TapeDspParams, "enabled">;
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  decimals?: number;
}

const SLIDERS: SliderDef[] = [
  {
    key: "tapeQuality",
    label: "Качество плёнки",
    hint: "Частоты и сатурация",
    min: 0,
    max: 100,
    step: 1,
    unit: "%",
    decimals: 0,
  },
  {
    key: "noiseLevel",
    label: "Уровень шума",
    hint: "Аналоговое шипение (hiss)",
    min: 0,
    max: 100,
    step: 1,
    unit: "%",
    decimals: 0,
  },
  {
    key: "headQuality",
    label: "Качество головки",
    hint: "Азимут, теплота, глухость",
    min: 0,
    max: 100,
    step: 1,
    unit: "%",
    decimals: 0,
  },
  {
    key: "motorQuality",
    label: "Качество мотора",
    hint: "Wow & flutter, разгон",
    min: 0,
    max: 100,
    step: 1,
    unit: "%",
    decimals: 0,
  },
  {
    key: "cueSpeed",
    label: "Тон перемотки (Cue)",
    hint: "Ускорение прижатой головки",
    min: 2.0,
    max: 5.0,
    step: 0.1,
    unit: "x",
    decimals: 1,
  },
  {
    key: "scrubMotorGain",
    label: "Мотор при перемотке",
    hint: "Шум механики катушек",
    min: 0,
    max: 100,
    step: 1,
    unit: "%",
    decimals: 0,
  },
];

export const TapeDspTunerPanel: React.FC<TapeDspTunerPanelProps> = ({
  params,
  onChange,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  const patch = (updates: Partial<TapeDspParams>) => {
    onChange({ ...params, ...updates });
  };

  const handleReset = () => {
    onChange({ ...DEFAULT_TAPE_DSP_PARAMS });
  };

  const handleCopy = async () => {
    const payload = JSON.stringify(params, null, 2);
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
        Плёнка
      </button>
    );
  }

  return (
    <aside
      aria-label="Tape DSP Lab"
      className="fixed right-3 top-1/2 -translate-y-1/2 z-[90] flex w-[296px] max-h-[calc(100dvh-24px)] flex-col rounded-[14px] border border-[#383838] bg-[#1c1c1c]/95 text-[#e5e5e5] shadow-[0_20px_50px_rgba(0,0,0,0.65)] backdrop-blur-md select-none font-hauora"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2e2e2e] px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold tracking-wide text-[#f0f0f0]">
            TAPE DSP
          </span>
          <button
            type="button"
            onClick={() => patch({ enabled: !params.enabled })}
            className={`rounded-[6px] px-2 py-0.5 text-[10px] font-semibold transition-colors cursor-pointer border ${
              params.enabled
                ? "bg-[#2f2f2f] text-[#ffb84d] border-[#4a4a4a]"
                : "bg-[#242424] text-[#777] border-[#333]"
            }`}
          >
            {params.enabled ? "ON" : "BYPASS"}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="rounded-[6px] px-2 py-0.5 text-[11px] text-[#999] hover:bg-[#2a2a2a] hover:text-white cursor-pointer"
        >
          Свернуть
        </button>
      </div>

      {/* Sliders */}
      <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3">
        {SLIDERS.map((s) => {
          const val = params[s.key];
          const formatted =
            s.decimals !== undefined ? val.toFixed(s.decimals) : String(val);
          return (
            <div key={s.key} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] font-medium text-[#d4d4d4]">
                  {s.label}
                </span>
                <span className="tabular-nums text-[11px] text-[#efefef]">
                  {formatted}
                  {s.unit}
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
              <span className="text-[10px] text-[#7c7c7c] leading-tight">
                {s.hint}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
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
