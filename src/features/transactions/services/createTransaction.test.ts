import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Firestore } from "firebase/firestore";
import { editPersonalVoucher, registerExpense, registerIncome, registerPersonalVoucher, registerWithdrawal } from "./createTransaction";

const { addDocMock, setDocMock, timestamp } = vi.hoisted(() => ({
  addDocMock: vi.fn(),
  setDocMock: vi.fn(),
  timestamp: { kind: "serverTimestamp" },
}));

vi.mock("firebase/firestore", () => {
  function makeRef(type: "document" | "collection", path: string) {
    return {
      type,
      path,
      id: path.split("/").pop() ?? "",
      parent: null,
      firestore: null,
      converter: null,
    };
  }

  return {
    addDoc: addDocMock,
    setDoc: setDocMock,
    serverTimestamp: vi.fn(() => timestamp),
    collection: vi.fn((parent: unknown, path: string) => {
      const parentPath = (parent as { path?: string })?.path ?? "";
      return makeRef("collection", parentPath ? `${parentPath}/${path}` : path);
    }),
    doc: vi.fn((parent: unknown, ...segments: string[]) => {
      const parentPath = (parent as { path?: string; type?: string })?.path ?? "";
      const parentType = (parent as { type?: string })?.type;
      if (parentType === "collection" || parentType === "document") {
        return makeRef("document", `${parentPath}/${segments.join("/")}`);
      }
      return makeRef("document", segments.join("/"));
    }),
  };
});

function fakeDb() {
  return {} as Firestore;
}

const baseValidInput = {
  db: fakeDb(),
  uid: "user-abc-123",
  amount: 35000,
  date: "2026-06-10",
  paymentMethod: "cash" as const,
};

beforeEach(() => {
  addDocMock.mockReset();
  setDocMock.mockReset();
  addDocMock.mockResolvedValue({ id: "tx-001" });
  setDocMock.mockResolvedValue(undefined);
});

describe("registerIncome", () => {
  it("guarda una venta con snapshots historicos del servicio", async () => {
    const transaction = await registerIncome({
      ...baseValidInput,
      serviceId: "svc-1",
      serviceName: "Manicura",
      priceAtTime: 35000,
      costAtTime: 9000,
      notes: "Cliente frecuente",
    });

    expect(addDocMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "users/user-abc-123/businesses/main/transactions",
        type: "collection",
      }),
      expect.objectContaining({
        type: "income",
        amount: 35000,
        date: "2026-06-10",
        serviceId: "svc-1",
        serviceName: "Manicura",
        priceAtTime: 35000,
        costAtTime: 9000,
        categoryId: null,
        categoryName: null,
        expenseType: null,
        paymentMethod: "cash",
        notes: "Cliente frecuente",
        createdAt: timestamp,
        updatedAt: timestamp,
      }),
    );
    expect(transaction).toEqual(expect.objectContaining({
      id: "tx-001",
      type: "income",
      serviceName: "Manicura",
      priceAtTime: 35000,
      costAtTime: 9000,
    }));
  });

  it("lanza error si falta serviceId", async () => {
    await expect(
      registerIncome({
        ...baseValidInput,
        serviceId: "",
        serviceName: "Manicura",
        priceAtTime: 35000,
        costAtTime: 9000,
      }),
    ).rejects.toThrow("Selecciona un servicio para registrar la venta.");
  });

  it("lanza error si falta serviceName", async () => {
    await expect(
      registerIncome({
        ...baseValidInput,
        serviceId: "svc-1",
        serviceName: "",
        priceAtTime: 35000,
        costAtTime: 9000,
      }),
    ).rejects.toThrow("Selecciona un servicio para registrar la venta.");
  });

  it("lanza error si el precio es cero o negativo", async () => {
    await expect(
      registerIncome({
        ...baseValidInput,
        serviceId: "svc-1",
        serviceName: "Manicura",
        priceAtTime: 0,
        costAtTime: 9000,
      }),
    ).rejects.toThrow("El precio del servicio debe ser mayor a $0.");
  });

  it("lanza error si el costo es negativo", async () => {
    await expect(
      registerIncome({
        ...baseValidInput,
        serviceId: "svc-1",
        serviceName: "Manicura",
        priceAtTime: 35000,
        costAtTime: -500,
      }),
    ).rejects.toThrow("El costo del servicio no puede ser negativo.");
  });

  it("lanza error si el monto es cero o negativo", async () => {
    await expect(
      registerIncome({
        ...baseValidInput,
        amount: 0,
        serviceId: "svc-1",
        serviceName: "Manicura",
        priceAtTime: 35000,
        costAtTime: 9000,
      }),
    ).rejects.toThrow("El valor debe ser mayor a $0");
  });

  it("lanza error si falta la fecha", async () => {
    await expect(
      registerIncome({
        ...baseValidInput,
        date: "",
        serviceId: "svc-1",
        serviceName: "Manicura",
        priceAtTime: 35000,
        costAtTime: 9000,
      }),
    ).rejects.toThrow("Selecciona una fecha.");
  });

  it("lanza error si el metodo de pago es invalido", async () => {
    await expect(
      registerIncome({
        ...baseValidInput,
        paymentMethod: "credit_card" as never,
        serviceId: "svc-1",
        serviceName: "Manicura",
        priceAtTime: 35000,
        costAtTime: 9000,
      }),
    ).rejects.toThrow("Selecciona un método de pago válido.");
  });
});

