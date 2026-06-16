import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DashboardPlaceholder } from "./DashboardPlaceholder";
import type { Transaction } from "../../shared/types/domain";

const spaDataMock = vi.fn();
const openRegisterMock = vi.fn();

vi.mock("../../shared/data/SpaDataContext", () => ({
  useSpaData: () => spaDataMock(),
}));

vi.mock("react-router-dom", () => ({
  useOutletContext: () => ({ openRegister: openRegisterMock }),
}));

const baseTransaction = {
  paymentMethod: "cash",
  createdAt: "2026-01-10T12:00:00.000Z",
  updatedAt: "2026-01-10T12:00:00.000Z",
} as const;

function transaction(input: Pick<Transaction, "id" | "type" | "amount" | "date"> & Partial<Transaction>): Transaction {
  return {
    ...baseTransaction,
    ...input,
  };
}

describe("DashboardPlaceholder", () => {
  it("muestra aporte por servicio y gauges en la tab del mes", () => {
    spaDataMock.mockReturnValue({
      transactions: [
        transaction({ id: "income-1", type: "income", amount: 200000, date: "2026-06-15", serviceName: "Manicura", priceAtTime: 200000, costAtTime: 50000 }),
        transaction({ id: "income-2", type: "income", amount: 100000, date: "2026-06-16", serviceName: "Cabello", priceAtTime: 100000, costAtTime: 25000 }),
        transaction({ id: "expense-1", type: "expense", amount: 40000, date: "2026-06-15", categoryName: "Insumos" }),
        transaction({ id: "withdrawal-1", type: "withdrawal", amount: 50000, date: "2026-06-15" }),
        transaction({ id: "voucher-1", type: "personal_voucher", amount: 20000, date: "2026-06-15", personalCategoryId: "food", personalCategoryName: "Alimentación" }),
      ],
      fixedExpenses: [
        {
          id: "fixed-1",
          name: "Arriendo",
          amount: 500000,
          isActive: true,
          createdAt: "2026-06-01T12:00:00.000Z",
          updatedAt: "2026-06-01T12:00:00.000Z",
        },
      ],
      financialSettings: {
        salaryTarget: 1800000,
      },
    });

    render(<DashboardPlaceholder />);

    expect(screen.getByText("Aporte por servicio del mes")).toBeInTheDocument();
    expect(screen.getAllByText("Manicura").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Cabello").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Vales personales").length).toBeGreaterThan(0);
    expect(screen.getByText("Categoría con más vales")).toBeInTheDocument();
    expect(screen.getByText("Alimentación")).toBeInTheDocument();
    expect(screen.getByText(/\$\s*20\.000 · 100% de tus vales/)).toBeInTheDocument();
    expect(screen.getAllByTestId("ApexChart").some((chart) => chart.getAttribute("data-chart-type") === "donut")).toBe(true);
    expect(screen.getByLabelText("Meta mínima: 45%")).toBeInTheDocument();
    expect(screen.getByLabelText("Salario: 4%")).toBeInTheDocument();
    expect(screen.getAllByTestId("ApexChart").some((chart) => chart.getAttribute("data-chart-type") === "radialBar")).toBe(true);
  });

  it("muestra KPIs y composicion circular historica sin mezclar gastos, salario y vales", async () => {
    const user = userEvent.setup();

    spaDataMock.mockReturnValue({
      transactions: [
        transaction({ id: "income-1", type: "income", amount: 100000, date: "2026-01-15", serviceName: "Manicura" }),
        transaction({ id: "income-2", type: "income", amount: 50000, date: "2026-03-01", serviceName: "Cabello" }),
        transaction({ id: "expense-1", type: "expense", amount: 30000, date: "2026-03-01", categoryName: "Insumos" }),
        transaction({ id: "withdrawal-1", type: "withdrawal", amount: 20000, date: "2026-03-02" }),
        transaction({ id: "voucher-1", type: "personal_voucher", amount: 10000, date: "2026-03-03", personalCategoryName: "Alimentación" }),
      ],
      fixedExpenses: [],
      financialSettings: {
        salaryTarget: 1800000,
      },
    });

    render(<DashboardPlaceholder />);

    await user.click(screen.getByRole("tab", { name: /histórico/i }));

    expect(screen.getByText("Ventas históricas")).toBeInTheDocument();
    expect(screen.getByText("Gastos históricos")).toBeInTheDocument();
    expect(screen.getByText("Ganancia histórica")).toBeInTheDocument();
    expect(screen.getByText("Composición histórica del dinero")).toBeInTheDocument();
    expect(screen.getByText("Aporte histórico por servicio")).toBeInTheDocument();
    expect(screen.getAllByText("Manicura").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Cabello").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Salario pagado").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Vales personales").length).toBeGreaterThan(0);
    expect(screen.getByText(/\$\s*150\.000/)).toBeInTheDocument();
    expect(screen.getAllByText(/\$\s*30\.000/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\$\s*90\.000/).length).toBeGreaterThan(0);
  });
});
