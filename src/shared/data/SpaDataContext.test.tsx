import { beforeEach, describe, expect, it } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, forwardRef, useEffect, useImperativeHandle, type ReactNode } from "react";
import { AuthProvider } from "../auth/AuthContext";
import { SpaDataProvider, useSpaData } from "../data/SpaDataContext";
import type { PaymentMethod, Transaction } from "../types/domain";

const storageKey = "spa-control-demo-v1";

type TestActions = {
  addTransaction: ReturnType<typeof useSpaData>["addTransaction"];
  deleteTransaction: ReturnType<typeof useSpaData>["deleteTransaction"];
  restoreTransaction: ReturnType<typeof useSpaData>["restoreTransaction"];
  upsertService: ReturnType<typeof useSpaData>["upsertService"];
  deactivateService: ReturnType<typeof useSpaData>["deactivateService"];
  upsertRawMaterial: ReturnType<typeof useSpaData>["upsertRawMaterial"];
  deleteRawMaterial: ReturnType<typeof useSpaData>["deleteRawMaterial"];
  upsertServiceMaterial: ReturnType<typeof useSpaData>["upsertServiceMaterial"];
  deleteServiceMaterial: ReturnType<typeof useSpaData>["deleteServiceMaterial"];
  upsertFixedExpense: ReturnType<typeof useSpaData>["upsertFixedExpense"];
  updateSalaryTarget: ReturnType<typeof useSpaData>["updateSalaryTarget"];
  getState: () => ReturnType<typeof useSpaData>;
};

const TestHarness = forwardRef<TestActions, { children?: ReactNode }>(function TestHarness(_props, ref) {
  const data = useSpaData();

  useImperativeHandle(ref, () => ({
    addTransaction: data.addTransaction,
    deleteTransaction: data.deleteTransaction,
    restoreTransaction: data.restoreTransaction,
    upsertService: data.upsertService,
    deactivateService: data.deactivateService,
    upsertRawMaterial: data.upsertRawMaterial,
    deleteRawMaterial: data.deleteRawMaterial,
    upsertServiceMaterial: data.upsertServiceMaterial,
    deleteServiceMaterial: data.deleteServiceMaterial,
    upsertFixedExpense: data.upsertFixedExpense,
    updateSalaryTarget: data.updateSalaryTarget,
    getState: () => data,
  }), [data]);

  return null;
});

function renderWithProviders() {
  const ref = createRef<TestActions>();

  const result = render(
    <AuthProvider>
      <SpaDataProvider>
        <TestHarness ref={ref} />
      </SpaDataProvider>
    </AuthProvider>,
  );

  return { ...result, ref };
}