describe("registerExpense", () => {
  const validExpenseInput = {
    ...baseValidInput,
    categoryId: "cat_insumos",
    categoryName: "Insumos",
    expenseType: "variable" as const,
  };

  it("guarda un gasto con snapshot historico de categoria", async () => {
    const transaction = await registerExpense(validExpenseInput);

    expect(addDocMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "users/user-abc-123/businesses/main/transactions",
      }),
      expect.objectContaining({
        type: "expense",
        amount: 35000,
        serviceId: null,
        serviceName: null,
        priceAtTime: null,
        costAtTime: null,
        categoryId: "cat_insumos",
        categoryName: "Insumos",
        expenseType: "variable",
        paymentMethod: "cash",
      }),
    );
    expect(transaction).toEqual(expect.objectContaining({
      id: "tx-001",
      type: "expense",
      categoryName: "Insumos",
    }));
  });

  it("lanza error si falta categoryId", async () => {
    await expect(
      registerExpense({ ...validExpenseInput, categoryId: "", categoryName: "Insumos" }),
    ).rejects.toThrow("Selecciona una categoría para registrar el gasto.");
  });

  it("lanza error si falta categoryName", async () => {
    await expect(
      registerExpense({ ...validExpenseInput, categoryId: "cat_insumos", categoryName: "" }),
    ).rejects.toThrow("Selecciona una categoría para registrar el gasto.");
  });

  it("lanza error si expenseType es invalido", async () => {
    await expect(
      registerExpense({
        ...validExpenseInput,
        expenseType: "unknown" as never,
      }),
    ).rejects.toThrow("Selecciona un tipo de gasto válido.");
  });

  it("lanza error si el monto es cero", async () => {
    await expect(
      registerExpense({ ...validExpenseInput, amount: 0 }),
    ).rejects.toThrow("El valor debe ser mayor a $0");
  });
});

