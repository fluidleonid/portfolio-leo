/**
 * Design Tokens Architecture Contract
 * Single Source of Truth for Design System Tokens across Figma & Code
 */
export const tokens = {
  colors: {
    // Surfaces & Grounds
    canvas: "#292929",
    surface: "#242424",
    surfaceDeep: "#1a1a1a",
    surfaceGroove: "#1f1f1f",
    surfacePill: "#303030",

    // Hardware Borders
    borderHardware: "#383838",
    borderSubtle: "#484848",
    borderActive: "#666666",

    // Content & Typography
    contentPrimary: "#CCCCCC",
    contentBadge: "rgba(204, 204, 204, 0.16)",
    contentSecondary: "#8C8C8C",
    contentHover: "#D4D4D4",
    contentContrast: "#FFFFFF",
    contentMuted: "#737373",

    // Signals & Accents
    signalAmber: "#FFAA00",
    signalAmberGlow: "#FFB733",
  },
  fonts: {
    hauora: "'Hauora', -apple-system, sans-serif",
    stetica: "'AA Stetica', sans-serif",
  },
  geometry: {
    containerWidth: 564,
    galleryHeight: 600,
    galleryPadding: 28,
    galleryGap: 20,
    hardwareGap: 32,
    badgeHeight: 24,
    caseBlockWidth: 266,
    caseBlockHeight: 154,
  },
} as const;

export type DesignTokens = typeof tokens;
