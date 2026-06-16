import { z } from "zod";
import { getBaseUnit, isPurchaseUnitValidForMeasurement } from "../utils/rawMaterials";

const moneySchema = z.coerce
  .number({ invalid_type_error: "Escribe un valor válido." })
  .finite("Escribe un valor válido.")
  .min(0, "El valor no puede ser negativo.");

export const positiveMoneySchema = moneySchema.gt(0, "El valor debe ser mayor a $0");

export const authSchema = z.object({
  email: z.string().trim().email("Escribe un correo válido."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
});

export const serviceSchema = z.object({
  name: z.string().trim().min(1, "Escribe el nombre del servicio."),
  defaultPrice: positiveMoneySchema,
  estimatedCost: moneySchema,
  costCalculationMode: z.enum(["automatic", "manual"]).optional(),
});

export const rawMaterialSchema = z.object({
  name: z.string().trim().min(1, "Escribe el nombre del insumo."),
  measurementType: z.enum(["volume", "weight", "unit"], {
    errorMap: () => ({ message: "Elige cómo se mide el insumo." }),
  }),
  purchaseQuantity: positiveMoneySchema,
  purchaseUnit: z.enum(["ml", "l", "g", "kg", "unit"], {
    errorMap: () => ({ message: "Elige una unidad válida." }),
  }),
  purchasePrice: positiveMoneySchema,
  stockQuantity: moneySchema.optional(),
  minimumStock: moneySchema.optional(),
}).superRefine((data, context) => {
  if (!isPurchaseUnitValidForMeasurement(data.measurementType, data.purchaseUnit)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "La unidad no coincide con el tipo de insumo.",
      path: ["purchaseUnit"],
    });
  }
});

export const serviceMaterialSchema = z.object({
  rawMaterialId: z.string().trim().min(1, "Elige un insumo."),
  servicesCovered: positiveMoneySchema,
});

export function getRawMaterialBaseUnit(measurementType: z.infer<typeof rawMaterialSchema>["measurementType"]) {
  return getBaseUnit(measurementType);
}

export const fixedExpenseSchema = z.object({
  name: z.string().trim().min(1, "Escribe el nombre del gasto."),
  amount: moneySchema,
  categoryId: z.string().trim().optional(),
  dueDay: z.coerce.number().int("El día debe ser un número entero.").min(1, "El día debe estar entre 1 y 31.").max(31, "El día debe estar entre 1 y 31.").optional(),
});

export const salarySchema = z.object({
  salaryTarget: moneySchema,
});

export const transactionSchema = z.object({
  amount: positiveMoneySchema,
  date: z.string().trim().min(1, "Elige una fecha."),
  paymentMethod: z.enum(["cash", "transfer", "other"], {
    errorMap: () => ({ message: "Elige un método de pago." }),
  }),
  notes: z.string().optional(),
});

export const onboardingBusinessSchema = z.object({
  businessName: z.string().trim().min(1, "Escribe el nombre del negocio."),
  ownerSalaryTarget: moneySchema,
});
