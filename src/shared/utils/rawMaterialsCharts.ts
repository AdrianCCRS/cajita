import type { RawMaterial, ServiceMaterial } from "../types/domain";

export type RawMaterialCostData = {
  labels: string[];
  series: number[];
  hasData: boolean;
};

export type RawMaterialUsageData = {
  labels: string[];
  series: number[];
  hasData: boolean;
};

/**
 * Agrupa los insumos por su aporte al costo total de los servicios.
 * Retorna los insumos ordenados de mayor a menor costo acumulado.
 */
export function getRawMaterialsByCostContribution(
  serviceMaterialsByServiceId: Record<string, ServiceMaterial[]>,
  rawMaterials: RawMaterial[],
): RawMaterialCostData {
  const costByMaterial = new Map<string, number>();

  Object.values(serviceMaterialsByServiceId).forEach((materials) => {
    materials.forEach((material) => {
      const current = costByMaterial.get(material.rawMaterialId) ?? 0;
      costByMaterial.set(material.rawMaterialId, current + material.totalCost);
    });
  });

  const entries = [...costByMaterial.entries()]
    .map(([rawMaterialId, totalCost]) => {
      const material = rawMaterials.find((rm) => rm.id === rawMaterialId);
      return {
        label: material?.name ?? rawMaterialId,
        value: totalCost,
      };
    })
    .filter((entry) => entry.value > 0)
    .sort((a, b) => b.value - a.value);

  return {
    hasData: entries.length > 0,
    labels: entries.map((entry) => entry.label),
    series: entries.map((entry) => entry.value),
  };
}

/**
 * Agrupa los insumos por cantidad de servicios en los que se usan.
 * Retorna los insumos ordenados de mayor a menor uso.
 */
export function getRawMaterialsByServiceCount(
  serviceMaterialsByServiceId: Record<string, ServiceMaterial[]>,
  rawMaterials: RawMaterial[],
): RawMaterialUsageData {
  const serviceCountByMaterial = new Map<string, number>();

  Object.values(serviceMaterialsByServiceId).forEach((materials) => {
    const countedInThisService = new Set<string>();

    materials.forEach((material) => {
      if (!countedInThisService.has(material.rawMaterialId)) {
        countedInThisService.add(material.rawMaterialId);
        const current = serviceCountByMaterial.get(material.rawMaterialId) ?? 0;
        serviceCountByMaterial.set(material.rawMaterialId, current + 1);
      }
    });
  });

  const entries = [...serviceCountByMaterial.entries()]
    .map(([rawMaterialId, serviceCount]) => {
      const material = rawMaterials.find((rm) => rm.id === rawMaterialId);
      return {
        label: material?.name ?? rawMaterialId,
        value: serviceCount,
      };
    })
    .filter((entry) => entry.value > 0)
    .sort((a, b) => b.value - a.value);

  return {
    hasData: entries.length > 0,
    labels: entries.map((entry) => entry.label),
    series: entries.map((entry) => entry.value),
  };
}
