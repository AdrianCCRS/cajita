import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MetricGaugeChart } from "./MetricGaugeChart";

describe("MetricGaugeChart", () => {
  it("renderiza un radialBar con porcentaje normalizado", () => {
    render(<MetricGaugeChart label="Meta mínima" type="profit" value={72} />);

    expect(screen.getByLabelText("Meta mínima: 72%")).toBeInTheDocument();
    expect(screen.getByTestId("ApexChart")).toHaveAttribute("data-chart-type", "radialBar");
  });

  it("limita el porcentaje visual al maximo", () => {
    render(<MetricGaugeChart label="Salario" type="withdrawal" value={135} />);

    expect(screen.getByLabelText("Salario: 100%")).toBeInTheDocument();
  });

  it("no permite porcentaje visual negativo", () => {
    render(<MetricGaugeChart label="Meta mínima" type="expense" value={-20} />);

    expect(screen.getByLabelText("Meta mínima: 0%")).toBeInTheDocument();
  });
});
