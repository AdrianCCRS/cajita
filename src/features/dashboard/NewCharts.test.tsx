import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DailyIncomeTrendChart } from "./DailyIncomeTrendChart";
import { ExpensesByCategoryChart } from "./ExpensesByCategoryChart";
import { TopServicesChart } from "./TopServicesChart";

describe("ExpensesByCategoryChart", () => {
  it("muestra la grafica de dona cuando hay datos", () => {
    render(
      <ExpensesByCategoryChart
        data={{
          labels: ["Insumos", "Arriendo"],
          series: [70000, 80000],
          hasData: true,
        }}
      />,
    );

    expect(screen.getByText("Gastos por categoría")).toBeTruthy();
    expect(screen.getByTestId("ApexChart")).toHaveAttribute("data-chart-type", "donut");
  });

  it("muestra estado vacio cuando no hay gastos", () => {
    render(
      <ExpensesByCategoryChart
        data={{
          labels: [],
          series: [],
          hasData: false,
        }}
      />,
    );

    expect(screen.getByText("No has registrado gastos este mes. ¡Eso es buena señal!")).toBeTruthy();
    expect(screen.queryByTestId("ApexChart")).toBeNull();
  });
});

describe("TopServicesChart", () => {
  it("muestra grafica de barras horizontales por cantidad de ventas", () => {
    render(
      <TopServicesChart
        data={{
          labels: ["Manicura", "Cabello"],
          series: [2, 1],
          hasData: true,
        }}
        metric="count"
      />,
    );

    expect(screen.getByText("Servicios más vendidos")).toBeTruthy();
    const chart = screen.getByTestId("ApexChart");
    expect(chart).toHaveAttribute("data-chart-type", "bar");
    expect(chart).toHaveAttribute("data-xaxis-categories", JSON.stringify(["Manicura", "Cabello"]));
    expect(chart).toHaveAttribute("data-yaxis-preview", "Manicura");
    expect(chart.getAttribute("data-xaxis-preview")).not.toBe("NaN");
  });

  it("muestra grafica de barras horizontales por ingresos", () => {
    render(
      <TopServicesChart
        data={{
          labels: ["Cabello", "Manicura"],
          series: [100000, 80000],
          hasData: true,
        }}
        metric="revenue"
      />,
    );

    expect(screen.getByText("Servicios con más ingresos")).toBeTruthy();
    const chart = screen.getByTestId("ApexChart");
    expect(chart).toHaveAttribute("data-xaxis-categories", JSON.stringify(["Cabello", "Manicura"]));
    expect(chart).toHaveAttribute("data-yaxis-preview", "Cabello");
    expect(chart.getAttribute("data-xaxis-preview")).not.toBe("NaN");
  });

  it("muestra estado vacio cuando no hay ventas", () => {
    render(
      <TopServicesChart
        data={{
          labels: [],
          series: [],
          hasData: false,
        }}
        metric="count"
      />,
    );

    expect(screen.getByText("Registra ventas para ver tus servicios más populares.")).toBeTruthy();
    expect(screen.queryByTestId("ApexChart")).toBeNull();
  });
});

describe("DailyIncomeTrendChart", () => {
  it("muestra grafica de area cuando hay datos", () => {
    render(
      <DailyIncomeTrendChart
        data={{
          categories: ["1", "2", "3"],
          series: [0, 50000, 0],
          hasData: true,
        }}
      />,
    );

    expect(screen.getByText("Tendencia de ventas diarias")).toBeTruthy();
    expect(screen.getByTestId("ApexChart")).toHaveAttribute("data-chart-type", "area");
  });

  it("muestra estado vacio cuando no hay ventas", () => {
    render(
      <DailyIncomeTrendChart
        data={{
          categories: ["1", "2"],
          series: [0, 0],
          hasData: false,
        }}
      />,
    );

    expect(screen.getByText("¡Bienvenida a un nuevo mes! Empieza registrando tu primera venta.")).toBeTruthy();
    expect(screen.queryByTestId("ApexChart")).toBeNull();
  });
});
