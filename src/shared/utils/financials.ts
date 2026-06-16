import type { FixedExpense, Service, Transaction } from "../types/domain";
import { isInMonth } from "./dates";

function monthlyTotal(transactions: Transaction[], year: number, month: number, type: Transaction["type"]) {
  return transactions
    .filter((transaction) => transaction.type === type && isInMonth(transaction.date, year, month))
    .reduce((total, transaction) => total + transaction.amount, 0);
}

export function getMonthlyIncome(transactions: Transaction[], year: number, month: number): number {
  return monthlyTotal(transactions, year, month, "income");
}

export function getMonthlyExpenses(transactions: Transaction[], year: number, month: number): number {
  return monthlyTotal(transactions, year, month, "expense");
}

export function getMonthlyWithdrawals(transactions: Transaction[], year: number, month: number): number {
  return monthlyTotal(transactions, year, month, "withdrawal");
}

export function getMonthlyPersonalVouchers(transactions: Transaction[], year: number, month: number): number {
  return monthlyTotal(transactions, year, month, "personal_voucher");
}

export function getTotalFixedExpenses(fixedExpenses: FixedExpense[]): number {
  return fixedExpenses
    .filter((expense) => expense.isActive)
    .reduce((total, expense) => total + expense.amount, 0);
}

export function getMonthlyFixedExpensePayments(transactions: Transaction[], year: number, month: number): number {
  return transactions
    .filter(
      (transaction) =>
        transaction.type === "expense" &&
        transaction.expenseType === "fixed" &&
        isInMonth(transaction.date, year, month),
    )
    .reduce((total, transaction) => total + transaction.amount, 0);
}

export function getPendingFixedExpensesForMonth(
  fixedExpenses: FixedExpense[],
  transactions: Transaction[],
  year: number,
  month: number,
): number {
  return Math.max(0, getTotalFixedExpenses(fixedExpenses) - getMonthlyFixedExpensePayments(transactions, year, month));
}

export function getBreakEvenPoint(fixedExpenses: FixedExpense[], transactions: Transaction[]): number | null {
  const incomeTransactions = transactions.filter(
    (transaction) =>
      transaction.type === "income" &&
      typeof transaction.priceAtTime === "number" &&
      typeof transaction.costAtTime === "number" &&
      transaction.priceAtTime > 0,
  );

  if (incomeTransactions.length === 0) {
    return null;
  }

  const averagePrice =
    incomeTransactions.reduce((total, transaction) => total + (transaction.priceAtTime ?? 0), 0) /
    incomeTransactions.length;
  const averageVariableCost =
    incomeTransactions.reduce((total, transaction) => total + (transaction.costAtTime ?? 0), 0) /
    incomeTransactions.length;
  const contributionRate = 1 - averageVariableCost / averagePrice;

  if (averagePrice <= 0 || contributionRate <= 0) {
    return null;
  }

  return Math.ceil(getTotalFixedExpenses(fixedExpenses) / contributionRate);
}

export function getBreakEvenProgress(monthlyIncome: number, breakEven: number): number {
  if (breakEven <= 0) {
    return 0;
  }

  return (monthlyIncome / breakEven) * 100;
}

export function getEstimatedProfit(monthlyIncome: number, monthlyExpenses: number): number {
  return monthlyIncome - monthlyExpenses;
}

export function getNetProfit(
  monthlyIncome: number,
  monthlyExpenses: number,
  monthlyWithdrawals: number,
  monthlyPersonalVouchers = 0,
): number {
  return monthlyIncome - monthlyExpenses - monthlyWithdrawals - monthlyPersonalVouchers;
}

export function getOwnerSalaryPending(salaryTarget: number, monthlyWithdrawals: number, monthlyPersonalVouchers = 0): number {
  return salaryTarget - monthlyWithdrawals - monthlyPersonalVouchers;
}

