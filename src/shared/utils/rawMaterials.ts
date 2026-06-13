import type { BaseUnit, MeasurementType, PurchaseUnit, RawMaterial, ServiceMaterial } from "../types/domain";

export function getBaseUnit(measurementType: MeasurementType): BaseUnit {
  if (measurementType === "volume") {
    return "ml";
  }

  if (measurementType === "weight") {
    return "g";
  }

  return "unit";
}

export function getPurchaseUnits(measurementType: MeasurementType): PurchaseUnit[] {
  if (measurementType === "volume") {
    return ["ml", "l"];
  }

  if (measurementType === "weight") {
    return ["g", "kg"];
  }

  return ["unit"];
}

export function isPurchaseUnitValidForMeasurement(
  measurementType: MeasurementType,
  purchaseUnit: PurchaseUnit,
) {
  return getPurchaseUnits(measurementType).includes(purchaseUnit);
}

export function convertToBaseQuantity(
  purchaseQuantity: number,
  purchaseUnit: PurchaseUnit,
): number {
  if (purchaseUnit === "l" || purchaseUnit === "kg") {
    return purchaseQuantity * 1000;
  }

  return purchaseQuantity;
}

export function calculateUnitCost(purchasePrice: number, baseQuantity: number): number {
  if (baseQuantity <= 0) {
    return 0;
  }

  return purchasePrice / baseQuantity;
}

export function buildRawMaterialCalculation({
  measurementType,
  purchaseQuantity,
  purchaseUnit,
  purchasePrice,
}: {
  measurementType: MeasurementType;
  purchaseQuantity: number;
  purchaseUnit: PurchaseUnit;
  purchasePrice: number;
}) {
  if (!isPurchaseUnitValidForMeasurement(measurementType, purchaseUnit)) {
    throw new Error("La unidad no coincide con el tipo de insumo.");
  }

  const baseQuantity = convertToBaseQuantity(purchaseQuantity, purchaseUnit);
  return {
    baseQuantity,
    baseUnit: getBaseUnit(measurementType),
    unitCost: calculateUnitCost(purchasePrice, baseQuantity),
  };
}

export function calculateQuantityUsedPerService(rawMaterial: RawMaterial, servicesCovered: number): number {
  if (servicesCovered <= 0) {
    return 0;
  }

  return rawMaterial.baseQuantity / servicesCovered;
}

export function calculateMaterialCostPerService(rawMaterial: RawMaterial, servicesCovered: number): number {
  if (servicesCovered <= 0) {
    return 0;
  }

  return rawMaterial.purchasePrice / servicesCovered;
}

export function buildServiceMaterial(rawMaterial: RawMaterial, servicesCovered: number): Omit<ServiceMaterial, "id" | "createdAt" | "updatedAt"> {
  const quantityUsed = calculateQuantityUsedPerService(rawMaterial, servicesCovered);

  return {
    rawMaterialId: rawMaterial.id,
    rawMaterialName: rawMaterial.name,
    servicesCovered,
    quantityUsed,
    unitType: rawMaterial.baseUnit,
    unitCostSnapshot: rawMaterial.unitCost,
    totalCost: calculateMaterialCostPerService(rawMaterial, servicesCovered),
  };
}

export function calculateServiceEstimatedCost(materials: ServiceMaterial[]): number {
  return materials.reduce((total, material) => total + material.totalCost, 0);
}
