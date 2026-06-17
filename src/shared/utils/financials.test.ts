import { describe, expect, it } from "vitest";
import type { FixedExpense, Service, Transaction } from "../types/domain";
import {
  getBreakEvenPoint,
  getEstimatedProfit,
  getExpensesByCategory,
  getMonthlyExpenses,
  getMonthlyFixedExpensePayments,
  getMonthlyIncome,
  getMonthlyPersonalVouchers,
  getMonthlyWithdrawals,
  getNetProfit,
  getOwnerTotalReceived,
  getOwnerSalaryPending,
  getPendingFixedExpensesForMonth,
  getSalaryUsagePercentage,
  groupPersonalVouchersByCategory,
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
    id: "fixed-payment-1",
    type: "expense",
    amount: 300000,
    date: "2026-06-05",
    categoryId: "category-rent",
    categoryName: "Arriendo",
    fixedExpenseId: "fixed-1",
    fixedExpenseName: "Arriendo",
    expenseType: "fixed",
  },
  {
    ...baseTransaction,
    id: "withdrawal-1",
    type: "withdrawal",
    amount: 20000,
    date: "2026-06-10",
  },
  {
    ...baseTransaction,
    id: "voucher-1",
    type: "personal_voucher",
    amount: 12000,
    date: "2026-06-10",
    personalCategoryId: "pec_alimentacion",
    personalCategoryName: "Alimentación",
    categoryId: null,
    categoryName: null,
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
    expect(getMonthlyExpenses(transactions, 2026, 6)).toBe(315000);
    expect(getMonthlyWithdrawals(transactions, 2026, 6)).toBe(20000);
    expect(getMonthlyPersonalVouchers(transactions, 2026, 6)).toBe(12000);
    expect(getEstimatedProfit(85000, 315000)).toBe(-230000);
    expect(getNetProfit(85000, 315000, 20000, 12000)).toBe(-262000);
  });

  it("separates configured fixed commitments from fixed payments registered in the month", () => {
    expect(getTotalFixedExpenses(fixedExpenses)).toBe(800000);
    expect(getMonthlyFixedExpensePayments(transactions, 2026, 6)).toBe(300000);
    expect(getPendingFixedExpensesForMonth(fixedExpenses, transactions, 2026, 6)).toBe(500000);
    expect(getPendingFixedExpensesForMonth(fixedExpenses, transactions, 2026, 7)).toBe(800000);
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

    expect(getOwnerTotalReceived(20000, 12000)).toBe(32000);
    expect(getOwnerSalaryPending(100000, 20000, 12000)).toBe(68000);
    expect(getOwnerSalaryPending(25000, 20000, 12000)).toBe(-7000);
    expect(Math.round(getSalaryUsagePercentage(100000, 32000))).toBe(32);
    expect(Math.round(getServiceMargin(service))).toBe(74);
    expect(getTopServiceBySales(transactions)?.serviceName).toBe("Manicura");
    expect(getTopServiceByRevenue(transactions)?.serviceName).toBe("Cepillado");
    expect(getExpensesByCategory(transactions)).toEqual([
      { categoryId: "category-rent", categoryName: "Arriendo", total: 300000 },
      { categoryId: "category-1", categoryName: "Insumos", total: 15000 },
    ]);
    expect(groupPersonalVouchersByCategory(transactions)).toEqual([
      { personalCategoryId: "pec_alimentacion", personalCategoryName: "Alimentación", total: 12000 },
    ]);
  });
});