describe("registerWithdrawal", () => {
  it("guarda un retiro separado de los gastos del negocio", async () => {
    const transaction = await registerWithdrawal({ ...baseValidInput, amount: 120000 });

    expect(addDocMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "users/user-abc-123/businesses/main/transactions",
      }),
      expect.objectContaining({
        type: "withdrawal",
        amount: 120000,
        serviceId: null,
        serviceName: null,
        priceAtTime: null,
        costAtTime: null,
        categoryId: null,
        categoryName: "Salario de la dueña",
        expenseType: null,
        paymentMethod: "cash",
      }),
    );
    expect(transaction).toEqual(expect.objectContaining({
      id: "tx-001",
      type: "withdrawal",
      categoryName: "Salario de la dueña",
    }));
  });

  it("lanza error si el monto es cero", async () => {
    await expect(
      registerWithdrawal({ ...baseValidInput, amount: 0 }),
    ).rejects.toThrow("El valor debe ser mayor a $0");
  });

  it("lanza error si falta fecha", async () => {
    await expect(
      registerWithdrawal({ ...baseValidInput, date: "" }),
    ).rejects.toThrow("Selecciona una fecha.");
  });

  it("lanza error si falta uid", async () => {
    await expect(
      registerWithdrawal({ ...baseValidInput, uid: "" }),
    ).rejects.toThrow("No se pudo registrar el movimiento porque falta el usuario.");
  });
});

describe("registerPersonalVoucher", () => {
  it("guarda un vale personal separado de gastos del negocio", async () => {
    const transaction = await registerPersonalVoucher({
      ...baseValidInput,
      amount: 10000,
      personalCategoryId: "pec_alimentacion",
      personalCategoryName: "Alimentación",
      notes: "Almuerzo",
    });

    expect(addDocMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "users/user-abc-123/businesses/main/transactions",
      }),
      expect.objectContaining({
        type: "personal_voucher",
        amount: 10000,
        serviceId: null,
        serviceName: null,
        priceAtTime: null,
        costAtTime: null,
        categoryId: null,
        categoryName: null,
        personalCategoryId: "pec_alimentacion",
        personalCategoryName: "Alimentación",
        expenseType: null,
        paymentMethod: "cash",
        notes: "Almuerzo",
      }),
    );
    expect(transaction).toEqual(expect.objectContaining({
      id: "tx-001",
      type: "personal_voucher",
      personalCategoryName: "Alimentación",
    }));
  });

  it("lanza error si el monto es cero", async () => {
    await expect(
      registerPersonalVoucher({
        ...baseValidInput,
        amount: 0,
        personalCategoryId: "pec_alimentacion",
        personalCategoryName: "Alimentación",
      }),
    ).rejects.toThrow("El valor debe ser mayor a $0");
  });

  it("lanza error si falta categoria personal", async () => {
    await expect(
      registerPersonalVoucher({
        ...baseValidInput,
        personalCategoryId: "",
        personalCategoryName: "Alimentación",
      }),
    ).rejects.toThrow("Elige una categoría personal para registrar el vale.");
  });
});

describe("editPersonalVoucher", () => {
  it("edita un vale personal manteniendo el tipo y separacion de gastos", async () => {
    const transaction = await editPersonalVoucher({
      ...baseValidInput,
      transactionId: "tx-voucher",
      amount: 22000,
      personalCategoryId: "pec_salud",
      personalCategoryName: "Salud",
      notes: "Medicina",
    });

    expect(setDocMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "users/user-abc-123/businesses/main/transactions/tx-voucher",
      }),
      expect.objectContaining({
        type: "personal_voucher",
        amount: 22000,
        categoryId: null,
        categoryName: null,
        personalCategoryId: "pec_salud",
        personalCategoryName: "Salud",
        expenseType: null,
      }),
      { merge: true },
    );
    expect(transaction).toEqual(expect.objectContaining({
      id: "tx-voucher",
      type: "personal_voucher",
      personalCategoryName: "Salud",
    }));
  });

  it("lanza error si falta transactionId", async () => {
    await expect(
      editPersonalVoucher({
        ...baseValidInput,
        transactionId: "",
        personalCategoryId: "pec_salud",
        personalCategoryName: "Salud",
      }),
    ).rejects.toThrow("No se pudo editar el vale porque falta el movimiento.");
  });
});
