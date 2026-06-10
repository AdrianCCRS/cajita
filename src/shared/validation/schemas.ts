import { z } from "zod";

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
});

export const fixedExpenseSchema = z.object({
  name: z.string().trim().min(1, "Escribe el nombre del gasto."),
  amount: moneySchema,
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
