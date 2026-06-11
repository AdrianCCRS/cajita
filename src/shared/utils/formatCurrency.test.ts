import { describe, expect, it } from "vitest";
import { formatCurrency } from "./formatCurrency";

describe("formatCurrency", () => {
  const expectedFormatter = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

  it("formatea pesos colombianos sin decimales", () => {
    expect(formatCurrency(35000)).toBe(expectedFormatter.format(35000));
    expect(formatCurrency(35000)).toMatch(/^\$\s?35\.000$/u);
  });

  it("formatea cero y valores negativos", () => {
    expect(formatCurrency(0)).toBe(expectedFormatter.format(0));
    expect(formatCurrency(-1500)).toBe(expectedFormatter.format(-1500));
  });

  it("redondea valores con decimales al peso mas cercano", () => {
    expect(formatCurrency(1999.6)).toBe(expectedFormatter.format(1999.6));
  });
});
