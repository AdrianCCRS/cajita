import { describe, expect, it } from "vitest";
import { formatDateShort, formatInputDate, isInMonth, isToday, toDate } from "./dates";

describe("toDate", () => {
  it("convierte string ISO a Date", () => {
    const result = toDate("2026-06-10");
    expect(result).toBeInstanceOf(Date);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(5);
    expect(result.getDate()).toBe(10);
  });

  it("devuelve el mismo objeto si ya es Date", () => {
    const date = new Date(2026, 5, 10);
    expect(toDate(date)).toBe(date);
  });
});

describe("formatDateShort", () => {
  it("formatea string ISO en español", () => {
    const result = formatDateShort("2026-06-10");
    expect(result).toBe("10 jun 2026");
  });

  it("formatea Date en español", () => {
    const result = formatDateShort(new Date(2026, 0, 5));
    expect(result).toBe("05 ene 2026");
  });
});

describe("formatInputDate", () => {
  it("devuelve formato yyyy-MM-dd", () => {
    const result = formatInputDate(new Date(2026, 5, 10));
    expect(result).toBe("2026-06-10");
  });

  it("usa la fecha actual si no se pasa argumento", () => {
    const result = formatInputDate();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("isInMonth", () => {
  it("devuelve true para fecha en el mismo año y mes", () => {
    expect(isInMonth("2026-06-15", 2026, 6)).toBe(true);
    expect(isInMonth(new Date(2026, 5, 1), 2026, 6)).toBe(true);
  });

  it("devuelve false para fecha en distinto mes o año", () => {
    expect(isInMonth("2026-07-01", 2026, 6)).toBe(false);
    expect(isInMonth("2025-06-15", 2026, 6)).toBe(false);
  });

  it("incluye el primer y ultimo dia del mes", () => {
    expect(isInMonth("2026-06-01", 2026, 6)).toBe(true);
    expect(isInMonth("2026-06-30", 2026, 6)).toBe(true);
  });
});

describe("isToday", () => {
  it("devuelve true para la fecha de hoy", () => {
    const today = new Date();
    expect(isToday(today)).toBe(true);
  });

  it("devuelve false para otra fecha", () => {
    expect(isToday("2020-01-01")).toBe(false);
  });
});
