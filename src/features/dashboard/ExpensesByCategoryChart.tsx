import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { Card } from "../../shared/components/ui";
import type { CategoryExpenseChartData } from "../../shared/utils/dashboardCharts";
import { formatCurrency } from "../../shared/utils/formatCurrency";

type ExpensesByCategoryChartProps = {
  data: CategoryExpenseChartData;
};

const donutColors = [
  "oklch(0.52 0.17 25)",
  "oklch(0.55 0.15 55)",
  "oklch(0.53 0.14 285)",
  "oklch(0.52 0.12 205)",
  "oklch(0.57 0.13 158)",
  "oklch(0.55 0.15 325)",
  "oklch(0.58 0.12 120)",
  "oklch(0.50 0.13 250)",
];

export function ExpensesByCategoryChart({ data }: ExpensesByCategoryChartProps) {
  const series = data.series;

  const options: ApexOptions = {
    chart: {
      fontFamily: "inherit",
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    colors: donutColors,
    dataLabels: {
      enabled: false,
    },
    labels: data.labels,
    legend: {
      fontWeight: 600,
      fontSize: "13px",
      horizontalAlign: "left",
      position: "bottom",
      itemMargin: {
        horizontal: 10,
        vertical: 4,
      },
      markers: {
        size: 8,
        strokeWidth: 0,
        offsetX: -4,
        offsetY: 2,
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "60%",
          labels: {
            show: true,
            name: {
              fontSize: "14px",
              fontWeight: 800,
              color: "var(--muted)",
              offsetY: -2,
            },
            value: {
              fontSize: "18px",
              fontWeight: 800,
              color: "var(--foreground)",
              formatter: (value) => formatCurrency(Number(value)),
              offsetY: 6,
            },
            total: {
              show: true,
              label: "Total gastos",
              fontSize: "12px",
              fontWeight: 800,
              color: "var(--muted)",
              formatter: () => formatCurrency(series.reduce((a, b) => a + b, 0)),
            },
          },
        },
      },
    },
    states: {
      hover: {
        filter: { type: "lighten" },
      },
    },
    tooltip: {
      y: {
        formatter: (value) => formatCurrency(value),
      },
    },
  };

  return (
    <Card className="ui-card wide-card dashboard-chart-card">
      <Card.Content>
        <div className="section-heading">
          <div>
            <span>¿En qué se fue la plata?</span>
            <strong>Gastos por categoría</strong>
          </div>
        </div>

        {data.hasData ? (
          <div className="dashboard-chart" aria-label="Gráfica de gastos por categoría">
            <Chart height="100%" options={options} series={series} type="donut" width="100%" />
          </div>
        ) : (
          <div className="chart-empty-state">
            <p>No has registrado gastos este mes. ¡Eso es buena señal!</p>
          </div>
        )}
      </Card.Content>
    </Card>
  );
}
