import { describe, expect, it } from "vitest";
import {
  authSchema,
  fixedExpenseSchema,
  onboardingBusinessSchema,
  positiveMoneySchema,
  rawMaterialSchema,
  salarySchema,
  serviceSchema,
  serviceMaterialSchema,
  transactionSchema,
} from "./schemas";

describe("positiveMoneySchema", () => {
  it("acepta numeros positivos", () => {
    expect(positiveMoneySchema.safeParse(50000).success).toBe(true);
    expect(positiveMoneySchema.safeParse(0.5).success).toBe(true);
  });

  it("rechaza cero", () => {
    const result = positiveMoneySchema.safeParse(0);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("El valor debe ser mayor a $0");
    }
  });

  it("rechaza numeros negativos", () => {
    const result = positiveMoneySchema.safeParse(-1000);
    expect(result.success).toBe(false);
  });

  it("coerce strings numericos validos", () => {
    const result = positiveMoneySchema.safeParse("35000");
    expect(result.success).toBe(true);
    expect(result.data).toBe(35000);
  });

  it("rechaza strings no numericos", () => {
    const result = positiveMoneySchema.safeParse("abc");
    expect(result.success).toBe(false);
  });
});

describe("authSchema", () => {
  it("acepta email y password validos", () => {
    const result = authSchema.safeParse({ email: "duena@spa.com", password: "123456" });
    expect(result.success).toBe(true);
  });

  it("rechaza emails invalidos", () => {
    const result = authSchema.safeParse({ email: "correo-malo", password: "123456" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Escribe un correo válido.");
    }
  });

  it("rechaza password menor a 6 caracteres", () => {
    const result = authSchema.safeParse({ email: "duena@spa.com", password: "12345" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("La contraseña debe tener al menos 6 caracteres.");
    }
  });

  it("trimea el email", () => {
    const result = authSchema.safeParse({ email: "  duena@spa.com  ", password: "123456" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("duena@spa.com");
    }
  });
});

describe("serviceSchema", () => {
  it("acepta un servicio valido", () => {
    const result = serviceSchema.safeParse({
      name: "Manicura",
      defaultPrice: 35000,
      estimatedCost: 9000,
    });
    expect(result.success).toBe(true);
  });

  it("rechaza nombre vacio o solo espacios", () => {
    expect(serviceSchema.safeParse({ name: "   ", defaultPrice: 35000, estimatedCost: 0 }).success).toBe(false);
    expect(serviceSchema.safeParse({ name: "", defaultPrice: 35000, estimatedCost: 0 }).success).toBe(false);
  });

  it("rechaza precio de venta igual a cero", () => {
    const result = serviceSchema.safeParse({ name: "Manicura", defaultPrice: 0, estimatedCost: 0 });
    expect(result.success).toBe(false);
  });

  it("acepta costo estimado en cero", () => {
    const result = serviceSchema.safeParse({ name: "Manicura", defaultPrice: 35000, estimatedCost: 0 });
    expect(result.success).toBe(true);
  });

  it("acepta modo de calculo automatico o manual", () => {
    expect(serviceSchema.safeParse({
      name: "Manicura",
      defaultPrice: 35000,
      estimatedCost: 0,
      costCalculationMode: "automatic",
    }).success).toBe(true);
    expect(serviceSchema.safeParse({
      name: "Manicura",
      defaultPrice: 35000,
      estimatedCost: 0,
      costCalculationMode: "other",
    }).success).toBe(false);
  });
});

describe("rawMaterialSchema", () => {
  it("acepta un insumo valido por volumen", () => {
    const result = rawMaterialSchema.safeParse({
      name: "Removedor",
      measurementType: "volume",
      purchaseQuantity: 1,
      purchaseUnit: "l",
      purchasePrice: 40000,
      stockQuantity: 1000,
      minimumStock: 100,
    });

    expect(result.success).toBe(true);
  });

  it("rechaza unidades incoherentes", () => {
    const result = rawMaterialSchema.safeParse({
      name: "Cera",
      measurementType: "weight",
      purchaseQuantity: 1,
      purchaseUnit: "l",
      purchasePrice: 80000,
    });

    expect(result.success).toBe(false);
  });

  it("rechaza precio de compra en cero", () => {
    const result = rawMaterialSchema.safeParse({
      name: "Removedor",
      measurementType: "volume",
      purchaseQuantity: 1,
      purchaseUnit: "l",
      purchasePrice: 0,
    });

    expect(result.success).toBe(false);
  });
});

describe("serviceMaterialSchema", () => {
  it("acepta asociar un insumo con rendimiento positivo", () => {
    expect(serviceMaterialSchema.safeParse({
      rawMaterialId: "raw_removedor",
      servicesCovered: 80,
    }).success).toBe(true);
  });

  it("rechaza rendimiento en cero", () => {
    expect(serviceMaterialSchema.safeParse({
      rawMaterialId: "raw_removedor",
      servicesCovered: 0,
    }).success).toBe(false);
  });
});

describe("fixedExpenseSchema", () => {
  it("acepta un gasto fijo valido", () => {
    const result = fixedExpenseSchema.safeParse({ name: "Arriendo", amount: 800000 });
    expect(result.success).toBe(true);
  });

  it("rechaza nombre vacio", () => {
    expect(fixedExpenseSchema.safeParse({ name: "", amount: 1000 }).success).toBe(false);
  });

  it("acepta monto en cero", () => {
    const result = fixedExpenseSchema.safeParse({ name: "Internet", amount: 0 });
    expect(result.success).toBe(true);
  });

  it("rechaza monto negativo", () => {
    expect(fixedExpenseSchema.safeParse({ name: "Internet", amount: -500 }).success).toBe(false);
  });
});

describe("salarySchema", () => {
  it("acepta salario positivo", () => {
    const result = salarySchema.safeParse({ salaryTarget: 1800000 });
    expect(result.success).toBe(true);
  });

  it("acepta salario en cero", () => {
    const result = salarySchema.safeParse({ salaryTarget: 0 });
    expect(result.success).toBe(true);
  });

  it("rechaza salario negativo", () => {
    expect(salarySchema.safeParse({ salaryTarget: -1000 }).success).toBe(false);
  });
});

describe("transactionSchema", () => {
  it("acepta transaccion valida", () => {
    const result = transactionSchema.safeParse({
      amount: 35000,
      date: "2026-06-10",
      paymentMethod: "cash",
    });
    expect(result.success).toBe(true);
  });

  it("acepta metodo de pago transfer", () => {
    expect(transactionSchema.safeParse({ amount: 50000, date: "2026-06-10", paymentMethod: "transfer" }).success).toBe(true);
  });

  it("acepta metodo de pago other", () => {
    expect(transactionSchema.safeParse({ amount: 50000, date: "2026-06-10", paymentMethod: "other" }).success).toBe(true);
  });

  it("rechaza metodo de pago invalido", () => {
    const result = transactionSchema.safeParse({ amount: 50000, date: "2026-06-10", paymentMethod: "credit_card" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Elige un método de pago.");
    }
  });

  it("rechaza monto cero", () => {
    expect(transactionSchema.safeParse({ amount: 0, date: "2026-06-10", paymentMethod: "cash" }).success).toBe(false);
  });

  it("rechaza fecha vacia", () => {
    expect(transactionSchema.safeParse({ amount: 35000, date: "", paymentMethod: "cash" }).success).toBe(false);
  });

  it("notas son opcionales", () => {
    const result = transactionSchema.safeParse({
      amount: 35000,
      date: "2026-06-10",
      paymentMethod: "cash",
      notes: "Cliente frecuente",
    });
    expect(result.success).toBe(true);
  });
});

describe("onboardingBusinessSchema", () => {
  it("acepta datos validos", () => {
    const result = onboardingBusinessSchema.safeParse({
      businessName: "Spa Bella",
      ownerSalaryTarget: 1800000,
    });
    expect(result.success).toBe(true);
  });

  it("rechaza nombre de negocio vacio", () => {
    expect(onboardingBusinessSchema.safeParse({ businessName: "", ownerSalaryTarget: 1000 }).success).toBe(false);
  });

  it("rechaza salario negativo", () => {
    expect(onboardingBusinessSchema.safeParse({ businessName: "Spa", ownerSalaryTarget: -100 }).success).toBe(false);
  });

  it("acepta salario en cero", () => {
    const result = onboardingBusinessSchema.safeParse({ businessName: "Spa Bella", ownerSalaryTarget: 0 });
    expect(result.success).toBe(true);
  });
});
