import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Transaction } from "../../shared/types/domain";
import { TransactionCalendarPage } from "./TransactionCalendarPage";

const { navigateMock, spaDataMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  spaDataMock: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("../../shared/data/SpaDataContext", () => ({
  useSpaData: spaDataMock,
}));

const baseTransaction = {
  paymentMethod: "cash",
  createdAt: "2026-06-10T12:00:00.000-05:00",
  updatedAt: "2026-06-10T12:00:00.000-05:00",
} as const;

function transaction(input: Partial<Transaction> & Pick<Transaction, "id" | "type" | "amount" | "date">): Transaction {
  return {
    ...baseTransaction,
    ...input,
  };
}

describe("TransactionCalendarPage", () => {
  beforeEach(() => {
    navigateMock.mockClear();
    spaDataMock.mockReturnValue({
      error: "",
      isLoading: false,
      transactions: [
        transaction({
          id: "income-1",
          type: "income",
          amount: 35000,
          date: "2026-06-12",
          createdAt: "2026-06-12T09:15:00.000-05:00",
          serviceName: "Manicura tradicional",
        }),
        transaction({
          id: "income-2",
          type: "income",
          amount: 45000,
          date: "2026-06-12",
          createdAt: "2026-06-12T11:30:00.000-05:00",
          serviceName: "Manicura tradicional",
          notes: undefined,
        }),
        transaction({
          id: "expense-1",
          type: "expense",
          amount: 20000,
          date: "2026-06-12",
          categoryName: "Insumos",
        }),
        transaction({
          id: "voucher-1",
          type: "personal_voucher",
          amount: 15000,
          date: "2026-06-12",
          personalCategoryName: "Alimentación",
        }),
      ],
    });
  });

  it("renderiza la vista Calendario con ventas por defecto", () => {
    render(<TransactionCalendarPage />);

    expect(screen.getByText("Calendario")).toBeTruthy();
    expect(screen.getByText("Revisa tus movimientos por día.")).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Ventas" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Total vendido")).toBeTruthy();
    expect(screen.getByText("Ventas registradas")).toBeTruthy();
    expect(screen.getByTestId("calendar-day-count-2026-06-12")).toHaveTextContent("2");
  });

  it("cambia a gastos sin mezclar vales personales", async () => {
    const user = userEvent.setup();
    render(<TransactionCalendarPage />);

    await user.click(screen.getByRole("tab", { name: "Gastos" }));

    expect(screen.getByRole("tab", { name: "Gastos" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Total gastado")).toBeTruthy();
    expect(screen.getByTestId("calendar-day-count-2026-06-12")).toHaveTextContent("1");
    expect(screen.queryByText("Total en vales")).toBeNull();
  });

  it("abre detalle del día y muestra solo movimientos del tipo seleccionado", async () => {
    const user = userEvent.setup();
    render(<TransactionCalendarPage />);

    await user.click(screen.getByTestId("calendar-day-count-2026-06-12"));

    expect(screen.getByText("Ventas del día")).toBeTruthy();
    expect(screen.getByText("Total vendido este día")).toBeTruthy();
    expect(screen.getAllByText("Manicura tradicional")).toHaveLength(1);
    expect(screen.getByText("2 movimientos · Efectivo")).toBeTruthy();
    expect(screen.getAllByText("$ 80.000").length).toBeGreaterThan(0);
    expect(screen.getByText("Horas: 09:15, 11:30")).toBeTruthy();
    expect(screen.queryByText("Insumos")).toBeNull();
    expect(screen.queryByText("Alimentación")).toBeNull();
  });

  it("navega de vuelta a Historial", async () => {
    const user = userEvent.setup();
    render(<TransactionCalendarPage />);

    await user.click(screen.getByText("Volver a Historial"));

    expect(navigateMock).toHaveBeenCalledWith("/historial");
  });

  it("muestra estado vacío cuando no hay movimientos", () => {
    spaDataMock.mockReturnValue({
      error: "",
      isLoading: false,
      transactions: [],
    });

    render(<TransactionCalendarPage />);

    expect(screen.getByText("Todavía no hay movimientos para mostrar.")).toBeTruthy();
    expect(screen.getByText("Cuando registres movimientos, aquí verás un resumen por meses.")).toBeTruthy();
  });
});
