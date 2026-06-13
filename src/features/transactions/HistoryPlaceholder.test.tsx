import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Transaction } from "../../shared/types/domain";
import { HistoryPlaceholder } from "./HistoryPlaceholder";

const { spaDataMock } = vi.hoisted(() => ({
  spaDataMock: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useOutletContext: () => ({
      openRegister: vi.fn(),
      showToast: vi.fn(),
    }),
  };
});

vi.mock("../../shared/data/SpaDataContext", () => ({
  useSpaData: spaDataMock,
}));

const baseTransaction = {
  paymentMethod: "cash",
  createdAt: "2026-06-10T12:00:00.000Z",
  updatedAt: "2026-06-10T12:00:00.000Z",
} as const;

function transaction(input: Partial<Transaction> & Pick<Transaction, "id" | "type" | "amount" | "date">): Transaction {
  return {
    ...baseTransaction,
    ...input,
  };
}

describe("HistoryPlaceholder", () => {
  beforeEach(() => {
    spaDataMock.mockReturnValue({
      transactions: [
        transaction({
          id: "income-today-1",
          type: "income",
          amount: 35000,
          date: "2026-06-11",
          serviceName: "Manicura tradicional",
          costAtTime: 9000,
        }),
        transaction({
          id: "income-today-2",
          type: "income",
          amount: 45000,
          date: "2026-06-11",
          serviceName: "Manicura tradicional",
          costAtTime: 12000,
        }),
        transaction({
          id: "expense-today",
          type: "expense",
          amount: 15000,
          date: "2026-06-11",
          categoryName: "Insumos",
        }),
        transaction({
          id: "withdrawal-yesterday",
          type: "withdrawal",
          amount: 50000,
          date: "2026-06-09",
          categoryName: "Salario de la dueña",
        }),
      ],
      deleteTransaction: vi.fn(),
      restoreTransaction: vi.fn(),
    });
  });

  it("agrupa movimientos por fecha y muestra resumen diario", () => {
    render(<HistoryPlaceholder />);

    expect(screen.getAllByText("Hoy").length).toBeGreaterThan(0);
    expect(screen.getByText("09 jun 2026")).toBeTruthy();
    expect(screen.getByText("Manicura tradicional")).toBeTruthy();
    expect(screen.getByText("Venta agrupada · 2 ventas")).toBeTruthy();
    expect(screen.getByText("$ 80.000")).toBeTruthy();
    expect(screen.getByText("Ganancia $ 59.000")).toBeTruthy();
    expect(screen.getByText("Insumos")).toBeTruthy();
    expect(screen.getAllByText("1 movimientos").length).toBeGreaterThan(0);
  });

  it("filtra por tipo sin mostrar movimientos de otros tipos", async () => {
    const user = userEvent.setup();
    render(<HistoryPlaceholder />);

    await user.click(screen.getByText("Ventas"));

    expect(screen.getByText("Manicura tradicional")).toBeTruthy();
    expect(screen.getByText("Venta agrupada · 2 ventas")).toBeTruthy();
    expect(screen.queryByText("Insumos")).toBeNull();
    expect(screen.queryByText("Salario de la dueña")).toBeNull();
  });

  it("muestra eliminar solo dentro del detalle del movimiento", async () => {
    const user = userEvent.setup();
    render(<HistoryPlaceholder />);

    expect(screen.queryByText("Eliminar movimiento")).toBeNull();

    await user.click(screen.getByText("Insumos"));

    expect(screen.getByText("Detalle del movimiento")).toBeTruthy();
    expect(screen.getByText("Eliminar movimiento")).toBeTruthy();
  });

  it("abre detalle agrupado de ventas sin mostrar accion de eliminar", async () => {
    const user = userEvent.setup();
    render(<HistoryPlaceholder />);

    await user.click(screen.getByText("Manicura tradicional"));

    expect(screen.getByText("Ventas agrupadas")).toBeTruthy();
    expect(screen.getByText("Total vendido")).toBeTruthy();
    expect(screen.getByText("Cantidad de ventas")).toBeTruthy();
    expect(screen.getByText("Ganancia real")).toBeTruthy();
    expect(screen.queryByText("Eliminar movimiento")).toBeNull();
  });
});
