import { afterEach, describe, expect, it } from "vitest";
import {
  appThemeStorageKey,
  applyAppTheme,
  buildAppThemeTokens,
  clearAppTheme,
  isReservedThemeColor,
  isValidHexColor,
  normalizeHexColor,
  safeAppThemePalette,
  validateAppThemeColor,
} from "./themeColor";

describe("themeColor", () => {
  afterEach(() => {
    clearAppTheme();
    document.documentElement.style.removeProperty("--income");
    document.documentElement.style.removeProperty("--expense");
  });

  it("normaliza colores HEX cortos y largos", () => {
    expect(normalizeHexColor("2563eb")).toBe("#2563EB");
    expect(normalizeHexColor("#abc")).toBe("#AABBCC");
  });

  it("valida solo colores HEX", () => {
    expect(isValidHexColor("#2563EB")).toBe(true);
    expect(isValidHexColor("2563EB")).toBe(true);
    expect(isValidHexColor("#zzzzzz")).toBe(false);
  });

  it("bloquea colores reservados para movimientos", () => {
    expect(isReservedThemeColor("#22A66F")).toBe(true);
    expect(validateAppThemeColor("#22A66F")).toBe("Ese color ya se usa para identificar movimientos. Elige otro.");
  });

  it("la paleta segura no incluye colores reservados", () => {
    expect(safeAppThemePalette.every((color) => !isReservedThemeColor(color.value))).toBe(true);
  });

  it("genera tokens visuales sin sobrescribir tokens financieros", () => {
    const tokens = buildAppThemeTokens("#2563EB");

    expect(tokens["--app-accent"]).toBe("#2563EB");
    expect(tokens).not.toHaveProperty("--income");
    expect(tokens).not.toHaveProperty("--expense");
    expect(tokens).not.toHaveProperty("--salary");
    expect(tokens).not.toHaveProperty("--vales");
  });

  it("aplica y limpia el tema visual sin tocar variables financieras", () => {
    document.documentElement.style.setProperty("--income", "green");
    document.documentElement.style.setProperty("--expense", "red");

    applyAppTheme("#4F46E5");

    expect(document.documentElement.style.getPropertyValue("--app-accent")).toBe("#4F46E5");
    expect(document.documentElement.style.getPropertyValue("--business")).toBe("var(--app-accent)");
    expect(document.documentElement.style.getPropertyValue("--income")).toBe("green");
    expect(document.documentElement.style.getPropertyValue("--expense")).toBe("red");
    expect(window.localStorage.getItem(appThemeStorageKey)).toBe("#4F46E5");

    clearAppTheme();

    expect(document.documentElement.style.getPropertyValue("--app-accent")).toBe("");
    expect(document.documentElement.style.getPropertyValue("--income")).toBe("green");
    expect(document.documentElement.style.getPropertyValue("--expense")).toBe("red");
  });
});
