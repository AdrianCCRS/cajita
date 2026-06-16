import { describe, expect, it } from "vitest";
import type { Transaction } from "../types/domain";
import {
  getDailyIncomeChartData,
  getExpensesByCategoryChartData,
  getHistoricalMonthlyMetricSparklineData,
  getMoneyCompositionChartData,
  getMonthlyMetricSparklineData,
  getServiceContributionChartData,
  getServicesByCountChartData,
  getServicesByRevenueChartData,
  getWeeklyIncomeExpenseChartData,
} from "./dashboardCharts";

const baseTransaction = {
  paymentMethod: "cash",
  createdAt: "2026-06-10T12:00:00.000Z",
  updatedAt: "2026-06-10T12:00:00.000Z",
} as const;

function transaction(input: Pick<Transaction, "id" | "type" | "amount" | "date"> & Partial<Pick<Transaction, "serviceName" | "categoryName" | "serviceId" | "categoryId">>): Transaction {
  return {
    ...baseTransaction,
    ...input,
  };
}

describe("getWeeklyIncomeExpenseChartData", () => {
  it("agrupa ventas y gastos por semana del mes", () => {
    const result = getWeeklyIncomeExpenseChartData(
      [
        transaction({ id: "income-1", type: "income", amount: 35000, date: "2026-06-01" }),
        transaction({ id: "income-2", type: "income", amount: 50000, date: "2026-06-08" }),
        transaction({ id: "expense-1", type: "expense", amount: 12000, date: "2026-06-14" }),
        transaction({ id: "expense-2", type: "expense", amount: 18000, date: "2026-06-30" }),
      ],
      2026,
      6,
    );

    expect(result.categories).toEqual(["Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5"]);
    expect(result.income).toEqual([35000, 50000, 0, 0, 0]);
    expect(result.expenses).toEqual([0, 12000, 0, 0, 18000]);
    expect(result.hasMovements).toBe(true);
  });

  it("excluye retiros de los gastos del negocio", () => {
    const result = getWeeklyIncomeExpenseChartData(
      [
        transaction({ id: "income-1", type: "income", amount: 100000, date: "2026-06-02" }),
        transaction({ id: "withdrawal-1", type: "withdrawal", amount: 60000, date: "2026-06-02" }),
      ],
      2026,
      6,
    );

    expect(result.income).toEqual([100000, 0, 0, 0, 0]);
    expect(result.expenses).toEqual([0, 0, 0, 0, 0]);
  });

  it("retorna semanas vacias en cero cuando no hay movimientos", () => {
    const result = getWeeklyIncomeExpenseChartData([], 2026, 2);

    expect(result.categories).toEqual(["Sem 1", "Sem 2", "Sem 3", "Sem 4"]);
    expect(result.income).toEqual([0, 0, 0, 0]);
    expect(result.expenses).toEqual([0, 0, 0, 0]);
    expect(result.hasMovements).toBe(false);
  });

  it("filtra solo el mes solicitado", () => {
    const result = getWeeklyIncomeExpenseChartData(
      [
        transaction({ id: "may-income", type: "income", amount: 90000, date: "2026-05-31" }),
        transaction({ id: "june-income", type: "income", amount: 40000, date: "2026-06-01" }),
        transaction({ id: "july-expense", type: "expense", amount: 20000, date: "2026-07-01" }),
      ],
      2026,
      6,
    );

    expect(result.income).toEqual([40000, 0, 0, 0, 0]);
    expect(result.expenses).toEqual([0, 0, 0, 0, 0]);
  });

  it("respeta fechas al inicio y fin del mes", () => {
    const result = getWeeklyIncomeExpenseChartData(
      [
        transaction({ id: "start", type: "income", amount: 10000, date: "2026-06-01" }),
        transaction({ id: "end", type: "expense", amount: 8000, date: "2026-06-30" }),
      ],
      2026,
      6,
    );

    expect(result.income[0]).toBe(10000);
    expect(result.expenses[4]).toBe(8000);
  });
});

