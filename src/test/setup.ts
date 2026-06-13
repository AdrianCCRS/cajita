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
    "onOpenChange",
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
