import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import {
  BottomSheet,
  ConfirmDialog,
  EmptyState,
  HelpDrawer,
  MetricCard,
  MoneyField,
  SkeletonCard,
  Tabs,
  ToastRegion,
} from "./ui";

describe("MetricCard", () => {
  it("muestra titulo y valor", () => {
    render(<MetricCard title="Ventas de hoy" value="$85.000" />);
    expect(screen.getByText("Ventas de hoy")).toBeTruthy();
    expect(screen.getByText("$85.000")).toBeTruthy();
  });

  it("muestra descripcion opcional", () => {
    render(<MetricCard title="Ventas" value="$85.000" description="3 servicios vendidos" />);
    expect(screen.getByText("3 servicios vendidos")).toBeTruthy();
  });

  it("muestra boton de ayuda cuando se pasa onHelp", () => {
    render(
      <MetricCard
        title="Ventas del mes"
        value="$500.000"
        helpLabel="Explicar concepto"
        onHelp={() => {}}
      />,
    );
    expect(screen.getByLabelText("Explicar concepto")).toBeTruthy();
  });

  it("no muestra boton de ayuda cuando no se pasa onHelp", () => {
    render(<MetricCard title="Ventas del mes" value="$500.000" />);
    expect(screen.queryByLabelText("Explicar concepto")).toBeNull();
  });

  it("aplica clase de tono correcta", () => {
    const { container } = render(<MetricCard title="Ganancia" value="$200.000" tone="profit" />);
    expect(container.querySelector(".metric-card--profit")).toBeTruthy();
  });
});

