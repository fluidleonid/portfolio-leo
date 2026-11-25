export type CassetteStyle = "tdk" | "vintage";

export interface CassetteDesignConfig {
  style: CassetteStyle;

  // Colors
  shellColor: string;
  shellBorderColor: string;
  labelBgColor: string;
  accentColor: string;
  labelTextColor: string;
  bottomPrintColor: string;
  reelColor: string;
  tapeColor: string;
  windowBgColor: string;

  // Element visibility
  showScrews: boolean;
  showTexture: boolean;
  showWindowScale: boolean;
  showBadge: boolean;
  showBottomInfo: boolean;
  showRedClips: boolean;

  // Shadows, glass & geometry
  cornerRadius: number;
  shadowBlur: number;
  shadowOffsetY: number;
  shadowOpacity: number;
  shadowColor: string;
  glassOpacity: number;
  grainOpacity: number;
  scale: number;
}

export const TDK_DEFAULT_CONFIG: CassetteDesignConfig = {
  style: "tdk",

  shellColor: "#121112",
  shellBorderColor: "#2b2a2b",
  labelBgColor: "#ffffff",
  accentColor: "#dd2828",
  labelTextColor: "#100f0f",
  bottomPrintColor: "#fafafa",
  reelColor: "#ffffff",
  tapeColor: "#14110d",
  windowBgColor: "#1b1a1c",

  showScrews: true,
  showTexture: true,
  showWindowScale: true,
  showBadge: true,
  showBottomInfo: true,
  showRedClips: true,

  cornerRadius: 20,
  shadowBlur: 36,
  shadowOffsetY: 18,
  shadowOpacity: 0.6,
  shadowColor: "#000000",
  glassOpacity: 0.16,
  grainOpacity: 0.06,
  scale: 1,
};

export const VINTAGE_DEFAULT_CONFIG: CassetteDesignConfig = {
  style: "vintage",

  shellColor: "#2c292c",
  shellBorderColor: "#3e3b3e",
  labelBgColor: "#e5e1d9",
  accentColor: "#978a79",
  labelTextColor: "#292729",
  bottomPrintColor: "#69676a",
  reelColor: "#ffffff",
  tapeColor: "#29272a",
  windowBgColor: "#484649",

  showScrews: true,
  showTexture: true,
  showWindowScale: true,
  showBadge: true,
  showBottomInfo: true,
  showRedClips: false,

  cornerRadius: 16,
  shadowBlur: 36,
  shadowOffsetY: 18,
  shadowOpacity: 0.55,
  shadowColor: "#000000",
  glassOpacity: 0.5,
  grainOpacity: 0.06,
  scale: 1,
};

export const CASSETTE_CONFIG_STORAGE_KEY = "leo_cassette_design_config_v1";

export function getPresetConfig(style: CassetteStyle): CassetteDesignConfig {
  return style === "tdk"
    ? { ...TDK_DEFAULT_CONFIG }
    : { ...VINTAGE_DEFAULT_CONFIG };
}

export function loadSavedCassetteConfig(): CassetteDesignConfig {
  if (typeof window === "undefined") return { ...TDK_DEFAULT_CONFIG };
  try {
    const raw = window.localStorage.getItem(CASSETTE_CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CassetteDesignConfig>;
      const base = getPresetConfig(parsed.style === "vintage" ? "vintage" : "tdk");
      return { ...base, ...parsed };
    }
  } catch {
    // ignore storage errors
  }
  return { ...TDK_DEFAULT_CONFIG };
}

export function saveCassetteConfig(config: CassetteDesignConfig): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CASSETTE_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore storage errors
  }
}
