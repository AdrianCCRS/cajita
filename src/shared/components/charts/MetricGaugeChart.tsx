import ReactApexChart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { useMemo } from "react";
import {
  getApexTooltipTheme,
  getMetricChartColor,
  type MetricChartType,
} from "./metricSparklineUtils";

export type MetricGaugeChartProps = {
  label: string;
  value: number;
  type?: MetricChartType;
  maxValue?: number;
  className?: string;
};

export function MetricGaugeChart({
  label,
  value,
  type = "business",
  maxValue = 100,
  className,
}: MetricGaugeChartProps) {
  const normalizedValue = Math.max(0, Math.min(value, maxValue));
  const percentage = maxValue > 0 ? Math.round((normalizedValue / maxValue) * 100) : 0;
  const color = getMetricChartColor(type);
  const series = useMemo(() => [percentage], [percentage]);
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
        type: "radialBar",
      },
      colors: [color],
      labels: [label],
      plotOptions: {
        radialBar: {
          endAngle: 135,
          hollow: {
            margin: 0,
            size: "62%",
          },
          startAngle: -135,
          track: {
            background: "var(--line)",
            strokeWidth: "92%",
          },
          dataLabels: {
            name: {
              color: "var(--muted)",
              fontSize: "12px",
              fontWeight: 800,
              offsetY: 32,
              show: true,
            },
            value: {
              color: "var(--foreground)",
              fontSize: "28px",
              fontWeight: 900,
              formatter: (chartValue) => `${Math.round(Number(chartValue))}%`,
              offsetY: -10,
              show: true,
            },
          },
        },
      },
      stroke: {
        lineCap: "round",
      },
      tooltip: {
        enabled: true,
        theme: getApexTooltipTheme(),
        y: {
          formatter: (chartValue) => `${Math.round(Number(chartValue))}%`,
        },
      },
    }),
    [color, label],
  );

  return (
    <div
      aria-label={`${label}: ${percentage}%`}
      className={["metric-gauge-chart", className].filter(Boolean).join(" ")}
    >
      <ReactApexChart
        height={170}
        options={options}
        series={series}
        type="radialBar"
        width="100%"
      />
    </div>
  );
}
