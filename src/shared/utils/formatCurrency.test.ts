import { describe, expect, it } from "vitest";
import { formatCurrency } from "./formatCurrency";

describe("formatCurrency", () => {
  it("formats COP without decimals", () => {
    expect(formatCurrency(35000)).toContain("35.000");
  });
});
