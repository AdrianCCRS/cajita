import type { Transaction } from "../types/domain";
import { isInMonth, toDate } from "./dates";

function isInPeriod(transaction: Transaction, year?: number, month?: number) {
  return typeof year === "number" && typeof month === "number"
    ? isInMonth(transaction.date, year, month)
    : true;
}

export type WeeklyIncomeExpenseChartData = {
  categories: string[];
  income: number[];
  expenses: number[];
  hasMovements: boolean;
};

export function getWeeklyIncomeExpenseChartData(
  transactions: Transaction[],
  year: number,
  month: number,
): WeeklyIncomeExpenseChartData {
  const daysInMonth = new Date(year, month, 0).getDate();
  const weeksInMonth = Math.ceil(daysInMonth / 7);
  const categories = Array.from({ length: weeksInMonth }, (_, index) => `Sem ${index + 1}`);
  const income = Array.from({ length: weeksInMonth }, () => 0);
  const expenses = Array.from({ length: weeksInMonth }, () => 0);

  transactions
    .filter(
      (transaction) =>
        (transaction.type === "income" || transaction.type === "expense") &&
        isInMonth(transaction.date, year, month),
    )
    .forEach((transaction) => {
      const weekIndex = Math.min(Math.floor((toDate(transaction.date).getDate() - 1) / 7), weeksInMonth - 1);

      if (transaction.type === "income") {
        income[weekIndex] += transaction.amount;
        return;
      }

      expenses[weekIndex] += transaction.amount;
    });

  return {
    categories,
    income,
    expenses,
    hasMovements: income.some((value) => value > 0) || expenses.some((value) => value > 0),
  };
}

export type CategoryExpenseChartData = {
  labels: string[];
  series: number[];
  hasData: boolean;
};

export function getExpensesByCategoryChartData(
  transactions: Transaction[],
  year?: number,
  month?: number,
): CategoryExpenseChartData {
  const categories = new Map<string, number>();

  transactions
    .filter(
      (transaction) =>
        transaction.type === "expense" &&
        transaction.categoryName &&
        isInPeriod(transaction, year, month),
    )
    .forEach((transaction) => {
      const name = transaction.categoryName!;
      categories.set(name, (categories.get(name) ?? 0) + transaction.amount);
    });

  const sorted = [...categories.entries()].sort(([, a], [, b]) => b - a);

  return {
    labels: sorted.map(([name]) => name),
    series: sorted.map(([, total]) => total),
    hasData: sorted.length > 0,
  };
}

export type ServiceBarChartData = {
  labels: string[];
  series: number[];
  hasData: boolean;
};

export function getServicesByCountChartData(
  transactions: Transaction[],
  year?: number,
  month?: number,
): ServiceBarChartData {
  const services = new Map<string, number>();

  transactions
    .filter(
      (transaction) =>
        transaction.type === "income" &&
        transaction.serviceName &&
        isInPeriod(transaction, year, month),
    )
    .forEach((transaction) => {
      const name = transaction.serviceName!;
      services.set(name, (services.get(name) ?? 0) + 1);
    });

  const sorted = [...services.entries()].sort(([, a], [, b]) => b - a);

  return {
    labels: sorted.map(([name]) => name),
    series: sorted.map(([, count]) => count),
    hasData: sorted.length > 0,
  };
}

export function getServicesByRevenueChartData(
  transactions: Transaction[],
  year?: number,
  month?: number,
): ServiceBarChartData {
  const services = new Map<string, number>();

  transactions
    .filter(
      (transaction) =>
        transaction.type === "income" &&
        transaction.serviceName &&
        isInPeriod(transaction, year, month),
    )
    .forEach((transaction) => {
      const name = transaction.serviceName!;
      services.set(name, (services.get(name) ?? 0) + transaction.amount);
    });

  const sorted = [...services.entries()].sort(([, a], [, b]) => b - a);

  return {
    labels: sorted.map(([name]) => name),
    series: sorted.map(([, total]) => total),
    hasData: sorted.length > 0,
  };
}

export type DailyIncomeChartData = {
  categories: string[];
  series: number[];
  hasData: boolean;
};

export function getDailyIncomeChartData(
  transactions: Transaction[],
  year: number,
  month: number,
): DailyIncomeChartData {
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const lastDay = isCurrentMonth ? today.getDate() : daysInMonth;
  const categories = Array.from({ length: daysInMonth }, (_, index) => String(index + 1));
  const series = Array.from({ length: daysInMonth }, () => 0);

  transactions
    .filter(
      (transaction) =>
        transaction.type === "income" &&
        isInMonth(transaction.date, year, month),
    )
    .forEach((transaction) => {
      const day = toDate(transaction.date).getDate() - 1;
      series[day] += transaction.amount;
    });

  const hasData = series.some((value) => value > 0);

  return {
    categories: categories.slice(0, lastDay),
    series: series.slice(0, lastDay),
    hasData,
  };
}