describe("getExpensesByCategoryChartData", () => {
  it("agrupa gastos por categoria ordenados de mayor a menor", () => {
    const result = getExpensesByCategoryChartData(
      [
        transaction({ id: "e1", type: "expense", amount: 40000, date: "2026-06-05", categoryName: "Insumos", categoryId: "cat-1" }),
        transaction({ id: "e2", type: "expense", amount: 80000, date: "2026-06-10", categoryName: "Arriendo", categoryId: "cat-2" }),
        transaction({ id: "e3", type: "expense", amount: 30000, date: "2026-06-15", categoryName: "Insumos", categoryId: "cat-1" }),
      ],
      2026,
      6,
    );

    expect(result.labels).toEqual(["Arriendo", "Insumos"]);
    expect(result.series).toEqual([80000, 70000]);
    expect(result.hasData).toBe(true);
  });

  it("filtra solo el mes actual", () => {
    const result = getExpensesByCategoryChartData(
      [
        transaction({ id: "e1", type: "expense", amount: 50000, date: "2026-05-15", categoryName: "Insumos", categoryId: "cat-1" }),
        transaction({ id: "e2", type: "expense", amount: 30000, date: "2026-06-10", categoryName: "Insumos", categoryId: "cat-1" }),
      ],
      2026,
      6,
    );

    expect(result.series).toEqual([30000]);
  });

  it("retorna hasData false sin gastos", () => {
    const result = getExpensesByCategoryChartData([], 2026, 6);

    expect(result.labels).toEqual([]);
    expect(result.series).toEqual([]);
    expect(result.hasData).toBe(false);
  });

  it("excluye gastos sin categoryName", () => {
    const result = getExpensesByCategoryChartData(
      [
        transaction({ id: "e1", type: "expense", amount: 50000, date: "2026-06-05", categoryName: "Insumos", categoryId: "cat-1" }),
        transaction({ id: "e2", type: "expense", amount: 30000, date: "2026-06-10" }),
      ],
      2026,
      6,
    );

    expect(result.labels).toEqual(["Insumos"]);
    expect(result.series).toEqual([50000]);
  });

  it("agrupa gastos historicos cuando no se pasa periodo", () => {
    const result = getExpensesByCategoryChartData([
      transaction({ id: "e1", type: "expense", amount: 50000, date: "2026-05-15", categoryName: "Insumos", categoryId: "cat-1" }),
      transaction({ id: "e2", type: "expense", amount: 30000, date: "2026-06-10", categoryName: "Insumos", categoryId: "cat-1" }),
    ]);

    expect(result.series).toEqual([80000]);
  });
});

describe("getServicesByCountChartData", () => {
  it("agrupa servicios por cantidad de ventas ordenados de mayor a menor", () => {
    const result = getServicesByCountChartData(
      [
        transaction({ id: "s1", type: "income", amount: 35000, date: "2026-06-01", serviceName: "Manicura", serviceId: "svc-1" }),
        transaction({ id: "s2", type: "income", amount: 35000, date: "2026-06-05", serviceName: "Manicura", serviceId: "svc-1" }),
        transaction({ id: "s3", type: "income", amount: 80000, date: "2026-06-03", serviceName: "Cabello", serviceId: "svc-2" }),
      ],
      2026,
      6,
    );

    expect(result.labels).toEqual(["Manicura", "Cabello"]);
    expect(result.series).toEqual([2, 1]);
    expect(result.hasData).toBe(true);
  });

  it("retorna hasData false sin ventas", () => {
    const result = getServicesByCountChartData([], 2026, 6);

    expect(result.labels).toEqual([]);
    expect(result.series).toEqual([]);
    expect(result.hasData).toBe(false);
  });

  it("filtra solo el mes actual", () => {
    const result = getServicesByCountChartData(
      [
        transaction({ id: "s1", type: "income", amount: 35000, date: "2026-05-20", serviceName: "Manicura", serviceId: "svc-1" }),
        transaction({ id: "s2", type: "income", amount: 35000, date: "2026-06-01", serviceName: "Manicura", serviceId: "svc-1" }),
      ],
      2026,
      6,
    );

    expect(result.series).toEqual([1]);
  });

  it("agrupa servicios historicos por cantidad cuando no se pasa periodo", () => {
    const result = getServicesByCountChartData([
      transaction({ id: "s1", type: "income", amount: 35000, date: "2026-05-20", serviceName: "Manicura", serviceId: "svc-1" }),
      transaction({ id: "s2", type: "income", amount: 35000, date: "2026-06-01", serviceName: "Manicura", serviceId: "svc-1" }),
    ]);

    expect(result.series).toEqual([2]);
  });
});

describe("getServicesByRevenueChartData", () => {
  it("agrupa servicios por dinero generado ordenados de mayor a menor", () => {
    const result = getServicesByRevenueChartData(
      [
        transaction({ id: "s1", type: "income", amount: 35000, date: "2026-06-01", serviceName: "Manicura", serviceId: "svc-1" }),
        transaction({ id: "s2", type: "income", amount: 45000, date: "2026-06-05", serviceName: "Manicura", serviceId: "svc-1" }),
        transaction({ id: "s3", type: "income", amount: 100000, date: "2026-06-03", serviceName: "Cabello", serviceId: "svc-2" }),
      ],
      2026,
      6,
    );

    expect(result.labels).toEqual(["Cabello", "Manicura"]);
    expect(result.series).toEqual([100000, 80000]);
    expect(result.hasData).toBe(true);
  });

  it("retorna hasData false sin ventas", () => {
    const result = getServicesByRevenueChartData([], 2026, 6);

    expect(result.hasData).toBe(false);
  });

  it("agrupa servicios historicos por ingresos cuando no se pasa periodo", () => {
    const result = getServicesByRevenueChartData([
      transaction({ id: "s1", type: "income", amount: 35000, date: "2026-05-20", serviceName: "Manicura", serviceId: "svc-1" }),
      transaction({ id: "s2", type: "income", amount: 45000, date: "2026-06-01", serviceName: "Manicura", serviceId: "svc-1" }),
    ]);

    expect(result.series).toEqual([80000]);
  });
});

