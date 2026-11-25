"use client";

import React, { useEffect, useState } from "react";
import {
  DEFAULT_TACTILE_AUDIO_PARAMS,
  type TactileAudioParams,
  tactileAudio,
} from "./tactileAudio";

type TunerTab = "matte" | "lamp" | "knob";

interface SliderDef {
  key: keyof TactileAudioParams;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  decimals?: number;
}

const MATTE_SLIDERS: SliderDef[] = [
  { key: "matteClickGain", label: "Громкость клика", min: 0, max: 0.16, step: 0.002, decimals: 3 },
  { key: "matteClickFreq", label: "Тон щелчка", min: 300, max: 3200, step: 20, unit: "Hz", decimals: 0 },
  { key: "matteClickDecayMs", label: "Длина щелчка", min: 3, max: 35, step: 1, unit: "ms", decimals: 0 },
  { key: "matteBodyGain", label: "Корпус (плотность)", min: 0, max: 0.06, step: 0.001, decimals: 3 },
  { key: "matteBodyFreq", label: "Тон корпуса", min: 70, max: 450, step: 5, unit: "Hz", decimals: 0 },
  { key: "matteHoverGain", label: "Громкость ховера", min: 0, max: 0.08, step: 0.001, decimals: 3 },
  { key: "matteHoverFreq", label: "Тон ховера", min: 300, max: 2400, step: 20, unit: "Hz", decimals: 0 },
];

const LAMP_SLIDERS: SliderDef[] = [
  { key: "lampHumGain", label: "Громкость нажатия", min: 0, max: 0.08, step: 0.001, decimals: 3 },
  { key: "lampHoverGain", label: "Громкость ховера", min: 0, max: 0.06, step: 0.001, decimals: 3 },
  { key: "lampBaseFreq", label: "Высота тона лампы", min: 38, max: 200, step: 1, unit: "Hz", decimals: 0 },
  { key: "lampDetuneHz", label: "Расстройка (биения)", min: 0, max: 16, step: 0.5, unit: "Hz", decimals: 1 },
  { key: "lampLowpassHz", label: "Мягкость (срез ВЧ)", min: 110, max: 750, step: 5, unit: "Hz", decimals: 0 },
  { key: "lampWaveRateHz", label: "Скорость волн", min: 2, max: 32, step: 0.5, unit: "Hz", decimals: 1 },
  { key: "lampWaveDepth", label: "Глубина волн", min: 0, max: 0.85, step: 0.02, decimals: 2 },
  { key: "lampDurationMs", label: "Длительность гула", min: 60, max: 500, step: 10, unit: "ms", decimals: 0 },
  { key: "lampTouchGain", label: "Клик софт-пластика", min: 0, max: 0.06, step: 0.001, decimals: 3 },
];

const KNOB_SLIDERS: SliderDef[] = [
  { key: "knobDragGain", label: "Громкость вращения", min: 0, max: 0.08, step: 0.001, decimals: 3 },
  { key: "knobLowpassHz", label: "Вязкость (срез ВЧ)", min: 100, max: 1100, step: 10, unit: "Hz", decimals: 0 },
  { key: "knobHighpassHz", label: "Срез низа (НЧ)", min: 30, max: 350, step: 5, unit: "Hz", decimals: 0 },
  { key: "knobGlideGain", label: "Громкость доворота", min: 0, max: 0.08, step: 0.001, decimals: 3 },
  { key: "knobGlideDurationMs", label: "Длина доворота", min: 20, max: 200, step: 5, unit: "ms", decimals: 0 },
];

