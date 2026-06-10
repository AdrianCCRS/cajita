import { describe, expect, it } from "vitest";
import type { FixedExpense, Service, Transaction } from "../types/domain";
import {
  getBreakEvenPoint,
  getEstimatedProfit,
  getExpensesByCategory,
  getMonthlyExpenses,
  getMonthlyIncome,
  getMonthlyWithdrawals,
  getNetProfit,
  getOwnerSalaryPending,
  getServiceMargin,
  getTopServiceByRevenue,
  getTopServiceBySales,
  getTotalFixedExpenses,
} from "./financials";

const baseTransaction = {
  id: "transaction-1",
  paymentMethod: "cash",
  createdAt: "2026-06-10T12:00:00.000Z",
  updatedAt: "2026-06-10T12:00:00.000Z",
} as const;

const transactions: Transaction[] = [
  {
    ...baseTransaction,
    id: "income-1",
    type: "income",
    amount: 35000,
    date: "2026-06-10",
    serviceId: "service-1",
    serviceName: "Manicura",
    priceAtTime: 35000,
    costAtTime: 9000,
  },
  {
    ...baseTransaction,
    id: "income-2",
    type: "income",
    amount: 50000,
    date: "2026-06-10",
    serviceId: "service-2",
    serviceName: "Cepillado",
    priceAtTime: 50000,
    costAtTime: 10000,
  },
  {
    ...baseTransaction,
    id: "expense-1",
    type: "expense",
    amount: 15000,
    date: "2026-06-10",
    categoryId: "category-1",
    categoryName: "Insumos",
    expenseType: "variable",
  },
  {
    ...baseTransaction,
    id: "withdrawal-1",
    type: "withdrawal",
    amount: 20000,
    date: "2026-06-10",
  },
];

const fixedExpenses: FixedExpense[] = [
  {
    id: "fixed-1",
    name: "Arriendo",
    amount: 800000,
    isActive: true,
    createdAt: "2026-06-10T12:00:00.000Z",
    updatedAt: "2026-06-10T12:00:00.000Z",
  },
];

describe("financials", () => {
  it("keeps income, expenses and owner salary separated", () => {
    expect(getMonthlyIncome(transactions, 2026, 6)).toBe(85000);
    expect(getMonthlyExpenses(transactions, 2026, 6)).toBe(15000);
    expect(getMonthlyWithdrawals(transactions, 2026, 6)).toBe(20000);
    expect(getEstimatedProfit(85000, 15000)).toBe(70000);
    expect(getNetProfit(85000, 15000, 20000)).toBe(50000);
  });

  it("calculates break even only when sales have price and cost snapshots", () => {
    expect(getTotalFixedExpenses(fixedExpenses)).toBe(800000);
    expect(getBreakEvenPoint(fixedExpenses, transactions)).toBe(1030304);
    expect(getBreakEvenPoint(fixedExpenses, [])).toBeNull();
  });

  it("calculates salary pending and service summaries", () => {
    const service: Service = {
      id: "service-1",
      name: "Manicura",
      defaultPrice: 35000,
      estimatedCost: 9000,
      isActive: true,
      createdAt: "2026-06-10T12:00:00.000Z",
      updatedAt: "2026-06-10T12:00:00.000Z",
    };

    expect(getOwnerSalaryPending(100000, 20000)).toBe(80000);
    expect(Math.round(getServiceMargin(service))).toBe(74);
    expect(getTopServiceBySales(transactions)?.serviceName).toBe("Manicura");
    expect(getTopServiceByRevenue(transactions)?.serviceName).toBe("Cepillado");
    expect(getExpensesByCategory(transactions)).toEqual([
      { categoryId: "category-1", categoryName: "Insumos", total: 15000 },
    ]);
  });
});
