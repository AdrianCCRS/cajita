import { afterEach, describe, expect, it } from "vitest";
import {
  applyThemeMode,
  defaultThemeMode,
  getStoredThemeMode,
  isThemeMode,
  themeModeStorageKey,
} from "./themeMode";

describe("themeMode", () => {
  afterEach(() => {
    window.localStorage.removeItem(themeModeStorageKey);
    delete document.documentElement.dataset.theme;
  });

  it("valida modos soportados", () => {
    expect(isThemeMode("light")).toBe(true);
    expect(isThemeMode("dark")).toBe(true);
    expect(isThemeMode("system")).toBe(false);
  });

  it("usa light por defecto si no hay preferencia guardada", () => {
    expect(getStoredThemeMode()).toBe(defaultThemeMode);
  });

  it("aplica data-theme y persiste en localStorage", () => {
    applyThemeMode("dark");

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem(themeModeStorageKey)).toBe("dark");

    applyThemeMode("light");

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(window.localStorage.getItem(themeModeStorageKey)).toBe("light");
  });
});