export const TactileAudioTuner: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [tab, setTab] = useState<TunerTab>("matte");
  const [enabled, setEnabled] = useState(true);
  const [params, setParams] = useState<TactileAudioParams>(DEFAULT_TACTILE_AUDIO_PARAMS);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
    setParams({ ...tactileAudio.loadSavedParams() });
    setEnabled(tactileAudio.enabled);
  }, []);

  if (!mounted) return null;

  const handleChange = (key: keyof TactileAudioParams, val: number) => {
    const next = tactileAudio.updateParams({ [key]: val });
    setParams({ ...next });
  };

  const handleToggleEnabled = () => {
    const next = !enabled;
    tactileAudio.enabled = next;
    setEnabled(next);
  };

  const handleReset = () => {
    const reset = tactileAudio.resetParams();
    setParams({ ...reset });
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
        className="fixed right-3 top-1/2 -translate-y-1/2 z-[90] rounded-[10px] border border-[#3a3a3a] bg-[#1e1e1e]/95 px-3 py-2 text-[12px] font-medium text-[#e5e5e5] shadow-2xl backdrop-blur-md hover:border-[#555] cursor-pointer"
      >
        Звук
      </button>
    );
  }

  const activeSliders =
    tab === "matte" ? MATTE_SLIDERS : tab === "lamp" ? LAMP_SLIDERS : KNOB_SLIDERS;

  return (
    <aside
      aria-label="Tactile Sound Tuner"
      className="fixed right-3 top-1/2 -translate-y-1/2 z-[90] flex w-[288px] max-h-[calc(100dvh-24px)] flex-col rounded-[14px] border border-[#383838] bg-[#1c1c1c]/95 text-[#e5e5e5] shadow-[0_20px_50px_rgba(0,0,0,0.65)] backdrop-blur-md select-none font-hauora"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2e2e2e] px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold tracking-wide text-[#f0f0f0]">
            SOUND LAB
          </span>
          <button
            type="button"
            onClick={handleToggleEnabled}
            className={`rounded-[6px] px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
              enabled
                ? "bg-[#2f2f2f] text-[#ffb84d] border border-[#4a4a4a]"
                : "bg-[#242424] text-[#777] border border-[#333]"
            }`}
          >
            {enabled ? "ON" : "MUTE"}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setCollapsed(true)}
          title="Свернуть панель"
          className="rounded-[6px] px-2 py-0.5 text-[12px] text-[#999] hover:bg-[#2a2a2a] hover:text-white cursor-pointer"
        >
          Свернуть
        </button>
      </div>

      {/* Master Volume */}
      <div className="border-b border-[#2a2a2a] px-3.5 py-2.5">
        <div className="mb-1 flex items-center justify-between text-[11px]">
          <span className="text-[#b5b5b5]">Общая громкость</span>
          <span className="tabular-nums text-[#f0f0f0]">
            {Math.round(params.masterGain * 100)}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={3}
          step={0.05}
          value={params.masterGain}
          onChange={(e) => handleChange("masterGain", parseFloat(e.target.value))}
          className="h-1.5 w-full cursor-pointer accent-[#ffb84d]"
        />
      </div>

      {/* Category Tabs */}
      <div className="grid grid-cols-3 gap-1 border-b border-[#2a2a2a] p-1.5 bg-[#161616]">
        {(
          [
            { id: "matte", label: "Кнопки" },
            { id: "lamp", label: "Лампы" },
            { id: "knob", label: "Ручка" },
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

      {/* Quick Preview Triggers */}
      <div className="flex items-center gap-1.5 border-b border-[#2a2a2a] px-3.5 py-2 bg-[#191919]">
        <span className="text-[11px] text-[#888] mr-auto">Тест звука:</span>
        {tab === "matte" && (
          <>
            <button
              type="button"
              onClick={() => tactileAudio.playKeyClick("matte")}
              className="rounded-[6px] border border-[#3a3a3a] bg-[#262626] px-2.5 py-1 text-[11px] text-[#eee] hover:bg-[#303030] active:translate-y-[0.5px] cursor-pointer"
            >
              Нажатие
            </button>
            <button
              type="button"
              onClick={() => tactileAudio.playHover("matte", true)}
              className="rounded-[6px] border border-[#3a3a3a] bg-[#262626] px-2.5 py-1 text-[11px] text-[#eee] hover:bg-[#303030] active:translate-y-[0.5px] cursor-pointer"
            >
              Ховер
            </button>
          </>
        )}
        {tab === "lamp" && (
          <>
            <button
              type="button"
              onClick={() => tactileAudio.playKeyClick("lamp")}
              className="rounded-[6px] border border-[#3a3a3a] bg-[#262626] px-2.5 py-1 text-[11px] text-[#ffb84d] hover:bg-[#303030] active:translate-y-[0.5px] cursor-pointer"
            >
              Нажатие
            </button>
            <button
              type="button"
              onClick={() => tactileAudio.playHover("lamp", true)}
              className="rounded-[6px] border border-[#3a3a3a] bg-[#262626] px-2.5 py-1 text-[11px] text-[#ffb84d] hover:bg-[#303030] active:translate-y-[0.5px] cursor-pointer"
            >
              Ховер
            </button>
          </>
        )}
        {tab === "knob" && (
          <>
            <button
              type="button"
              onClick={() => tactileAudio.previewKnobDrag()}
              className="rounded-[6px] border border-[#3a3a3a] bg-[#262626] px-2.5 py-1 text-[11px] text-[#eee] hover:bg-[#303030] active:translate-y-[0.5px] cursor-pointer"
            >
              Вращение
            </button>
            <button
              type="button"
              onClick={() => tactileAudio.playKnobRustle("glide", false)}
              className="rounded-[6px] border border-[#3a3a3a] bg-[#262626] px-2.5 py-1 text-[11px] text-[#eee] hover:bg-[#303030] active:translate-y-[0.5px] cursor-pointer"
            >
              Доворот
            </button>
          </>
        )}
      </div>

      {/* Sliders List */}
      <div className="flex-1 overflow-y-auto px-3.5 py-2.5 space-y-2.5">
        {activeSliders.map((s) => {
          const val = params[s.key];
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
                onChange={(e) => handleChange(s.key, parseFloat(e.target.value))}
                className="h-1.5 w-full cursor-pointer accent-[#cccccc]"
              />
            </div>
          );
        })}
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
          {copied ? "Скопировано!" : "Скопировать значения"}
        </button>
      </div>
    </aside>
  );
};