describe("getDailyIncomeChartData", () => {
  it("acumula ventas por dia del mes", () => {
    const result = getDailyIncomeChartData(
      [
        transaction({ id: "s1", type: "income", amount: 35000, date: "2026-06-01" }),
        transaction({ id: "s2", type: "income", amount: 50000, date: "2026-06-01" }),
        transaction({ id: "s3", type: "income", amount: 80000, date: "2026-06-15" }),
      ],
      2026,
      6,
    );

    expect(result.categories.length).toBeGreaterThanOrEqual(1);
    expect(result.series[0]).toBe(85000);
    expect(result.hasData).toBe(true);
  });

  it("muestra el mes completo para meses pasados", () => {
    const result = getDailyIncomeChartData(
      [
        transaction({ id: "s1", type: "income", amount: 30000, date: "2026-01-15" }),
        transaction({ id: "s2", type: "income", amount: 20000, date: "2026-01-31" }),
      ],
      2026,
      1,
    );

    expect(result.categories.length).toBe(31);
    expect(result.series[14]).toBe(30000);
    expect(result.series[30]).toBe(20000);
    expect(result.hasData).toBe(true);
  });

  it("retorna hasData false sin ventas", () => {
    const result = getDailyIncomeChartData([], 2026, 6);

    expect(result.hasData).toBe(false);
  });

  it("filtra solo el mes actual", () => {
    const result = getDailyIncomeChartData(
      [
        transaction({ id: "s1", type: "income", amount: 50000, date: "2026-05-15" }),
        transaction({ id: "s2", type: "income", amount: 30000, date: "2026-06-10" }),
      ],
      2026,
      6,
    );

    expect(result.series[9]).toBe(30000);
  });
});

describe("getMonthlyMetricSparklineData", () => {
  it("agrupa ventas, gastos y dinero del negocio por dia", () => {
    const transactions = [
      transaction({ id: "i1", type: "income", amount: 100000, date: "2026-01-01" }),
      transaction({ id: "e1", type: "expense", amount: 30000, date: "2026-01-01" }),
      transaction({ id: "i2", type: "income", amount: 50000, date: "2026-01-31" }),
    ];

    const income = getMonthlyMetricSparklineData(transactions, 2026, 1, "income");
    const expenses = getMonthlyMetricSparklineData(transactions, 2026, 1, "expense");
    const business = getMonthlyMetricSparklineData(transactions, 2026, 1, "business");

    expect(income).toHaveLength(31);
    expect(income[0]).toEqual({ label: "1", value: 100000 });
    expect(expenses[0]).toEqual({ label: "1", value: 30000 });
    expect(business[0]).toEqual({ label: "1", value: 70000 });
    expect(business[30]).toEqual({ label: "31", value: 50000 });
  });

  it("separa salario y vales de los gastos del negocio", () => {
    const transactions = [
      transaction({ id: "i1", type: "income", amount: 200000, date: "2026-01-10" }),
      transaction({ id: "e1", type: "expense", amount: 40000, date: "2026-01-10" }),
      transaction({ id: "w1", type: "withdrawal", amount: 50000, date: "2026-01-10" }),
      transaction({ id: "v1", type: "personal_voucher", amount: 20000, date: "2026-01-10" }),
    ];

    const expenses = getMonthlyMetricSparklineData(transactions, 2026, 1, "expense");
    const ownerTotal = getMonthlyMetricSparklineData(transactions, 2026, 1, "ownerTotal");
    const profit = getMonthlyMetricSparklineData(transactions, 2026, 1, "profit");

    expect(expenses[9].value).toBe(40000);
    expect(ownerTotal[9].value).toBe(70000);
    expect(profit[9].value).toBe(90000);
  });
});

