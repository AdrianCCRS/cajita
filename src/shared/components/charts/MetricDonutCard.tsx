import ReactApexChart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { useMemo } from "react";
import { Card } from "../ui";
import {
  formatMetricSparklineValue,
  getApexTooltipTheme,
  getMetricChartColor,
  type MetricChartType,
} from "./metricSparklineUtils";

export type MetricDonutSegment = {
  label: string;
  value: number;
  type?: MetricChartType;
  color?: string;
};

export type MetricDonutCardProps = {
  title: string;
  subtitle?: string;
  totalLabel?: string;
  totalValue?: number;
  segments: MetricDonutSegment[];
  currency?: boolean;
  emptyMessage?: string;
  className?: string;
};

export function MetricDonutCard({
  title,
  subtitle,
  totalLabel = "Total",
  totalValue,
  segments,
  currency = false,
  emptyMessage = "Sin datos para graficar.",
  className,
}: MetricDonutCardProps) {
  const visibleSegments = useMemo(
    () => segments.filter((segment) => Number.isFinite(segment.value) && segment.value > 0),
    [segments],
  );
  const hasData = visibleSegments.length > 0;
  const series = useMemo(() => visibleSegments.map((segment) => segment.value), [visibleSegments]);
  const labels = useMemo(() => visibleSegments.map((segment) => segment.label), [visibleSegments]);
  const colors = useMemo(
    () => visibleSegments.map((segment) => segment.color ?? getMetricChartColor(segment.type ?? "business")),
    [visibleSegments],
  );
  const resolvedTotal = totalValue ?? series.reduce((total, value) => total + value, 0);

  const options = useMemo<ApexOptions>(
    () => ({
      chart: {
        animations: {
          enabled: true,
        },
        fontFamily: "inherit",
        parentHeightOffset: 0,
        toolbar: {
          show: false,
        },
        type: "donut",
        zoom: {
          enabled: false,
        },
      },
      colors,
      dataLabels: {
        enabled: false,
      },
      labels,
      legend: {
        show: false,
      },
      plotOptions: {
        pie: {
          donut: {
            size: "72%",
            labels: {
              show: true,
              name: {
                color: "var(--muted)",
                fontSize: "12px",
                fontWeight: 800,
                offsetY: -4,
              },
              value: {
                color: "var(--foreground)",
                fontSize: "18px",
                fontWeight: 900,
                formatter: (value) => formatMetricSparklineValue(Number(value), currency),
                offsetY: 4,
              },
              total: {
                color: "var(--muted)",
                fontSize: "12px",
                fontWeight: 800,
                formatter: () => formatMetricSparklineValue(resolvedTotal, currency),
                label: totalLabel,
                show: true,
              },
            },
          },
        },
      },
      states: {
        hover: {
          filter: {
            type: "lighten",
          },
        },
      },
      tooltip: {
        enabled: true,
        theme: getApexTooltipTheme(),
        y: {
          formatter: (value) => formatMetricSparklineValue(value, currency),
        },
      },
    }),
    [colors, currency, labels, resolvedTotal, totalLabel],
  );

  return (
    <Card className={["ui-card", "metric-donut-card", className].filter(Boolean).join(" ")}>
      <Card.Content className="metric-donut-card__body">
        <div className="section-heading">
          <div className="section-subheading">
            {subtitle ? <span>{subtitle}</span> : null}
            <strong>{title}</strong>
          </div>
        </div>

        {hasData ? (
          <div className="metric-donut-card__content">
            <div
              aria-label={`Grafica circular de ${title}`}
              className="metric-donut-card__chart"
            >
              <ReactApexChart
                height={220}
                options={options}
                series={series}
                type="donut"
                width="100%"
              />
            </div>
            <div className="metric-donut-card__legend">
              {visibleSegments.map((segment) => (
                <div className="metric-donut-card__legend-item" key={segment.label}>
                  <span
                    aria-hidden="true"
                    className="metric-donut-card__dot"
                    style={{ background: segment.color ?? getMetricChartColor(segment.type ?? "business") }}
                  />
                  <span>{segment.label}</span>
                  <b>
                    {formatMetricSparklineValue(segment.value, currency)}
                    {resolvedTotal > 0 ? ` · ${Math.round((segment.value / resolvedTotal) * 100)}%` : ""}
                  </b>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="metric-donut-card__empty">{emptyMessage}</p>
        )}
      </Card.Content>
    </Card>
  );
}
