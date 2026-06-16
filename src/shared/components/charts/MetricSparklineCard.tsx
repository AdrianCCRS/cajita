import ReactApexChart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { useMemo } from "react";
import { Card } from "../ui";
import {
  formatMetricSparklineValue,
  getApexTooltipTheme,
  getMetricSparklineColor,
  getMetricSparklineToneClass,
  type MetricSparklinePoint,
  type MetricSparklineType,
} from "./metricSparklineUtils";

export type { MetricSparklinePoint, MetricSparklineType };

export type MetricSparklineCardProps = {
  title: string;
  value: number;
  valueLabel?: string;
  data: MetricSparklinePoint[];
  type?: MetricSparklineType;
  currency?: boolean;
  emptyMessage?: string;
  className?: string;
};

export function MetricSparklineCard({
  title,
  value,
  valueLabel,
  data,
  type = "business",
  currency = false,
  emptyMessage = "Sin datos para graficar.",
  className,
}: MetricSparklineCardProps) {
  const color = getMetricSparklineColor(type);
  const formattedValue = formatMetricSparklineValue(value, currency);
  const chartLabel = valueLabel ?? title;
  const hasData = data.length > 0;

  const series = useMemo(
    () => [
      {
        name: chartLabel,
        data: data.map((point) => point.value),
      },
    ],
    [chartLabel, data],
  );

  const options = useMemo<ApexOptions>(
    () => ({
      chart: {
        animations: {
          enabled: true,
        },
        fontFamily: "inherit",
        parentHeightOffset: 0,
        sparkline: {
          enabled: true,
        },
        toolbar: {
          show: false,
        },
        type: "area",
        zoom: {
          enabled: false,
        },
      },
      colors: [color],
      dataLabels: {
        enabled: false,
      },
      fill: {
        type: "gradient",
        gradient: {
          opacityFrom: 0.35,
          opacityTo: 0.05,
          shadeIntensity: 0.4,
          stops: [0, 90, 100],
        },
      },
      grid: {
        show: false,
      },
      legend: {
        show: false,
      },
      markers: {
        size: 0,
        hover: {
          size: 4,
        },
      },
      stroke: {
        curve: "smooth",
        width: 3,
      },
      tooltip: {
        enabled: true,
        theme: getApexTooltipTheme(),
        x: {
          show: true,
        },
        y: {
          formatter: (tooltipValue) => formatMetricSparklineValue(Number(tooltipValue), currency),
          title: {
            formatter: () => `${chartLabel}: `,
          },
        },
      },
      xaxis: {
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        categories: data.map((point) => point.label),
        labels: {
          show: false,
        },
      },
      yaxis: {
        show: false,
      },
    }),
    [chartLabel, color, currency, data],
  );

  return (
    <Card
      className={[
        "ui-card",
        "metric-sparkline-card",
        getMetricSparklineToneClass(type),
        className,
      ].filter(Boolean).join(" ")}
    >
      <Card.Content className="metric-sparkline-card__body">
        <div className="metric-sparkline-card__summary">
          <strong>{formattedValue}</strong>
          <span>{chartLabel}</span>
        </div>

        {hasData ? (
          <div
            aria-label={`Mini grafica de ${chartLabel}`}
            className="metric-sparkline-card__chart"
          >
            <ReactApexChart
              height={90}
              options={options}
              series={series}
              type="area"
              width="100%"
            />
          </div>
        ) : (
          <p className="metric-sparkline-card__empty">{emptyMessage}</p>
        )}

        <span className="metric-sparkline-card__title">{title}</span>
      </Card.Content>
    </Card>
  );
}
