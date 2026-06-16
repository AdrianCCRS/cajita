export type MetricSparklinePoint = {
  label: string;
  value: number;
};

export type MetricSparklineType =
  | "income"
  | "expense"
  | "profit"
  | "withdrawal"
  | "personal_voucher"
  | "business";

const numberFormatter = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 0,
});

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function formatMetricSparklineValue(value: number, currency = false) {
  return currency ? currencyFormatter.format(value) : numberFormatter.format(value);
}

export function getMetricSparklineColor(type: MetricSparklineType = "business") {
  switch (type) {
    case "income":
      return "var(--income)";
    case "expense":
      return "var(--expense)";
    case "withdrawal":
      return "var(--salary)";
    case "personal_voucher":
      return "var(--vales)";
    case "profit":
      return "var(--app-accent, var(--business))";
    case "business":
    default:
      return "var(--business)";
  }
}

export function getMetricSparklineToneClass(type: MetricSparklineType = "business") {
  return `metric-sparkline-card--${type.replace("_", "-")}`;
}

export function getApexTooltipTheme() {
  if (typeof document === "undefined") {
    return "light";
  }

  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}
