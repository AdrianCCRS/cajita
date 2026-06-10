import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";
import React from "react";

vi.mock("@heroui/react", () => {
  const createMock = (displayName: string, compound?: Record<string, unknown>) => {
    const Comp = React.forwardRef(({ children, ...props }: Record<string, unknown>, ref: unknown) =>
      React.createElement("div", { ...props, ref, "data-testid": displayName }, children),
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
    CardContent: createMock("CardContent"),
    CardFooter: createMock("CardFooter"),
    CardHeader: createMock("CardHeader"),
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
