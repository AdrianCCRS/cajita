import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Service } from "../../shared/types/domain";
import { ServicesPlaceholder } from "./ServicesPlaceholder";

const { spaDataMock } = vi.hoisted(() => ({
  spaDataMock: vi.fn(),
}));

vi.mock("../../shared/data/SpaDataContext", () => ({
  useSpaData: spaDataMock,
}));

const services: Service[] = [
  {
    id: "svc-1",
    name: "Manicura tradicional",
    defaultPrice: 35000,
    estimatedCost: 9000,
    isActive: true,
    createdAt: "2026-06-10T12:00:00.000Z",
    updatedAt: "2026-06-10T12:00:00.000Z",
  },
  {
    id: "svc-2",
    name: "Cepillado",
    defaultPrice: 50000,
    estimatedCost: 12000,
    isActive: false,
    createdAt: "2026-06-10T12:00:00.000Z",
    updatedAt: "2026-06-10T12:00:00.000Z",
  },
];

describe("ServicesPlaceholder", () => {
  const upsertService = vi.fn();
  const deactivateService = vi.fn();

  beforeEach(() => {
    upsertService.mockReset();
    deactivateService.mockReset();
    spaDataMock.mockReturnValue({
      services,
      upsertService,
      deactivateService,
    });
  });

  it("muestra los servicios en una tabla compacta", () => {
    render(<ServicesPlaceholder />);

    expect(screen.getByText("Servicios configurados")).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Servicio" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Precio" })).toBeTruthy();
    expect(screen.getByText("Manicura tradicional")).toBeTruthy();
    expect(screen.getByText("Cepillado")).toBeTruthy();
    expect(screen.getByText("1 activos de 2")).toBeTruthy();
  });

  it("abre un bottom sheet para crear un servicio", async () => {
    const user = userEvent.setup();
    render(<ServicesPlaceholder />);

    await user.click(screen.getByText("Nuevo servicio"));

    expect(screen.getByText("Catálogo de servicios")).toBeTruthy();
    expect(screen.getByText("Nombre del servicio")).toBeTruthy();
    expect(screen.getByText("Crear servicio")).toBeTruthy();
  });

  it("abre un bottom sheet para editar sin usar una tarjeta de formulario superior", async () => {
    const user = userEvent.setup();
    render(<ServicesPlaceholder />);

    expect(screen.queryByText("Agregar servicio")).toBeNull();

    await user.click(screen.getByLabelText("Editar Manicura tradicional"));

    expect(screen.getByText("Editar servicio")).toBeTruthy();
    expect(screen.getByText("Guardar cambios")).toBeTruthy();
  });

  it("permite reactivar un servicio inactivo", async () => {
    const user = userEvent.setup();
    render(<ServicesPlaceholder />);

    await user.click(screen.getByLabelText("Reactivar Cepillado"));

    expect(upsertService).toHaveBeenCalledWith({
      id: "svc-2",
      name: "Cepillado",
      defaultPrice: 50000,
      estimatedCost: 12000,
    });
  });
});
