import type { ExpenseCategory, FixedExpense, Service } from "../../../shared/types/domain";

export const defaultCategories: ExpenseCategory[] = [
  { id: "cat_insumos", name: "Insumos", color: "#0f766e", isActive: true },
  { id: "cat_arriendo", name: "Arriendo", color: "#b45309", isActive: true },
  { id: "cat_servicios_publicos", name: "Servicios públicos", color: "#2563eb", isActive: true },
  { id: "cat_publicidad", name: "Publicidad", color: "#be123c", isActive: true },
  { id: "cat_mantenimiento", name: "Mantenimiento", color: "#7c3aed", isActive: true },
  { id: "cat_transporte", name: "Transporte", color: "#15803d", isActive: true },
  { id: "cat_capacitacion", name: "Capacitación", color: "#a16207", isActive: true },
  { id: "cat_equipos", name: "Equipos y herramientas", color: "#0369a1", isActive: true },
  { id: "cat_otros", name: "Otros", color: "#64748b", isActive: true },
];

export const defaultServices: Service[] = [
  {
    id: "svc_manicura_tradicional",
    name: "Manicura tradicional",
    defaultPrice: 35000,
    estimatedCost: 9000,
    isActive: true,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "svc_pedicura_tradicional",
    name: "Pedicura tradicional",
    defaultPrice: 45000,
    estimatedCost: 12000,
    isActive: true,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "svc_cepillado",
    name: "Cepillado",
    defaultPrice: 50000,
    estimatedCost: 10000,
    isActive: true,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "svc_maquillaje_social",
    name: "Maquillaje social",
    defaultPrice: 90000,
    estimatedCost: 18000,
    isActive: true,
    createdAt: "",
    updatedAt: "",
  },
];

export const defaultFixedExpenses: FixedExpense[] = [
  { id: "fe_arriendo", name: "Arriendo", amount: 0, isActive: true, createdAt: "", updatedAt: "" },
  { id: "fe_internet", name: "Internet", amount: 0, isActive: true, createdAt: "", updatedAt: "" },
  {
    id: "fe_servicios_publicos",
    name: "Servicios públicos",
    amount: 0,
    isActive: true,
    createdAt: "",
    updatedAt: "",
  },
];