export function getOwnerTotalReceived(monthlyWithdrawals: number, monthlyPersonalVouchers: number): number {
  return monthlyWithdrawals + monthlyPersonalVouchers;
}

export function getSalaryUsagePercentage(salaryTarget: number, ownerTotalReceived: number): number {
  if (salaryTarget <= 0) {
    return 0;
  }

  return (ownerTotalReceived / salaryTarget) * 100;
}

export function getPersonalVouchersByPeriod(transactions: Transaction[], year: number, month: number): Transaction[] {
  return transactions.filter((transaction) => transaction.type === "personal_voucher" && isInMonth(transaction.date, year, month));
}

export function groupPersonalVouchersByCategory(
  transactions: Transaction[],
): { personalCategoryId: string; personalCategoryName: string; total: number }[] {
  const categories = new Map<string, { personalCategoryId: string; personalCategoryName: string; total: number }>();

  transactions
    .filter((transaction) => transaction.type === "personal_voucher" && transaction.personalCategoryId && transaction.personalCategoryName)
    .forEach((transaction) => {
      const current = categories.get(transaction.personalCategoryId!) ?? {
        personalCategoryId: transaction.personalCategoryId!,
        personalCategoryName: transaction.personalCategoryName!,
        total: 0,
      };
      categories.set(transaction.personalCategoryId!, { ...current, total: current.total + transaction.amount });
    });

  return [...categories.values()].sort((a, b) => b.total - a.total);
}

export function getDailySuggestedGoal(breakEven: number, workingDaysInMonth: number): number {
  if (workingDaysInMonth <= 0) {
    return 0;
  }

  return Math.ceil(breakEven / workingDaysInMonth);
}

export function getTopServiceBySales(
  transactions: Transaction[],
): { serviceId: string; serviceName: string; count: number } | null {
  const sales = new Map<string, { serviceId: string; serviceName: string; count: number }>();

  transactions
    .filter((transaction) => transaction.type === "income" && transaction.serviceId && transaction.serviceName)
    .forEach((transaction) => {
      const current = sales.get(transaction.serviceId!) ?? {
        serviceId: transaction.serviceId!,
        serviceName: transaction.serviceName!,
        count: 0,
      };
      sales.set(transaction.serviceId!, { ...current, count: current.count + 1 });
    });

  return [...sales.values()].sort((a, b) => b.count - a.count)[0] ?? null;
}

export function getTopServiceByRevenue(
  transactions: Transaction[],
): { serviceId: string; serviceName: string; total: number } | null {
  const revenue = new Map<string, { serviceId: string; serviceName: string; total: number }>();

  transactions
    .filter((transaction) => transaction.type === "income" && transaction.serviceId && transaction.serviceName)
    .forEach((transaction) => {
      const current = revenue.get(transaction.serviceId!) ?? {
        serviceId: transaction.serviceId!,
        serviceName: transaction.serviceName!,
        total: 0,
      };
      revenue.set(transaction.serviceId!, { ...current, total: current.total + transaction.amount });
    });

  return [...revenue.values()].sort((a, b) => b.total - a.total)[0] ?? null;
}

export function getServiceMargin(service: Service): number {
  if (service.defaultPrice <= 0) {
    return 0;
  }

  return ((service.defaultPrice - service.estimatedCost) / service.defaultPrice) * 100;
}

export function getExpensesByCategory(
  transactions: Transaction[],
): { categoryId: string; categoryName: string; total: number }[] {
  const categories = new Map<string, { categoryId: string; categoryName: string; total: number }>();

  transactions
    .filter((transaction) => transaction.type === "expense" && transaction.categoryId && transaction.categoryName)
    .forEach((transaction) => {
      const current = categories.get(transaction.categoryId!) ?? {
        categoryId: transaction.categoryId!,
        categoryName: transaction.categoryName!,
        total: 0,
      };
      categories.set(transaction.categoryId!, { ...current, total: current.total + transaction.amount });
    });

  return [...categories.values()].sort((a, b) => b.total - a.total);
}
