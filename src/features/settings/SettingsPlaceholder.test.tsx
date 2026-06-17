import { fireEvent, render, screen } from "@testing-library/react";
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
    categoryId: "cat-arriendo",
    categoryName: "Arriendo",
    dueDay: 5,
    isActive: true,
    createdAt: "2026-06-10T12:00:00.000Z",
    updatedAt: "2026-06-10T12:00:00.000Z",
  },
  {
    id: "fixed-2",
    name: "Internet",
    amount: 90000,
    categoryId: "cat-servicios",
    categoryName: "Servicios",
    dueDay: 10,
    isActive: true,
    createdAt: "2026-06-10T12:00:00.000Z",
    updatedAt: "2026-06-10T12:00:00.000Z",
  },
];

describe("SettingsPlaceholder", () => {
  const upsertFixedExpense = vi.fn();
  const updateSalaryTarget = vi.fn();
  const updateAppAccentColor = vi.fn();
  const resetAppAccentColor = vi.fn();

  beforeEach(() => {
    upsertFixedExpense.mockReset();
    updateSalaryTarget.mockReset();
    updateAppAccentColor.mockReset();
    resetAppAccentColor.mockReset();
    spaDataMock.mockReturnValue({
      business: {
        id: "business-main",
        name: "Spa Mariela",
        currency: "COP",
      },
      categories: [
        {
          id: "cat-arriendo",
          name: "Arriendo",
          isActive: true,
          createdAt: "2026-06-10T12:00:00.000Z",
          updatedAt: "2026-06-10T12:00:00.000Z",
        },
        {
          id: "cat-servicios",
          name: "Servicios",
          isActive: true,
          createdAt: "2026-06-10T12:00:00.000Z",
          updatedAt: "2026-06-10T12:00:00.000Z",
        },
      ],
      transactions: [
        {
          id: "tx-fixed-1",
          type: "expense",
          amount: 600000,
          date: "2026-06-05",
          paymentMethod: "transfer",
          categoryId: "cat-arriendo",
          categoryName: "Arriendo",
          expenseType: "fixed",
          createdAt: "2026-06-05T12:00:00.000Z",
          updatedAt: "2026-06-05T12:00:00.000Z",
        },
      ],
      fixedExpenses,
      financialSettings: {
        salaryTarget: 1800000,
        updatedAt: "2026-06-10T12:00:00.000Z",
      },
      uiSettings: {
        appAccentColor: null,
        themeMode: "light",
        updatedAt: "2026-06-10T12:00:00.000Z",
      },
      upsertFixedExpense,
      updateSalaryTarget,
      updateAppAccentColor,
      resetAppAccentColor,
    });
  });

  it("muestra los gastos fijos en una tabla compacta", () => {
    render(<SettingsPlaceholder />);

    expect(screen.getByText("Gastos fijos configurados")).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: /^Gasto/ })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: /^Valor/ })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: /^Día/ })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: /^Categoría/ })).toBeTruthy();
    expect(screen.getAllByText("Arriendo").length).toBeGreaterThan(0);
    expect(screen.getByText("Internet")).toBeTruthy();
    expect(screen.getByText("Día 5")).toBeTruthy();
    expect(screen.getByText("Día 10")).toBeTruthy();
    expect(screen.getByText("Pagos fijos registrados")).toBeTruthy();
    expect(screen.getByText("Falta registrar")).toBeTruthy();
    expect(screen.queryByText("Gastos fijos mensuales")).toBeNull();
  });

  it("abre un bottom sheet para crear un gasto fijo", async () => {
    const user = userEvent.setup();
    render(<SettingsPlaceholder />);

    await user.click(screen.getByText("Gasto fijo"));

    expect(screen.getAllByText("Gastos fijos").length).toBeGreaterThan(0);
    expect(screen.getByText("Nuevo gasto fijo")).toBeTruthy();
    expect(screen.getByText("Nombre")).toBeTruthy();
    expect(screen.getByText("Día estimado de pago")).toBeTruthy();
    expect(screen.getAllByText("Categoría").length).toBeGreaterThan(0);
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

  it("muestra la tarjeta para cambiar el color de la app con una paleta segura", () => {
    render(<SettingsPlaceholder />);

    expect(screen.getByText("Color de la app")).toBeTruthy();
    expect(screen.getByText(/ventas, gastos, pagos y vales no cambian/i)).toBeTruthy();
    expect(screen.getByLabelText("Colores seguros para la app")).toBeTruthy();
    expect(screen.getByLabelText("Azul")).toBeTruthy();
    expect(screen.queryByLabelText("Ventas")).toBeNull();
    expect(screen.queryByLabelText("Gastos")).toBeNull();
  });

  it("permite ingresar un color valido y guardarlo", async () => {
    const user = userEvent.setup();
    render(<SettingsPlaceholder />);

    const input = screen.getByTestId("ColorField.Input");
    fireEvent.change(input, { target: { value: "#4F46E5" } });
    await user.click(screen.getByText("Guardar color"));

    expect(updateAppAccentColor).toHaveBeenCalledWith("#4F46E5");
    expect(screen.getByText("Vista previa")).toBeTruthy();
    expect(screen.getByText("Venta")).toBeTruthy();
    expect(screen.getAllByText("Gasto").length).toBeGreaterThan(0);
    expect(screen.getByText("Pago")).toBeTruthy();
    expect(screen.getByText("Vale")).toBeTruthy();
  });

  it("muestra error si el color manual es invalido", async () => {
    const user = userEvent.setup();
    render(<SettingsPlaceholder />);

    const input = screen.getByTestId("ColorField.Input");
    fireEvent.change(input, { target: { value: "#zzzzzz" } });
    await user.click(screen.getByText("Guardar color"));

    expect(screen.getByText("Escribe un color válido, por ejemplo #2563EB.")).toBeTruthy();
    expect(updateAppAccentColor).not.toHaveBeenCalled();
  });

  it("bloquea un color reservado para movimientos", async () => {
    const user = userEvent.setup();
    render(<SettingsPlaceholder />);

    const input = screen.getByTestId("ColorField.Input");
    fireEvent.change(input, { target: { value: "#22A66F" } });
    await user.click(screen.getByText("Guardar color"));

    expect(screen.getByText("Ese color ya se usa para identificar movimientos. Elige otro.")).toBeTruthy();
    expect(updateAppAccentColor).not.toHaveBeenCalled();
  });

  it("restaura el color original", async () => {
    const user = userEvent.setup();
    render(<SettingsPlaceholder />);

    await user.click(screen.getByText("Restaurar color original"));

    expect(resetAppAccentColor).toHaveBeenCalled();
  });
});
