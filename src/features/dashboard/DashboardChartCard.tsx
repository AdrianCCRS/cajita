import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { Button, Card } from "../../shared/components/ui";
import type { WeeklyIncomeExpenseChartData } from "../../shared/utils/dashboardCharts";
import { formatCurrency } from "../../shared/utils/formatCurrency";

type DashboardChartCardProps = {
  data: WeeklyIncomeExpenseChartData;
  onRegisterIncome: () => void;
};

export function DashboardChartCard({ data, onRegisterIncome }: DashboardChartCardProps) {
  const series = [
    {
      name: "Ventas",
      data: data.income,
    },
    {
      name: "Gastos",
      data: data.expenses,
    },
  ];

  const options: ApexOptions = {
    chart: {
      fontFamily: "inherit",
      parentHeightOffset: 0,
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    colors: ["var(--income)", "var(--expense)"],
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
      fontWeight: 800,
      horizontalAlign: "left",
      markers: {
        size: 7,
        strokeWidth: 0,
      },
      offsetY: 6,
      position: "bottom",
    },
    plotOptions: {
      bar: {
        borderRadius: 5,
        columnWidth: "48%",
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
    xaxis: {
      categories: data.categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
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
          <div>
            <span>Comparativo semanal</span>
            <strong>Ventas vs gastos del mes</strong>
          </div>
        </div>

        {data.hasMovements ? (
          <div className="dashboard-chart" aria-label="Grafica de ventas y gastos del mes">
            <Chart height="100%" options={options} series={series} type="bar" width="100%" />
          </div>
        ) : (
          <div className="chart-empty-state">
            <p>¡Bienvenida a un nuevo mes! Empieza registrando tu primera venta.</p>
            <Button onPress={onRegisterIncome}>Registrar venta</Button>
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
