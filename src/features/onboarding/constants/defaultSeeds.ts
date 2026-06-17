import type { ExpenseCategory, FixedExpense, PersonalExpenseCategory, Service } from "../../../shared/types/domain";

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

export const defaultPersonalExpenseCategories: PersonalExpenseCategory[] = [
  { id: "pec_alimentacion", name: "Alimentación", color: "#F59E0B", isActive: true },
  { id: "pec_transporte_personal", name: "Transporte personal", color: "#3B82F6", isActive: true },
  { id: "pec_familia", name: "Familia", color: "#EC4899", isActive: true },
  { id: "pec_salud", name: "Salud", color: "#10B981", isActive: true },
  { id: "pec_compras_personales", name: "Compras personales", color: "#8B5CF6", isActive: true },
  { id: "pec_hogar", name: "Hogar", color: "#6366F1", isActive: true },
  { id: "pec_otros", name: "Otros", color: "#6B7280", isActive: true },
];

export const defaultServices: Service[] = [
  {
    id: "svc_manicura_tradicional",
    name: "Manicura tradicional",
    defaultPrice: 35000,
    estimatedCost: 0,
    costCalculationMode: "automatic",
    isActive: true,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "svc_pedicura_tradicional",
    name: "Pedicura tradicional",
    defaultPrice: 45000,
    estimatedCost: 0,
    costCalculationMode: "automatic",
    isActive: true,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "svc_cepillado",
    name: "Cepillado",
    defaultPrice: 50000,
    estimatedCost: 0,
    costCalculationMode: "automatic",
    isActive: true,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "svc_maquillaje_social",
    name: "Maquillaje social",
    defaultPrice: 90000,
    estimatedCost: 0,
    costCalculationMode: "automatic",
    isActive: true,
    createdAt: "",
    updatedAt: "",
  },
];

export const defaultFixedExpenses: FixedExpense[] = [
  { id: "fe_arriendo", name: "Arriendo", amount: 0, categoryId: "cat_arriendo", categoryName: "Arriendo", dueDay: 5, isActive: true, createdAt: "", updatedAt: "" },
  { id: "fe_internet", name: "Internet", amount: 0, categoryId: "cat_servicios_publicos", categoryName: "Servicios públicos", dueDay: 10, isActive: true, createdAt: "", updatedAt: "" },
  {
    id: "fe_servicios_publicos",
    name: "Servicios públicos",
    amount: 0,
    categoryId: "cat_servicios",
    categoryName: "Servicios",
    dueDay: 15,
    isActive: true,
    createdAt: "",
    updatedAt: "",
  },
];
