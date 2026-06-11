import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";
import React from "react";

vi.mock("@heroui/react", () => {
  const herouiOnlyProps = new Set([
    "isDisabled",
    "isIconOnly",
    "isInvalid",
    "isOpen",
    "isPending",
    "isRequired",
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

  return {
    Button: createMock("Button"),
    Card,
    Chip: createMock("Chip"),
    Drawer,
    FieldError: createMock("FieldError"),
    Input: createMock("Input"),
    Label: createMock("Label"),
    Modal,
    ProgressBar: createMock("ProgressBar"),
    Skeleton: createMock("Skeleton"),
    TextArea: createMock("TextArea"),
    TextField: createMock("TextField"),
  };
});
