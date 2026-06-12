import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FixedExpense } from "../../shared/types/domain";
import { SettingsPlaceholder } from "./SettingsPlaceholder";

const { spaDataMock } = vi.hoisted(() => ({
  spaDataMock: vi.fn(),
}));

vi.mock("../../shared/data/SpaDataContext", () => ({
  useSpaData: spaDataMock,
}));

const fixedExpenses: FixedExpense[] = [
  {
    id: "fixed-1",
    name: "Arriendo",
    amount: 600000,
    isActive: true,
    createdAt: "2026-06-10T12:00:00.000Z",
    updatedAt: "2026-06-10T12:00:00.000Z",
  },
  {
    id: "fixed-2",
    name: "Internet",
    amount: 90000,
    isActive: true,
    createdAt: "2026-06-10T12:00:00.000Z",
    updatedAt: "2026-06-10T12:00:00.000Z",
  },
];

describe("SettingsPlaceholder", () => {
  const upsertFixedExpense = vi.fn();
  const updateSalaryTarget = vi.fn();

  beforeEach(() => {
    upsertFixedExpense.mockReset();
    updateSalaryTarget.mockReset();
    spaDataMock.mockReturnValue({
      business: {
        id: "business-main",
        name: "Spa Mariela",
        currency: "COP",
      },
      fixedExpenses,
      financialSettings: {
        salaryTarget: 1800000,
        updatedAt: "2026-06-10T12:00:00.000Z",
      },
      upsertFixedExpense,
      updateSalaryTarget,
    });
  });

  it("muestra los gastos fijos en una tabla compacta", () => {
    render(<SettingsPlaceholder />);

    expect(screen.getByText("Gastos fijos configurados")).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Gasto" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Valor" })).toBeTruthy();
    expect(screen.getByText("Arriendo")).toBeTruthy();
    expect(screen.getByText("Internet")).toBeTruthy();
    expect(screen.getByText("2 activos de 2")).toBeTruthy();
    expect(screen.queryByText("Gastos fijos mensuales")).toBeNull();
  });

  it("abre un bottom sheet para crear un gasto fijo", async () => {
    const user = userEvent.setup();
    render(<SettingsPlaceholder />);

    await user.click(screen.getByText("Gasto fijo"));

    expect(screen.getAllByText("Gastos fijos").length).toBeGreaterThan(0);
    expect(screen.getByText("Nuevo gasto fijo")).toBeTruthy();
    expect(screen.getByText("Nombre")).toBeTruthy();
    expect(screen.getByText("Agregar gasto fijo")).toBeTruthy();
  });

  it("abre un bottom sheet para editar un gasto fijo", async () => {
    const user = userEvent.setup();
    render(<SettingsPlaceholder />);

    await user.click(screen.getByLabelText("Editar Arriendo"));

    expect(screen.getByText("Editar gasto fijo")).toBeTruthy();
    expect(screen.getByText("Guardar gasto")).toBeTruthy();
  });

  it("abre un bottom sheet para editar el salario mensual", async () => {
    const user = userEvent.setup();
    render(<SettingsPlaceholder />);

    await user.click(screen.getByText("Salario"));

    expect(screen.getAllByText("Mi salario").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Objetivo mensual").length).toBeGreaterThan(0);
    expect(screen.getByText("¿Cuánto quieres ganarte al mes?")).toBeTruthy();
    expect(screen.getByText("Guardar salario")).toBeTruthy();
  });
});
