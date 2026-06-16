export type ThemeMode = "light" | "dark";

export const themeModeStorageKey = "cajita-theme-mode";
export const defaultThemeMode: ThemeMode = "light";

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark";
}

export function getStoredThemeMode(): ThemeMode {
  if (typeof window === "undefined") {
    return defaultThemeMode;
  }

  const stored = window.localStorage.getItem(themeModeStorageKey);
  return isThemeMode(stored) ? stored : defaultThemeMode;
}

export function setStoredThemeMode(mode: ThemeMode) {
  window.localStorage.setItem(themeModeStorageKey, mode);
}

export function applyThemeMode(mode: ThemeMode) {
  document.documentElement.dataset.theme = mode;
  setStoredThemeMode(mode);
}

export function applyCachedThemeMode() {
  if (typeof window === "undefined") {
    return;
  }

  applyThemeMode(getStoredThemeMode());
}
