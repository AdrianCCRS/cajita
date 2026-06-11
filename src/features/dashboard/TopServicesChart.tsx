import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { Card } from "../../shared/components/ui";
import type { ServiceBarChartData } from "../../shared/utils/dashboardCharts";
import { formatCurrency } from "../../shared/utils/formatCurrency";

type TopServicesChartProps = {
  data: ServiceBarChartData;
  metric: "count" | "revenue";
};

const barColors = [
  "oklch(0.57 0.13 158)",
  "oklch(0.52 0.12 205)",
  "oklch(0.53 0.14 285)",
  "oklch(0.55 0.15 325)",
  "oklch(0.55 0.15 55)",
  "oklch(0.52 0.17 25)",
];

export function TopServicesChart({ data, metric }: TopServicesChartProps) {
  const isCount = metric === "count";
  const series = [
    {
      name: isCount ? "Ventas" : "Total",
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
    colors: [
      ({ dataPointIndex }: { dataPointIndex: number }) =>
        barColors[dataPointIndex % barColors.length] ?? "var(--income)",
    ],
    dataLabels: {
      enabled: false,
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
    plotOptions: {
      bar: {
        borderRadius: 5,
        horizontal: true,
        barHeight: "60%",
        distributed: true,
        dataLabels: {
          position: "top",
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
        formatter: (value) => (isCount ? String(value) : formatCurrency(value)),
      },
    },
    xaxis: {
      categories: data.labels,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        formatter: isCount ? formatCountAxisLabel : formatMoneyAxisLabel,
        style: {
          colors: "var(--muted)",
          fontSize: "12px",
          fontWeight: 800,
        },
      },
    },
    yaxis: {
      labels: {
        formatter: (value) => String(value),
        style: {
          colors: "var(--foreground)",
          fontSize: "13px",
          fontWeight: 700,
        },
      },
    },
  };

  const chartTitle = isCount
    ? "Servicios más vendidos"
    : "Servicios con más ingresos";
  const chartSubtitle = isCount
    ? "Cantidad de ventas por servicio"
    : "Dinero generado por servicio";

  return (
    <Card className="ui-card wide-card dashboard-chart-card">
      <Card.Content>
        <div className="section-heading">
          <div>
            <span>{chartSubtitle}</span>
            <strong>{chartTitle}</strong>
          </div>
        </div>

        {data.hasData ? (
          <div
            aria-label={`Gráfica de ${chartSubtitle.toLowerCase()}`}
            className="dashboard-chart"
            style={{ minHeight: Math.max(data.labels.length * 44, 200) }}
          >
            <Chart
              height="100%"
              options={options}
              series={series}
              type="bar"
              width="100%"
            />
          </div>
        ) : (
          <div className="chart-empty-state">
            <p>Registra ventas para ver tus servicios más populares.</p>
          </div>
        )}
      </Card.Content>
    </Card>
  );
}

function formatCountAxisLabel(value: string | number) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? String(Math.round(numericValue)) : String(value);
}

function formatMoneyAxisLabel(value: string | number) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? formatShortCurrency(numericValue) : String(value);
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
