import { describe, expect, it } from "vitest";
import type { RawMaterial, ServiceMaterial } from "../types/domain";
import {
  buildRawMaterialCalculation,
  buildServiceMaterial,
  calculateServiceEstimatedCost,
  convertToBaseQuantity,
  getBaseUnit,
  getPurchaseUnits,
} from "./rawMaterials";

const rawMaterial: RawMaterial = {
  id: "raw_removedor",
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
};

describe("rawMaterials helpers", () => {
  it("convierte litros y kilos a unidades base", () => {
    expect(convertToBaseQuantity(1, "l")).toBe(1000);
    expect(convertToBaseQuantity(2, "kg")).toBe(2000);
    expect(convertToBaseQuantity(500, "ml")).toBe(500);
    expect(convertToBaseQuantity(12, "unit")).toBe(12);
  });

  it("calcula baseQuantity, baseUnit y unitCost", () => {
    expect(buildRawMaterialCalculation({
      measurementType: "volume",
      purchaseQuantity: 1,
      purchaseUnit: "l",
      purchasePrice: 40000,
    })).toEqual({
      baseQuantity: 1000,
      baseUnit: "ml",
      unitCost: 40,
    });
  });

  it("rechaza unidades incoherentes con el tipo de medicion", () => {
    expect(() => buildRawMaterialCalculation({
      measurementType: "weight",
      purchaseQuantity: 1,
      purchaseUnit: "l",
      purchasePrice: 40000,
    })).toThrow("La unidad no coincide con el tipo de insumo.");
  });

  it("expone unidades validas por tipo", () => {
    expect(getBaseUnit("weight")).toBe("g");
    expect(getPurchaseUnits("unit")).toEqual(["unit"]);
  });

  it("calcula el material usado por servicio y el total del servicio", () => {
    const material = {
      id: "raw_removedor",
      ...buildServiceMaterial(rawMaterial, 80),
      createdAt: "2026-06-10T12:00:00.000Z",
      updatedAt: "2026-06-10T12:00:00.000Z",
    } satisfies ServiceMaterial;

    expect(material.servicesCovered).toBe(80);
    expect(material.quantityUsed).toBe(12.5);
    expect(material.totalCost).toBe(500);
    expect(calculateServiceEstimatedCost([material])).toBe(500);
  });
});
