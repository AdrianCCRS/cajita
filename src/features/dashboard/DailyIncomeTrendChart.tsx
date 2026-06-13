import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { Card } from "../../shared/components/ui";
import type { DailyIncomeChartData } from "../../shared/utils/dashboardCharts";
import { formatCurrency } from "../../shared/utils/formatCurrency";

type DailyIncomeTrendChartProps = {
  data: DailyIncomeChartData;
};

export function DailyIncomeTrendChart({ data }: DailyIncomeTrendChartProps) {
  const series = [
    {
      name: "Ventas",
      data: data.series,
    },
  ];

  const options: ApexOptions = {
    chart: {
      fontFamily: "inherit",
      parentHeightOffset: 0,
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    colors: ["var(--income)"],
    dataLabels: {
      enabled: false,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.35,
        opacityTo: 0.05,
        stops: [0, 100],
      },
    },
    grid: {
      borderColor: "var(--line)",
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    legend: {
      show: false,
    },
    markers: {
      size: 0,
      strokeWidth: 0,
    },
    stroke: {
      curve: "smooth",
      width: 2.5,
    },
    states: {
      hover: {
        filter: { type: "lighten" },
      },
    },
    tooltip: {
      x: {
        formatter: (value) => `Día ${value}`,
      },
      y: {
        formatter: (value) => formatCurrency(value),
      },
    },
    xaxis: {
      categories: data.categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      tickAmount: Math.min(Math.ceil(data.categories.length / 5), 6),
      labels: {
        show: true,
        style: {
          colors: "var(--muted)",
          fontSize: "12px",
          fontWeight: 800,
        },
      },
    },
    yaxis: {
      labels: {
        formatter: (value) => formatShortCurrency(value),
        style: {
          colors: "var(--muted)",
          fontSize: "12px",
          fontWeight: 800,
        },
      },
    },
  };

  return (
    <Card className="ui-card wide-card dashboard-chart-card">
      <Card.Content>
        <div className="section-heading">
          <div className="section-subheading">
            <span>Día a día del mes</span>
            <strong>Tendencia de ventas diarias</strong>
          </div>
        </div>

        {data.hasData ? (
          <div className="dashboard-chart" aria-label="Gráfica de ventas diarias">
            <Chart height="100%" options={options} series={series} type="area" width="100%" />
          </div>
        ) : (
          <div className="chart-empty-state">
            <p>¡Bienvenida a un nuevo mes! Empieza registrando tu primera venta.</p>
          </div>
        )}
      </Card.Content>
    </Card>
  );
}

function formatShortCurrency(value: number) {
  if (Math.abs(value) >= 1000000) {
    return `${Math.round(value / 1000000)}M`;
  }

  if (Math.abs(value) >= 1000) {
    return `${Math.round(value / 1000)}K`;
  }

  return String(Math.round(value));
}