describe("EmptyState", () => {
  it("muestra titulo y mensaje", () => {
    render(
      <EmptyState
        title="Sin ventas hoy"
        message="Hoy todavia no hay ventas registradas."
      />,
    );
    expect(screen.getByText("Sin ventas hoy")).toBeTruthy();
    expect(screen.getByText("Hoy todavia no hay ventas registradas.")).toBeTruthy();
  });

  it("muestra boton de accion cuando se provee", () => {
    render(
      <EmptyState
        title="Sin servicios"
        message="Configura tus primeros servicios."
        actionLabel="Crear servicio"
        onAction={() => {}}
      />,
    );
    expect(screen.getByText("Crear servicio")).toBeTruthy();
  });

  it("no muestra boton si no se provee accion", () => {
    render(<EmptyState title="Sin datos" message="No hay informacion." />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("SkeletonCard", () => {
  it("renderiza tres lineas skeleton", () => {
    render(<SkeletonCard />);
    const skeletons = screen.getAllByTestId("Skeleton");
    expect(skeletons).toHaveLength(3);
  });
});

describe("MoneyField", () => {
  it("muestra label y campo numerico", () => {
    render(<MoneyField label="Valor" value={35000} onChange={() => {}} />);
    expect(screen.getByText("Valor")).toBeTruthy();
    expect(screen.getByPlaceholderText("Ej. 35000")).toBeTruthy();
  });

  it("muestra mensaje de error cuando es invalido", () => {
    render(
      <MoneyField
        label="Valor"
        value={0}
        onChange={() => {}}
        isInvalid
        errorMessage="El valor debe ser mayor a $0"
      />,
    );
    expect(screen.getByText("El valor debe ser mayor a $0")).toBeTruthy();
  });
});

describe("BottomSheet", () => {
  it("renderiza titulo y contenido cuando esta abierto", () => {
    render(
      <BottomSheet isOpen title="Registrar venta" onClose={() => {}}>
        <p>Contenido del formulario</p>
      </BottomSheet>,
    );
    expect(screen.getByText("Registrar venta")).toBeTruthy();
    expect(screen.getByText("Contenido del formulario")).toBeTruthy();
  });

  it("muestra eyebrow cuando se provee", () => {
    render(
      <BottomSheet isOpen title="Registrar venta" eyebrow="Accion rapida" onClose={() => {}}>
        <p>Contenido</p>
      </BottomSheet>,
    );
    expect(screen.getByText("Accion rapida")).toBeTruthy();
  });

  it("muestra footer cuando se provee", () => {
    render(
      <BottomSheet isOpen title="Registrar venta" footer={<button type="button">Guardar</button>} onClose={() => {}}>
        <p>Contenido</p>
      </BottomSheet>,
    );
    expect(screen.getByText("Guardar")).toBeTruthy();
  });
});

describe("ConfirmDialog", () => {
  it("renderiza titulo y mensaje de confirmacion", () => {
    render(
      <ConfirmDialog
        isOpen
        title="Eliminar venta"
        message="Segura que quieres eliminar esta venta de $35.000?"
        onCancel={() => {}}
        onConfirm={() => {}}
      />,
    );
    expect(screen.getByText("Eliminar venta")).toBeTruthy();
    expect(screen.getByText("Segura que quieres eliminar esta venta de $35.000?")).toBeTruthy();
    expect(screen.getByText("Cancelar")).toBeTruthy();
    expect(screen.getByText("Eliminar")).toBeTruthy();
  });

  it("usa confirmLabel personalizado", () => {
    render(
      <ConfirmDialog
        isOpen
        title="Desactivar servicio"
        message="Este servicio dejara de aparecer al registrar ventas."
        confirmLabel="Desactivar"
        onCancel={() => {}}
        onConfirm={() => {}}
      />,
    );
    expect(screen.getByText("Desactivar")).toBeTruthy();
  });
});

describe("HelpDrawer", () => {
  it("renderiza definicion, ejemplo y decision", () => {
    render(
      <HelpDrawer
        isOpen
        title="Punto de equilibrio"
        definition="Es la meta minima de ventas mensuales para cubrir todos tus gastos fijos."
        example="Si tus gastos fijos son $800.000 y vendes servicios con 70% de margen, necesitas vender $1.140.000 para no perder plata."
        decision="Saber si vas por buen camino o necesitas vender mas para no perder."
        onClose={() => {}}
      />,
    );
    expect(screen.getByText("Ayuda rápida")).toBeTruthy();
    expect(screen.getByText("Punto de equilibrio")).toBeTruthy();
    expect(
      screen.getByText("Es la meta minima de ventas mensuales para cubrir todos tus gastos fijos."),
    ).toBeTruthy();
    expect(screen.getByText("Te ayuda a decidir")).toBeTruthy();
  });
});

describe("ToastRegion", () => {
  it("no renderiza nada si toast es null", () => {
    const { container } = render(<ToastRegion toast={null} onDismiss={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it("renderiza mensaje de toast success", () => {
    render(
      <ToastRegion
        toast={{ kind: "success", message: "Listo! Manicura por $35.000 registrada." }}
        onDismiss={() => {}}
      />,
    );
    expect(screen.getByText("Listo! Manicura por $35.000 registrada.")).toBeTruthy();
    expect(screen.getByLabelText("Cerrar mensaje")).toBeTruthy();
    expect(screen.getByRole("status")).toBeTruthy();
  });

  it("renderiza toast con accion", () => {
    const onAction = () => {};
    render(
      <ToastRegion
        toast={{
          kind: "warning",
          message: "Movimiento eliminado.",
          actionLabel: "Deshacer",
          onAction,
        }}
        onDismiss={() => {}}
      />,
    );
    expect(screen.getByText("Movimiento eliminado.")).toBeTruthy();
    expect(screen.getByText("Deshacer")).toBeTruthy();
  });
});

describe("Tabs", () => {
  it("muestra la pestana activa y permite cambiarla", async () => {
    const user = userEvent.setup();
    let activeTab: "today" | "month" = "today";

    function TestTabs() {
      const [value, setValue] = useState(activeTab);
      activeTab = value;

      return (
        <Tabs
          ariaLabel="Rango del dashboard"
          items={[
            { id: "today", label: "Hoy", description: "Dia" },
            { id: "month", label: "Mes", description: "Actual" },
          ]}
          value={value}
          onChange={setValue}
        />
      );
    }

    render(<TestTabs />);

    expect(screen.getByRole("tab", { name: /Hoy/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /Mes/ })).toHaveAttribute("aria-selected", "false");

    await user.click(screen.getByRole("tab", { name: /Mes/ }));

    expect(activeTab).toBe("month");
    expect(screen.getByRole("tab", { name: /Mes/ })).toHaveAttribute("aria-selected", "true");
  });
});
