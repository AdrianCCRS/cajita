import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DashboardChartCard } from "./DashboardChartCard";

describe("DashboardChartCard", () => {
  it("muestra la grafica de ventas vs gastos cuando hay movimientos", () => {
    render(
      <DashboardChartCard
        data={{
          categories: ["Sem 1", "Sem 2"],
          income: [100000, 50000],
          expenses: [30000, 15000],
          hasMovements: true,
        }}
        onRegisterIncome={() => {}}
      />,
    );

    expect(screen.getByText("Ventas vs gastos del mes")).toBeTruthy();
    expect(screen.getByTestId("ApexChart")).toHaveAttribute("data-chart-type", "bar");
  });

  it("muestra estado vacio y permite registrar venta cuando no hay movimientos", async () => {
    const onRegisterIncome = vi.fn();
    const user = userEvent.setup();

    render(
      <DashboardChartCard
        data={{
          categories: ["Sem 1", "Sem 2", "Sem 3", "Sem 4"],
          income: [0, 0, 0, 0],
          expenses: [0, 0, 0, 0],
          hasMovements: false,
        }}
        onRegisterIncome={onRegisterIncome}
      />,
    );

    expect(screen.getByText("¡Bienvenida a un nuevo mes! Empieza registrando tu primera venta.")).toBeTruthy();
    expect(screen.queryByTestId("ApexChart")).toBeNull();

    await user.click(screen.getByText("Registrar venta"));

    expect(onRegisterIncome).toHaveBeenCalledTimes(1);
  });
});
