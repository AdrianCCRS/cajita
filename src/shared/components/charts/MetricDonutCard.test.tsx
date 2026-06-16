import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MetricDonutCard } from "./MetricDonutCard";

const segments = [
  { label: "Gastos del negocio", value: 30000, type: "expense" as const },
  { label: "Salario pagado", value: 20000, type: "withdrawal" as const },
  { label: "Ganancia después de salario", value: 50000, type: "profit" as const },
];

describe("MetricDonutCard", () => {
  it("renderiza titulo, subtitulo, leyenda y chart circular", () => {
    render(
      <MetricDonutCard
        currency
        segments={segments}
        subtitle="Ventas repartidas"
        title="Composición del dinero"
        totalLabel="Ventas"
        totalValue={100000}
      />,
    );

    expect(screen.getByText("Composición del dinero")).toBeInTheDocument();
    expect(screen.getByText("Ventas repartidas")).toBeInTheDocument();
    expect(screen.getByText("Gastos del negocio")).toBeInTheDocument();
    expect(screen.getByText("Salario pagado")).toBeInTheDocument();
    expect(screen.getByText("Ganancia después de salario")).toBeInTheDocument();
    expect(screen.getByText(/\$\s*30\.000\s*·\s*30%/)).toBeInTheDocument();
    expect(screen.getByTestId("ApexChart")).toHaveAttribute("data-chart-type", "donut");
  });

  it("filtra segmentos sin valor positivo", () => {
    render(
      <MetricDonutCard
        currency
        segments={[
          { label: "Gastos del negocio", value: 0, type: "expense" },
          { label: "Ganancia después de salario", value: 45000, type: "profit" },
        ]}
        title="Composición"
      />,
    );

    expect(screen.queryByText("Gastos del negocio")).not.toBeInTheDocument();
    expect(screen.getByText("Ganancia después de salario")).toBeInTheDocument();
    expect(screen.getByTestId("ApexChart")).toBeInTheDocument();
  });

  it("muestra estado vacio cuando no hay segmentos positivos", () => {
    render(
      <MetricDonutCard
        emptyMessage="No hay datos."
        segments={[{ label: "Gastos", value: 0, type: "expense" }]}
        title="Composición"
      />,
    );

    expect(screen.getByText("No hay datos.")).toBeInTheDocument();
    expect(screen.queryByTestId("ApexChart")).not.toBeInTheDocument();
  });
});