describe("SpaDataContext — modo local", () => {
  beforeEach(() => {
    window.localStorage.removeItem(storageKey);
  });
  it("inicia con estado por defecto (servicios, categorias, gastos fijos)", async () => {
    const { ref } = renderWithProviders();

    await waitFor(() => {
      expect(ref.current).toBeTruthy();
    });

    const state = ref.current!.getState();
    expect(state.isLoading).toBe(false);
    expect(state.source).toBe("local");

    expect(state.services.length).toBe(4);
    expect(state.services[0].name).toBe("Manicura tradicional");
    expect(state.categories.length).toBe(9);
    expect(state.personalExpenseCategories.length).toBe(7);
    expect(state.fixedExpenses.length).toBe(3);
    expect(state.transactions).toEqual([]);
    expect(state.financialSettings.salaryTarget).toBe(1800000);
    expect(state.business.name).toBe("Spa Bella");
  });

  it("registra una venta (income) y la agrega a transactions", async () => {
    const { ref } = renderWithProviders();

    await waitFor(() => {
      expect(ref.current).toBeTruthy();
    });

    let transaction: Transaction | undefined;
    await act(async () => {
      transaction = await ref.current!.addTransaction({
        type: "income",
        serviceId: "svc_manicura_tradicional",
        amount: 35000,
        paymentMethod: "cash" as PaymentMethod,
        date: "2026-06-10",
        notes: "Cliente frecuente",
      });
    });

    expect(transaction).toBeTruthy();
    expect(transaction!.type).toBe("income");
    expect(transaction!.amount).toBe(35000);
    expect(transaction!.serviceId).toBe("svc_manicura_tradicional");
    expect(transaction!.serviceName).toBe("Manicura tradicional");
    expect(transaction!.priceAtTime).toBe(35000);
    expect(transaction!.costAtTime).toBe(9000);
    expect(transaction!.notes).toBe("Cliente frecuente");

    const state = ref.current!.getState();
    expect(state.transactions.length).toBe(1);
    expect(state.transactions[0].id).toBe(transaction!.id);
  });

  it("registra un gasto (expense) con todos los datos", async () => {
    const { ref } = renderWithProviders();

    await waitFor(() => {
      expect(ref.current).toBeTruthy();
    });

    let transaction: Transaction | undefined;
    await act(async () => {
      transaction = await ref.current!.addTransaction({
        type: "expense",
        categoryId: "cat_insumos",
        amount: 15000,
        expenseType: "variable",
        paymentMethod: "transfer",
        date: "2026-06-10",
      });
    });

    expect(transaction!.type).toBe("expense");
    expect(transaction!.amount).toBe(15000);
    expect(transaction!.categoryId).toBe("cat_insumos");
    expect(transaction!.categoryName).toBe("Insumos");
    expect(transaction!.expenseType).toBe("variable");
    expect(transaction!.serviceId).toBeNull();
    expect(transaction!.serviceName).toBeNull();
  });

  it("registra un gasto con categoria desconocida usando 'Otros'", async () => {
    const { ref } = renderWithProviders();

    await waitFor(() => {
      expect(ref.current).toBeTruthy();
    });

    let transaction: Transaction | undefined;
    await act(async () => {
      transaction = await ref.current!.addTransaction({
        type: "expense",
        categoryId: "cat_inexistente",
        amount: 5000,
        expenseType: "extraordinary",
        paymentMethod: "cash",
        date: "2026-06-10",
      });
    });

    expect(transaction!.categoryName).toBe("Otros");
  });

  it("registra un retiro de la duena (withdrawal)", async () => {
    const { ref } = renderWithProviders();

    await waitFor(() => {
      expect(ref.current).toBeTruthy();
    });

    let transaction: Transaction | undefined;
    await act(async () => {
      transaction = await ref.current!.addTransaction({
        type: "withdrawal",
        amount: 500000,
        paymentMethod: "transfer",
        date: "2026-06-10",
        notes: "Salario semana 1",
      });
    });

    expect(transaction!.type).toBe("withdrawal");
    expect(transaction!.amount).toBe(500000);
    expect(transaction!.categoryId).toBeNull();
    expect(transaction!.categoryName).toBe("Salario de la dueña");
    expect(transaction!.notes).toBe("Salario semana 1");
  });

  it("registra un vale personal separado de gastos del negocio", async () => {
    const { ref } = renderWithProviders();

    await waitFor(() => {
      expect(ref.current).toBeTruthy();
    });

    let transaction: Transaction | undefined;
    await act(async () => {
      transaction = await ref.current!.addTransaction({
        type: "personal_voucher",
        personalCategoryId: "pec_alimentacion",
        amount: 10000,
        paymentMethod: "cash",
        date: "2026-06-10",
        notes: "Almuerzo",
      });
    });

    expect(transaction!.type).toBe("personal_voucher");
    expect(transaction!.amount).toBe(10000);
    expect(transaction!.categoryId).toBeNull();
    expect(transaction!.categoryName).toBeNull();
    expect(transaction!.personalCategoryId).toBe("pec_alimentacion");
    expect(transaction!.personalCategoryName).toBe("Alimentación");
    expect(transaction!.notes).toBe("Almuerzo");
  });

  it("lanza error al registrar venta con servicio sin precio", async () => {
    const { ref } = renderWithProviders();

    await waitFor(() => {
      expect(ref.current).toBeTruthy();
    });

    await expect(
      act(async () => {
        await ref.current!.addTransaction({
          type: "income",
          serviceId: "svc_inexistente",
          amount: 35000,
          paymentMethod: "cash",
          date: "2026-06-10",
        });
      }),
    ).rejects.toThrow("Servicio sin precio configurado");
  });

  it("elimina una transaccion correctamente", async () => {
    const { ref } = renderWithProviders();

    await waitFor(() => {
      expect(ref.current).toBeTruthy();
    });

    let transaction: Transaction | undefined;
    await act(async () => {
      transaction = await ref.current!.addTransaction({
        type: "income",
        serviceId: "svc_manicura_tradicional",
        amount: 35000,
        paymentMethod: "cash",
        date: "2026-06-10",
      });
    });

    expect(ref.current!.getState().transactions.length).toBe(1);

    await act(async () => {
      await ref.current!.deleteTransaction(transaction!.id);
    });

    expect(ref.current!.getState().transactions.length).toBe(0);
  });

  it("restaura una transaccion eliminada", async () => {
    const { ref } = renderWithProviders();

    await waitFor(() => {
      expect(ref.current).toBeTruthy();
    });

    let transaction: Transaction | undefined;
    await act(async () => {
      transaction = await ref.current!.addTransaction({
        type: "income",
        serviceId: "svc_manicura_tradicional",
        amount: 35000,
        paymentMethod: "cash",
        date: "2026-06-10",
      });
    });

    await act(async () => {
      await ref.current!.deleteTransaction(transaction!.id);
    });

    expect(ref.current!.getState().transactions.length).toBe(0);

    await act(async () => {
      await ref.current!.restoreTransaction(transaction!);
    });

    expect(ref.current!.getState().transactions.length).toBe(1);
  });

  it("crea un servicio nuevo", async () => {
    const { ref } = renderWithProviders();

    await waitFor(() => {
      expect(ref.current).toBeTruthy();
    });

    await act(async () => {
      await ref.current!.upsertService({
        name: "Depilacion facial",
        defaultPrice: 25000,
        estimatedCost: 3000,
      });
    });

    const state = ref.current!.getState();
    expect(state.services.length).toBe(5);
    const newService = state.services.find((s) => s.name === "Depilacion facial");
    expect(newService).toBeTruthy();
    expect(newService!.defaultPrice).toBe(25000);
    expect(newService!.isActive).toBe(true);
  });

  it("edita un servicio existente", async () => {
    const { ref } = renderWithProviders();

    await waitFor(() => {
      expect(ref.current).toBeTruthy();
    });

    await act(async () => {
      await ref.current!.upsertService({
        id: "svc_manicura_tradicional",
        name: "Manicura premium",
        defaultPrice: 40000,
        estimatedCost: 10000,
      });
    });

    const state = ref.current!.getState();
    expect(state.services.length).toBe(4);
    const updated = state.services.find((s) => s.id === "svc_manicura_tradicional");
    expect(updated!.name).toBe("Manicura premium");
    expect(updated!.defaultPrice).toBe(40000);
  });

  it("desactiva un servicio sin eliminarlo", async () => {
    const { ref } = renderWithProviders();

    await waitFor(() => {
      expect(ref.current).toBeTruthy();
    });

    await act(async () => {
      await ref.current!.deactivateService("svc_manicura_tradicional");
    });

    const state = ref.current!.getState();
    const deactivated = state.services.find((s) => s.id === "svc_manicura_tradicional");
    expect(deactivated).toBeTruthy();
    expect(deactivated!.isActive).toBe(false);
    expect(state.services.length).toBe(4);
  });

  it("crea un insumo convirtiendo a unidad base", async () => {
    const { ref } = renderWithProviders();

    await waitFor(() => {
      expect(ref.current).toBeTruthy();
    });

    await act(async () => {
      await ref.current!.upsertRawMaterial({
        name: "Removedor",
        measurementType: "volume",
        purchaseQuantity: 1,
        purchaseUnit: "l",
        purchasePrice: 40000,
      });
    });

    const material = ref.current!.getState().rawMaterials.find((item) => item.name === "Removedor");
    expect(material).toBeTruthy();
    expect(material!.baseQuantity).toBe(1000);
    expect(material!.baseUnit).toBe("ml");
    expect(material!.unitCost).toBe(40);
    expect(material!.stockQuantity).toBe(1000);
  });

  it("asocia un insumo a un servicio y recalcula el costo estimado", async () => {
    const { ref } = renderWithProviders();

    await waitFor(() => {
      expect(ref.current).toBeTruthy();
    });

    await act(async () => {
      await ref.current!.upsertRawMaterial({
        name: "Removedor",
        measurementType: "volume",
        purchaseQuantity: 1,
        purchaseUnit: "l",
        purchasePrice: 40000,
      });
    });

    const material = ref.current!.getState().rawMaterials.find((item) => item.name === "Removedor")!;

    await act(async () => {
      await ref.current!.upsertServiceMaterial("svc_manicura_tradicional", {
        rawMaterialId: material.id,
        servicesCovered: 80,
      });
    });

    const state = ref.current!.getState();
    const updatedService = state.services.find((item) => item.id === "svc_manicura_tradicional")!;
    expect(updatedService.costCalculationMode).toBe("automatic");
    expect(updatedService.estimatedCost).toBe(500);
    expect(state.serviceMaterialsByServiceId.svc_manicura_tradicional[0].servicesCovered).toBe(80);
    expect(state.serviceMaterialsByServiceId.svc_manicura_tradicional[0].quantityUsed).toBe(12.5);
    expect(state.serviceMaterialsByServiceId.svc_manicura_tradicional[0].totalCost).toBe(500);
  });

  it("actualiza costos automaticos y guarda snapshot al vender", async () => {
    const { ref } = renderWithProviders();

    await waitFor(() => {
      expect(ref.current).toBeTruthy();
    });

    await act(async () => {
      await ref.current!.upsertRawMaterial({
        name: "Removedor",
        measurementType: "volume",
        purchaseQuantity: 1,
        purchaseUnit: "l",
        purchasePrice: 40000,
      });
    });

    const material = ref.current!.getState().rawMaterials.find((item) => item.name === "Removedor")!;

    await act(async () => {
      await ref.current!.upsertServiceMaterial("svc_manicura_tradicional", {
        rawMaterialId: material.id,
        servicesCovered: 80,
      });
    });

    await act(async () => {
      await ref.current!.upsertRawMaterial({
        id: material.id,
        name: "Removedor",
        measurementType: "volume",
        purchaseQuantity: 1,
        purchaseUnit: "l",
        purchasePrice: 60000,
      });
    });

    const updatedService = ref.current!.getState().services.find((item) => item.id === "svc_manicura_tradicional")!;
    expect(updatedService.estimatedCost).toBe(750);

    let transaction: Transaction | undefined;
    await act(async () => {
      transaction = await ref.current!.addTransaction({
        type: "income",
        serviceId: "svc_manicura_tradicional",
        amount: 35000,
        paymentMethod: "cash" as PaymentMethod,
        date: "2026-06-10",
      });
    });

    expect(transaction!.costAtTime).toBe(750);
    expect(transaction!.materialsSnapshot?.[0].unitCostSnapshot).toBe(60);
    expect(transaction!.materialsSnapshot?.[0].servicesCovered).toBe(80);
    expect(transaction!.materialsSnapshot?.[0].quantityUsed).toBe(12.5);
    expect(transaction!.materialsSnapshot?.[0].totalCost).toBe(750);
    expect(ref.current!.getState().rawMaterialPriceHistoryByMaterialId[material.id]).toHaveLength(1);
  });

  it("crea un gasto fijo nuevo", async () => {
    const { ref } = renderWithProviders();

    await waitFor(() => {
      expect(ref.current).toBeTruthy();
    });

    await act(async () => {
      await ref.current!.upsertFixedExpense({
        name: "Seguro",
        amount: 95000,
      });
    });

    const state = ref.current!.getState();
    expect(state.fixedExpenses.length).toBe(4);
    const newExpense = state.fixedExpenses.find((e) => e.name === "Seguro");
    expect(newExpense).toBeTruthy();
    expect(newExpense!.amount).toBe(95000);
  });

  it("edita un gasto fijo existente", async () => {
    const { ref } = renderWithProviders();

    await waitFor(() => {
      expect(ref.current).toBeTruthy();
    });

    await act(async () => {
      await ref.current!.upsertFixedExpense({
        id: "fe_arriendo",
        name: "Arriendo local",
        amount: 850000,
      });
    });

    const state = ref.current!.getState();
    const updated = state.fixedExpenses.find((e) => e.id === "fe_arriendo");
    expect(updated!.name).toBe("Arriendo local");
    expect(updated!.amount).toBe(850000);
  });

  it("actualiza el salario objetivo", async () => {
    const { ref } = renderWithProviders();

    await waitFor(() => {
      expect(ref.current).toBeTruthy();
    });

    await act(async () => {
      await ref.current!.updateSalaryTarget(2500000);
    });

    const state = ref.current!.getState();
    expect(state.financialSettings.salaryTarget).toBe(2500000);
  });

  it("persiste multiples transacciones de distintos tipos", async () => {
    const { ref } = renderWithProviders();

    await waitFor(() => {
      expect(ref.current).toBeTruthy();
    });

    await act(async () => {
      await ref.current!.addTransaction({
        type: "income",
        serviceId: "svc_manicura_tradicional",
        amount: 35000,
        paymentMethod: "cash",
        date: "2026-06-10",
      });
    });

    await act(async () => {
      await ref.current!.addTransaction({
        type: "income",
        serviceId: "svc_cepillado",
        amount: 50000,
        paymentMethod: "transfer",
        date: "2026-06-10",
      });
    });

    await act(async () => {
      await ref.current!.addTransaction({
        type: "expense",
        categoryId: "cat_insumos",
        amount: 15000,
        expenseType: "variable",
        paymentMethod: "cash",
        date: "2026-06-10",
      });
    });

    await act(async () => {
      await ref.current!.addTransaction({
        type: "withdrawal",
        amount: 30000,
        paymentMethod: "transfer",
        date: "2026-06-10",
        notes: "Salario semanal",
      });
    });
    await act(async () => {
      await ref.current!.addTransaction({
        type: "personal_voucher",
        personalCategoryId: "pec_alimentacion",
        amount: 10000,
        paymentMethod: "cash",
        date: "2026-06-10",
      });
    });

    const state = ref.current!.getState();
    expect(state.transactions.length).toBe(5);

    const incomes = state.transactions.filter((t) => t.type === "income");
    const expenses = state.transactions.filter((t) => t.type === "expense");
    const withdrawals = state.transactions.filter((t) => t.type === "withdrawal");
    const personalVouchers = state.transactions.filter((t) => t.type === "personal_voucher");

    expect(incomes.length).toBe(2);
    expect(expenses.length).toBe(1);
    expect(withdrawals.length).toBe(1);
    expect(personalVouchers.length).toBe(1);
  });

  it("persiste estado en localStorage", async () => {
    const { ref } = renderWithProviders();

    await waitFor(() => {
      expect(ref.current).toBeTruthy();
    });

    await act(async () => {
      await ref.current!.updateSalaryTarget(3000000);
    });

    const stored = window.localStorage.getItem("spa-control-demo-v1");
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.financialSettings.salaryTarget).toBe(3000000);
  });

  it("los tres conceptos financieros se mantienen separados", async () => {
    const { ref } = renderWithProviders();

    await waitFor(() => {
      expect(ref.current).toBeTruthy();
    });

    await act(async () => {
      await ref.current!.addTransaction({
        type: "income",
        serviceId: "svc_manicura_tradicional",
        amount: 100000,
        paymentMethod: "cash",
        date: "2026-06-10",
      });
      await ref.current!.addTransaction({
        type: "expense",
        categoryId: "cat_insumos",
        amount: 30000,
        expenseType: "variable",
        paymentMethod: "cash",
        date: "2026-06-10",
      });
      await ref.current!.addTransaction({
        type: "withdrawal",
        amount: 40000,
        paymentMethod: "transfer",
        date: "2026-06-10",
      });
      await ref.current!.addTransaction({
        type: "personal_voucher",
        personalCategoryId: "pec_alimentacion",
        amount: 10000,
        paymentMethod: "cash",
        date: "2026-06-10",
      });
    });

    const state = ref.current!.getState();
    const incomes = state.transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const expenses = state.transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
    const withdrawals = state.transactions.filter((t) => t.type === "withdrawal").reduce((sum, t) => sum + t.amount, 0);
    const personalVouchers = state.transactions.filter((t) => t.type === "personal_voucher").reduce((sum, t) => sum + t.amount, 0);

    expect(incomes).toBe(100000);
    expect(expenses).toBe(30000);
    expect(withdrawals).toBe(40000);
    expect(personalVouchers).toBe(10000);

    const negocio = incomes - expenses;
    const ganancia = incomes - expenses - withdrawals - personalVouchers;

    expect(negocio).toBe(70000);
    expect(ganancia).toBe(20000);
  });
});