describe("getHistoricalMonthlyMetricSparklineData", () => {
  it("agrupa historico por mes y conserva meses intermedios en cero", () => {
    const result = getHistoricalMonthlyMetricSparklineData(
      [
        transaction({ id: "i1", type: "income", amount: 100000, date: "2026-01-15" }),
        transaction({ id: "i2", type: "income", amount: 50000, date: "2026-03-01" }),
      ],
      "income",
    );

    expect(result).toEqual([
      { label: "01/26", value: 100000 },
      { label: "02/26", value: 0 },
      { label: "03/26", value: 50000 },
    ]);
  });

  it("retorna arreglo vacio cuando no hay movimientos", () => {
    expect(getHistoricalMonthlyMetricSparklineData([], "income")).toEqual([]);
  });

  it("retorna arreglo vacio cuando no hay movimientos de la metrica solicitada", () => {
    const result = getHistoricalMonthlyMetricSparklineData(
      [
        transaction({ id: "e1", type: "expense", amount: 30000, date: "2026-01-15" }),
        transaction({ id: "w1", type: "withdrawal", amount: 50000, date: "2026-02-01" }),
      ],
      "income",
    );

    expect(result).toEqual([]);
  });

  it("ignora fechas invalidas en el historico", () => {
    const result = getHistoricalMonthlyMetricSparklineData(
      [
        transaction({ id: "bad", type: "income", amount: 999999, date: "no-date" }),
        transaction({ id: "good", type: "income", amount: 50000, date: "2026-03-01" }),
      ],
      "income",
    );

    expect(result).toEqual([{ label: "03/26", value: 50000 }]);
  });
});

describe("getMoneyCompositionChartData", () => {
  it("separa gastos, salario, vales y ganancia despues de salario", () => {
    const result = getMoneyCompositionChartData({
      income: 200000,
      expenses: 40000,
      withdrawals: 50000,
      personalVouchers: 20000,
    });

    expect(result.total).toBe(200000);
    expect(result.hasData).toBe(true);
    expect(result.segments).toEqual([
      { label: "Gastos del negocio", value: 40000, type: "expense" },
      { label: "Salario pagado", value: 50000, type: "withdrawal" },
      { label: "Vales personales", value: 20000, type: "personal_voucher" },
      { label: "Ganancia después de salario", value: 90000, type: "profit" },
    ]);
  });

  it("no crea segmento negativo cuando la ganancia despues de salario esta en rojo", () => {
    const result = getMoneyCompositionChartData({
      income: 100000,
      expenses: 70000,
      withdrawals: 50000,
      personalVouchers: 10000,
    });

    expect(result.segments).toEqual([
      { label: "Gastos del negocio", value: 70000, type: "expense" },
      { label: "Salario pagado", value: 50000, type: "withdrawal" },
      { label: "Vales personales", value: 10000, type: "personal_voucher" },
    ]);
  });
});

describe("getServiceContributionChartData", () => {
  it("agrupa ventas por servicio y calcula el total del periodo", () => {
    const result = getServiceContributionChartData(
      [
        transaction({ id: "s1", type: "income", amount: 35000, date: "2026-06-01", serviceName: "Manicura" }),
        transaction({ id: "s2", type: "income", amount: 65000, date: "2026-06-02", serviceName: "Manicura" }),
        transaction({ id: "s3", type: "income", amount: 100000, date: "2026-06-03", serviceName: "Cabello" }),
        transaction({ id: "e1", type: "expense", amount: 50000, date: "2026-06-03", categoryName: "Insumos" }),
      ],
      2026,
      6,
    );

    expect(result.total).toBe(200000);
    expect(result.hasData).toBe(true);
    expect(result.segments.map((segment) => [segment.label, segment.value])).toEqual([
      ["Manicura", 100000],
      ["Cabello", 100000],
    ]);
  });

  it("agrupa servicios pequenos como otros para mantener legible el donut", () => {
    const result = getServiceContributionChartData([
      transaction({ id: "s1", type: "income", amount: 100, date: "2026-06-01", serviceName: "Servicio 1" }),
      transaction({ id: "s2", type: "income", amount: 90, date: "2026-06-01", serviceName: "Servicio 2" }),
      transaction({ id: "s3", type: "income", amount: 80, date: "2026-06-01", serviceName: "Servicio 3" }),
      transaction({ id: "s4", type: "income", amount: 70, date: "2026-06-01", serviceName: "Servicio 4" }),
      transaction({ id: "s5", type: "income", amount: 60, date: "2026-06-01", serviceName: "Servicio 5" }),
      transaction({ id: "s6", type: "income", amount: 50, date: "2026-06-01", serviceName: "Servicio 6" }),
      transaction({ id: "s7", type: "income", amount: 40, date: "2026-06-01", serviceName: "Servicio 7" }),
      transaction({ id: "s8", type: "income", amount: 30, date: "2026-06-01", serviceName: "Servicio 8" }),
    ]);

    expect(result.segments).toHaveLength(7);
    expect(result.segments[result.segments.length - 1]).toMatchObject({
      label: "Otros servicios",
      value: 70,
    });
  });
});
