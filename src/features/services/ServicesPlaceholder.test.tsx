import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RawMaterial, Service, ServiceMaterial } from "../../shared/types/domain";
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

const rawMaterials: RawMaterial[] = [
  {
    id: "raw-1",
    name: "Removedor",
    measurementType: "volume",
    purchaseQuantity: 1,
    purchaseUnit: "l",
    baseQuantity: 1000,
    baseUnit: "ml",
    purchasePrice: 40000,
    unitCost: 40,
    stockQuantity: 1000,
    minimumStock: null,
    isActive: true,
    createdAt: "2026-06-10T12:00:00.000Z",
    updatedAt: "2026-06-10T12:00:00.000Z",
  },
  {
    id: "raw-2",
    name: "Algodón",
    measurementType: "weight",
    purchaseQuantity: 500,
    purchaseUnit: "g",
    baseQuantity: 500,
    baseUnit: "g",
    purchasePrice: 12000,
    unitCost: 24,
    stockQuantity: 500,
    minimumStock: 50,
    isActive: false,
    createdAt: "2026-06-10T12:00:00.000Z",
    updatedAt: "2026-06-10T12:00:00.000Z",
  },
];

const serviceMaterialsByServiceId: Record<string, ServiceMaterial[]> = {};
const serviceMaterialsWithRemovedor: Record<string, ServiceMaterial[]> = {
  "svc-1": [
    {
      id: "raw-1",
      rawMaterialId: "raw-1",
      rawMaterialName: "Removedor",
      servicesCovered: 80,
      quantityUsed: 12.5,
      unitType: "ml",
      unitCostSnapshot: 40,
      totalCost: 500,
      createdAt: "2026-06-10T12:00:00.000Z",
      updatedAt: "2026-06-10T12:00:00.000Z",
    },
  ],
};

describe("ServicesPlaceholder", () => {
  const upsertService = vi.fn();
  const deactivateService = vi.fn();
  const upsertRawMaterial = vi.fn();
  const deleteRawMaterial = vi.fn();
  const upsertServiceMaterial = vi.fn();
  const deleteServiceMaterial = vi.fn();

  beforeEach(() => {
    upsertService.mockReset();
    deactivateService.mockReset();
    upsertRawMaterial.mockReset();
    deleteRawMaterial.mockReset();
    upsertServiceMaterial.mockReset();
    deleteServiceMaterial.mockReset();
    spaDataMock.mockReturnValue({
      services,
      rawMaterials,
      serviceMaterialsByServiceId,
      upsertService,
      deactivateService,
      upsertRawMaterial,
      deleteRawMaterial,
      upsertServiceMaterial,
      deleteServiceMaterial,
    });
  });

  it("muestra los servicios en una tabla compacta", () => {
    render(<ServicesPlaceholder />);

    expect(screen.getByText("Servicios configurados")).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: /^Servicio/ })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: /^Precio/ })).toBeTruthy();
    expect(screen.getByText("Manicura tradicional")).toBeTruthy();
    expect(screen.getByText("Cepillado")).toBeTruthy();
    expect(screen.getByText("1 activos de 2")).toBeTruthy();
    expect(screen.getByLabelText("Agregar insumo a Manicura tradicional")).toBeTruthy();
    expect(screen.queryByText(/Ganancia real/)).toBeNull();
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
      costCalculationMode: "manual",
    });
  });

  it("muestra insumos en una pestaña separada", async () => {
    const user = userEvent.setup();
    render(<ServicesPlaceholder />);

    await user.click(screen.getByText("Insumos"));

    expect(screen.getByText("Insumos configurados")).toBeTruthy();
    expect(screen.getByText("Removedor")).toBeTruthy();
    expect(screen.getAllByText(/stock/).length).toBeGreaterThan(0);
  });

  it("permite buscar, filtrar y reactivar insumos", async () => {
    const user = userEvent.setup();
    render(<ServicesPlaceholder />);

    await user.click(screen.getByText("Insumos"));

    expect(screen.getByRole("heading", { name: "Servicios" })).toBeTruthy();

    await user.type(screen.getByLabelText("Buscar insumo"), "algo");

    expect(screen.getByText("Algodón")).toBeTruthy();
    expect(screen.queryByText("Removedor")).toBeNull();

    await user.click(screen.getByText("Inactivos"));
    await user.click(screen.getByLabelText("Reactivar Algodón"));

    expect(upsertRawMaterial).toHaveBeenCalledWith({
      id: "raw-2",
      name: "Algodón",
      measurementType: "weight",
      purchaseQuantity: 500,
      purchaseUnit: "g",
      purchasePrice: 12000,
      stockQuantity: 500,
      minimumStock: 50,
    });
  });

  it("asocia un insumo al servicio desde un selector buscable", async () => {
    const user = userEvent.setup();
    render(<ServicesPlaceholder />);

    await user.click(screen.getByLabelText("Agregar insumo a Manicura tradicional"));
    await user.type(screen.getByLabelText("Buscar insumo para el servicio"), "Removedor");
    await user.click(screen.getByRole("option", { name: /Removedor/ }));
    await user.type(screen.getByLabelText("¿Para cuántos servicios alcanza?"), "80");
    await user.click(screen.getByLabelText("Agregar insumo al servicio"));

    expect(upsertServiceMaterial).toHaveBeenCalledWith("svc-1", {
      rawMaterialId: "raw-1",
      servicesCovered: 80,
    });
  });

  it("muestra insumos asociados separados del formulario y suma el costo total", async () => {
    const user = userEvent.setup();
    spaDataMock.mockReturnValue({
      services,
      rawMaterials,
      serviceMaterialsByServiceId: serviceMaterialsWithRemovedor,
      upsertService,
      deactivateService,
      upsertRawMaterial,
      deleteRawMaterial,
      upsertServiceMaterial,
      deleteServiceMaterial,
    });

    render(<ServicesPlaceholder />);

    await user.click(screen.getByLabelText("Insumos de Manicura tradicional"));

    expect(screen.getByText("Costo total por insumos")).toBeTruthy();
    expect(screen.getAllByText("$ 500").length).toBeGreaterThan(0);
    expect(screen.getByText("Insumos del servicio")).toBeTruthy();
    expect(screen.queryByText("Ganancia estimada")).toBeNull();
    expect(screen.queryByText("Agregar insumo")).toBeNull();
  });

  it("no permite valores negativos ni cero en cuantos servicios alcanza", async () => {
    const user = userEvent.setup();
    render(<ServicesPlaceholder />);

    await user.click(screen.getByLabelText("Agregar insumo a Manicura tradicional"));
    const servicesCoveredInput = screen.getByLabelText("¿Para cuántos servicios alcanza?");

    fireEvent.change(servicesCoveredInput, { target: { value: "-80" } });

    expect(servicesCoveredInput).toHaveValue(null);

    fireEvent.change(servicesCoveredInput, { target: { value: "0" } });

    expect(servicesCoveredInput).toHaveValue(null);
  });
});
