import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MetricSparklineCard } from "./MetricSparklineCard";
import {
  formatMetricSparklineValue,
  getMetricSparklineColor,
  getMetricSparklineToneClass,
} from "./metricSparklineUtils";

const chartData = [
  { label: "01 Sep", value: 120000 },
  { label: "02 Sep", value: 90000 },
  { label: "03 Sep", value: 160000 },
];

describe("MetricSparklineCard", () => {
  it("renderiza titulo, label y valor principal formateado como COP", () => {
    render(
      <MetricSparklineCard
        currency
        data={chartData}
        title="Ventas"
        type="income"
        value={424652}
        valueLabel="Ventas del mes"
      />,
    );

    expect(screen.getByText("Ventas")).toBeInTheDocument();
    expect(screen.getByText(/\$\s*424\.652/)).toBeInTheDocument();
    expect(screen.getByText("Ventas del mes")).toBeInTheDocument();
    expect(screen.getByTestId("ApexChart")).toHaveAttribute("data-chart-type", "area");
  });

  it("renderiza el valor principal como numero normal cuando currency es false", () => {
    render(
      <MetricSparklineCard
        currency={false}
        data={chartData}
        title="Servicios"
        value={1480}
        valueLabel="Servicios vendidos"
      />,
    );

    expect(screen.getByText("1.480")).toBeInTheDocument();
    expect(screen.getByText("Servicios vendidos")).toBeInTheDocument();
  });

  it("muestra estado vacio cuando data no tiene puntos", () => {
    render(
      <MetricSparklineCard
        data={[]}
        emptyMessage="Todavia no hay datos."
        title="Gastos"
        type="expense"
        value={0}
      />,
    );

    expect(screen.getByText("Todavia no hay datos.")).toBeInTheDocument();
    expect(screen.queryByTestId("ApexChart")).not.toBeInTheDocument();
  });

  it("usa el tipo para decidir color y clase visual", () => {
    const { container } = render(
      <MetricSparklineCard
        data={chartData}
        title="Gastos"
        type="expense"
        value={235312}
      />,
    );

    expect(getMetricSparklineColor("expense")).toBe("var(--expense)");
    expect(container.firstElementChild).toHaveClass("metric-sparkline-card--expense");
  });

  it("usa un color propio para ganancia despues de salario", () => {
    expect(getMetricSparklineColor("profit")).toBe("var(--profit)");
  });

  it("no rompe si faltan props opcionales", () => {
    render(
      <MetricSparklineCard
        data={chartData}
        title="Ganancia"
        value={90000}
      />,
    );

    expect(screen.getAllByText("Ganancia")).toHaveLength(2);
    expect(screen.getByTestId("ApexChart")).toBeInTheDocument();
  });
});

describe("metricSparklineUtils", () => {
  it("formatea valores de forma reutilizable", () => {
    expect(formatMetricSparklineValue(35000, true)).toMatch(/\$\s*35\.000/);
    expect(formatMetricSparklineValue(35000, false)).toBe("35.000");
  });

  it("crea clases estables para tipos con guion bajo", () => {
    expect(getMetricSparklineToneClass("personal_voucher")).toBe(
      "metric-sparkline-card--personal-voucher",
    );
  });
});
