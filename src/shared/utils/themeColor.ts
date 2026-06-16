export type AppThemeTokens = Record<
  "--app-accent" | "--app-accent-soft" | "--app-accent-foreground" | "--app-accent-ring" | "--app-gradient-from" | "--app-gradient-to" | "--accent" | "--accent-foreground" | "--business",
  string
>;

export const appThemeStorageKey = "cajita-app-accent-color";
export const defaultAppAccentColor = "#0E7490";

export const safeAppThemePalette = [
  { name: "Azul", value: "#2563EB" },
  { name: "Indigo", value: "#4F46E5" },
  { name: "Violeta", value: "#7C3AED" },
  { name: "Cyan", value: "#0891B2" },
  { name: "Slate", value: "#64748B" },
  { name: "Magenta", value: "#BE185D" },
];

export const reservedThemeColors = [
  { name: "Ventas", value: "#22A66F" },
  { name: "Gastos", value: "#B84A2F" },
  { name: "Pagos", value: "#D7A51C" },
  { name: "Vales", value: "#B23C87" },
  { name: "Danger", value: "#C2412D" },
  { name: "Warning", value: "#D7A51C" },
];

const themeTokenNames = [
  "--app-accent",
  "--app-accent-soft",
  "--app-accent-foreground",
  "--app-accent-ring",
  "--app-gradient-from",
  "--app-gradient-to",
  "--accent",
  "--accent-foreground",
  "--business",
] as const;

export function normalizeHexColor(color: string) {
  const trimmed = color.trim();
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;

  if (/^#[0-9a-fA-F]{3}$/.test(withHash)) {
    return `#${withHash
      .slice(1)
      .split("")
      .map((part) => `${part}${part}`)
      .join("")}`.toUpperCase();
  }

  return withHash.toUpperCase();
}

export function isValidHexColor(color: string) {
  return /^#[0-9A-F]{6}$/.test(normalizeHexColor(color));
}

export function isReservedThemeColor(color: string) {
  if (!isValidHexColor(color)) {
    return false;
  }

  const normalized = normalizeHexColor(color);
  return reservedThemeColors.some((reserved) => colorDistance(normalized, reserved.value) < 42);
}

export function validateAppThemeColor(color: string) {
  if (!isValidHexColor(color)) {
    return "Escribe un color válido, por ejemplo #2563EB.";
  }

  if (isReservedThemeColor(color)) {
    return "Ese color ya se usa para identificar movimientos. Elige otro.";
  }

  return null;
}

export function buildAppThemeTokens(color: string): AppThemeTokens {
  const accent = normalizeHexColor(color);
  const rgb = hexToRgb(accent);
  const foreground = relativeLuminance(rgb) > 0.48 ? "#172033" : "#FFFFFF";

  return {
    "--app-accent": accent,
    "--app-accent-soft": `color-mix(in srgb, ${accent} 16%, var(--surface))`,
    "--app-accent-foreground": foreground,
    "--app-accent-ring": `rgb(${rgb.r} ${rgb.g} ${rgb.b} / 0.36)`,
    "--app-gradient-from": `color-mix(in srgb, ${accent} 14%, var(--background))`,
    "--app-gradient-to": `color-mix(in srgb, ${accent} 4%, var(--background))`,
    "--accent": "var(--app-accent)",
    "--accent-foreground": "var(--app-accent-foreground)",
    "--business": "var(--app-accent)",
  };
}

export function applyAppTheme(color: string) {
  const error = validateAppThemeColor(color);
  if (error) {
    throw new Error(error);
  }

  const tokens = buildAppThemeTokens(color);
  const root = document.documentElement;

  Object.entries(tokens).forEach(([name, value]) => {
    root.style.setProperty(name, value);
  });

  window.localStorage.setItem(appThemeStorageKey, normalizeHexColor(color));
}

export function clearAppTheme() {
  const root = document.documentElement;
  themeTokenNames.forEach((name) => root.style.removeProperty(name));
  window.localStorage.removeItem(appThemeStorageKey);
}

export function applyThemeFromSettings(color?: string | null) {
  if (color) {
    applyAppTheme(color);
    return;
  }

  clearAppTheme();
}

export function applyCachedAppTheme() {
  if (typeof window === "undefined") {
    return;
  }

  const cachedColor = window.localStorage.getItem(appThemeStorageKey);
  if (cachedColor && !validateAppThemeColor(cachedColor)) {
    applyAppTheme(cachedColor);
  }
}

function hexToRgb(color: string) {
  const normalized = normalizeHexColor(color).slice(1);
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function colorDistance(first: string, second: string) {
  const firstRgb = hexToRgb(first);
  const secondRgb = hexToRgb(second);

  return Math.sqrt(
    (firstRgb.r - secondRgb.r) ** 2 +
      (firstRgb.g - secondRgb.g) ** 2 +
      (firstRgb.b - secondRgb.b) ** 2,
  );
}

function relativeLuminance(rgb: { r: number; g: number; b: number }) {
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
