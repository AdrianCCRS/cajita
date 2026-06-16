import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";
import React from "react";

vi.mock("react-apexcharts", () => ({
  default: ({
    options,
    type,
  }: {
    options?: {
      xaxis?: {
        categories?: unknown[];
        labels?: { formatter?: (value: string | number) => string };
      };
      yaxis?: {
        labels?: { formatter?: (value: string | number) => string };
      };
    };
    type?: string;
  }) => {
    const firstCategory = options?.xaxis?.categories?.[0] ?? "Manicura";
    const xAxisPreview = options?.xaxis?.labels?.formatter?.(100000) ?? "";
    const yAxisPreview = options?.yaxis?.labels?.formatter?.(String(firstCategory)) ?? "";

    return React.createElement("div", {
      "data-chart-type": type,
      "data-testid": "ApexChart",
      "data-xaxis-categories": JSON.stringify(options?.xaxis?.categories ?? []),
      "data-xaxis-preview": xAxisPreview,
      "data-yaxis-preview": yAxisPreview,
    });
  },
}));

vi.mock("@heroui/react", () => {
  const herouiOnlyProps = new Set([
    "isDisabled",
    "isIconOnly",
    "isInvalid",
    "isOpen",
    "isPending",
    "isRequired",
    "isRowHeader",
    "firstDayOfWeek",
    "focusedValue",
    "onOpenChange",
    "visibleDuration",
    "variant",
  ]);

  function cleanProps(props: Record<string, any>) {
    const domProps: Record<string, any> = {};

    Object.entries(props).forEach(([key, value]) => {
      if (key === "onPress") {
        domProps.onClick = value;
        return;
      }

      if (!herouiOnlyProps.has(key)) {
        domProps[key] = value;
      }
    });

    return domProps;
  }

  const createMock = (displayName: string, compound?: Record<string, React.ComponentType<any>>) => {
    const Comp = React.forwardRef<HTMLDivElement, { children?: React.ReactNode }>(({ children, ...props }, _ref) =>
      React.createElement("div", { ...cleanProps(props), "data-testid": displayName }, children),
    );
    Comp.displayName = displayName;
    if (compound) {
      Object.assign(Comp, compound);
    }
    return Comp;
  };
  const Button = React.forwardRef<HTMLButtonElement, { children?: React.ReactNode }>(({ children, ...props }, _ref) =>
    React.createElement("button", { type: "button", ...cleanProps(props), "data-testid": "Button" }, children),
  );
  Button.displayName = "Button";
  const Input = React.forwardRef<HTMLInputElement, { children?: React.ReactNode }>(({ children: _children, ...props }, _ref) =>
    React.createElement("input", { ...cleanProps(props), "data-testid": "Input" }),
  );
  Input.displayName = "Input";
  const Label = React.forwardRef<HTMLLabelElement, { children?: React.ReactNode }>(({ children, ...props }, _ref) =>
    React.createElement("label", { ...cleanProps(props), "data-testid": "Label" }, children),
  );
  Label.displayName = "Label";

  const Card = createMock("Card", {
    Header: createMock("Card.Header"),
    Title: createMock("Card.Title"),
    Description: createMock("Card.Description"),
    Content: createMock("Card.Content"),
    Footer: createMock("Card.Footer"),
  });

  const Drawer = createMock("Drawer", {
    Backdrop: createMock("Drawer.Backdrop"),
    Content: createMock("Drawer.Content"),
    Dialog: createMock("Drawer.Dialog"),
    Header: createMock("Drawer.Header"),
    Heading: createMock("Drawer.Heading"),
    Body: createMock("Drawer.Body"),
    Footer: createMock("Drawer.Footer"),
    Handle: createMock("Drawer.Handle"),
  });

  const Modal = createMock("Modal", {
    Backdrop: createMock("Modal.Backdrop"),
    Container: createMock("Modal.Container"),
    Dialog: createMock("Modal.Dialog"),
    Header: createMock("Modal.Header"),
    Heading: createMock("Modal.Heading"),
    Body: createMock("Modal.Body"),
    Footer: createMock("Modal.Footer"),
  });

  let calendarOnChange: ((date: any) => void) | undefined;
  let calendarOnFocusChange: ((date: any) => void) | undefined;

  const CalendarCell = React.forwardRef<HTMLButtonElement, { children?: React.ReactNode | ((props: any) => React.ReactNode); date?: any }>(
    ({ children, date, ...props }, _ref) =>
      React.createElement(
        "button",
        {
          type: "button",
          ...cleanProps(props),
          "data-date": date?.toString?.(),
          "data-testid": "Calendar.Cell",
          onClick: () => {
            calendarOnChange?.(date);
            calendarOnFocusChange?.(date);
          },
        },
        typeof children === "function"
          ? children({ formattedDate: String(date?.day ?? ""), isOutsideMonth: false })
          : children,
      ),
  );
  CalendarCell.displayName = "Calendar.Cell";

  const CalendarGrid = React.forwardRef<HTMLDivElement, { children?: React.ReactNode }>(({ children, ...props }, _ref) =>
    React.createElement("div", { ...cleanProps(props), "data-testid": "Calendar.Grid" }, children),
  );
  CalendarGrid.displayName = "Calendar.Grid";

  const CalendarGridHeader = React.forwardRef<HTMLDivElement, { children?: React.ReactNode | ((value: any) => React.ReactNode) }>(
    ({ children, ...props }, _ref) => {
    const weekdays = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];
      const headerRenderer = typeof children === "function" ? children : undefined;

      return React.createElement(
        "div",
        { ...cleanProps(props), "data-testid": "Calendar.GridHeader" },
        weekdays.map((day) => React.createElement("span", { key: day }, headerRenderer?.(day) ?? day)),
      );
    },
  );
  CalendarGridHeader.displayName = "Calendar.GridHeader";

  const CalendarGridBody = React.forwardRef<HTMLDivElement, { children?: React.ReactNode | ((value: any) => React.ReactNode) }>(
    ({ children, ...props }, _ref) => {
      const cellRenderer = typeof children === "function" ? children : undefined;
    const dates = Array.from({ length: 31 }, (_, index) => ({
      day: index + 1,
      month: 6,
      year: 2026,
      toDate: () => new Date(2026, 5, index + 1),
      toString: () => `2026-06-${String(index + 1).padStart(2, "0")}`,
    }));

    return React.createElement(
      "div",
        { ...cleanProps(props), "data-testid": "Calendar.GridBody" },
      dates.map((date) => React.createElement("span", { key: date.toString() }, cellRenderer?.(date))),
    );
    },
  );
  CalendarGridBody.displayName = "Calendar.GridBody";

  const CalendarRoot = React.forwardRef<HTMLDivElement, { children?: React.ReactNode; onChange?: (date: any) => void; onFocusChange?: (date: any) => void }>(
    ({ children, onChange, onFocusChange, ...props }, _ref) => {
      calendarOnChange = onChange;
      calendarOnFocusChange = onFocusChange;
      return React.createElement("div", { ...cleanProps(props), "data-testid": "Calendar" }, children);
    },
  );
  CalendarRoot.displayName = "Calendar";

  const Calendar = Object.assign(CalendarRoot, {
    Header: createMock("Calendar.Header"),
    Heading: React.forwardRef<HTMLHeadingElement, { children?: React.ReactNode }>(({ children, ...props }, _ref) =>
      React.createElement("h2", { ...cleanProps(props), "data-testid": "Calendar.Heading" }, children ?? "junio 2026"),
    ),
    NavButton: React.forwardRef<HTMLButtonElement, { children?: React.ReactNode }>(({ children, ...props }, _ref) =>
      React.createElement("button", { type: "button", ...cleanProps(props), "data-testid": "Calendar.NavButton" }, children),
    ),
    Grid: CalendarGrid,
    GridHeader: CalendarGridHeader,
    GridBody: CalendarGridBody,
    HeaderCell: createMock("Calendar.HeaderCell"),
    Cell: CalendarCell,
    CellIndicator: React.forwardRef<HTMLSpanElement, { children?: React.ReactNode; "data-testid"?: string }>(({ children, ...props }, _ref) =>
      React.createElement("span", { ...cleanProps(props), "data-testid": props["data-testid"] ?? "Calendar.CellIndicator" }, children),
    ),
  });

  const Table = createMock("Table", {
    Body: React.forwardRef<HTMLTableSectionElement, { children?: React.ReactNode }>(({ children, ...props }, _ref) =>
      React.createElement("tbody", cleanProps(props), children),
    ),
    Cell: React.forwardRef<HTMLTableCellElement, { children?: React.ReactNode }>(({ children, ...props }, _ref) =>
      React.createElement("td", cleanProps(props), children),
    ),
    Column: React.forwardRef<HTMLTableCellElement, { children?: React.ReactNode }>(({ children, ...props }, _ref) =>
      React.createElement("th", { ...cleanProps(props), scope: "col" }, children),
    ),
    Content: React.forwardRef<HTMLTableElement, { children?: React.ReactNode }>(({ children, ...props }, _ref) =>
      React.createElement("table", cleanProps(props), children),
    ),
    Header: React.forwardRef<HTMLTableSectionElement, { children?: React.ReactNode }>(({ children, ...props }, _ref) =>
      React.createElement("thead", cleanProps(props), React.createElement("tr", null, children)),
    ),
    Row: React.forwardRef<HTMLTableRowElement, { children?: React.ReactNode }>(({ children, ...props }, _ref) =>
      React.createElement("tr", cleanProps(props), children),
    ),
    ScrollContainer: createMock("Table.ScrollContainer"),
  });

  return {
    Button,
    Calendar,
    Card,
    Chip: createMock("Chip"),
    Drawer,
    FieldError: createMock("FieldError"),
    Input,
    Label,
    Modal,
    ProgressBar: createMock("ProgressBar"),
    Skeleton: createMock("Skeleton"),
    Table,
    TextArea: createMock("TextArea"),
    TextField: createMock("TextField"),
  };
});

vi.mock("recharts", () => {
  const chartOnlyProps = new Set(["dataKey", "formatter", "labelFormatter", "margin", "radius", "tickFormatter", "tickLine"]);
  function cleanChartProps(props: Record<string, any>) {
    return Object.fromEntries(Object.entries(props).filter(([key]) => !chartOnlyProps.has(key)));
  }

  const ChartMock = ({ children, data, ...props }: { children?: React.ReactNode; data?: unknown[] }) =>
    React.createElement("div", { ...cleanChartProps(props), "data-chart-items": JSON.stringify(data ?? []), "data-testid": "RechartsChart" }, children);
  const Passthrough = ({ children, ...props }: { children?: React.ReactNode }) =>
    React.createElement("div", cleanChartProps(props), children);

  return {
    Bar: Passthrough,
    BarChart: ChartMock,
    ResponsiveContainer: Passthrough,
    Tooltip: Passthrough,
    XAxis: Passthrough,
    YAxis: Passthrough,
  };
});
