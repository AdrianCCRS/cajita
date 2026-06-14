import { describe, expect, it } from "vitest";
import type { Transaction } from "../types/domain";
import {
  getDayKey,
  getMonthKey,
  getMonthlyCalendarSummary,
  getTransactionDate,
  groupDayTransactionsForDetail,
  groupTransactionsByDay,
  groupTransactionsByMonth,
} from "./calendarTransactions";

const baseTransaction = {
  paymentMethod: "cash",
  createdAt: "2026-06-01T08:00:00.000-05:00",
  updatedAt: "2026-06-01T08:00:00.000-05:00",
} as const;

function transaction(input: Partial<Transaction> & Pick<Transaction, "id" | "type" | "amount" | "date">): Transaction {
  return {
    ...baseTransaction,
    ...input,
  };
}

describe("calendarTransactions", () => {
  it("agrupa movimientos por día solo para el tipo seleccionado", () => {
    const transactions = [
      transaction({ id: "income-1", type: "income", amount: 30000, date: "2026-06-12" }),
      transaction({ id: "income-2", type: "income", amount: 50000, date: "2026-06-12" }),
      transaction({ id: "expense-1", type: "expense", amount: 12000, date: "2026-06-12" }),
    ];

    const groups = groupTransactionsByDay(transactions, "income");

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      dayKey: "2026-06-12",
      count: 2,
      totalAmount: 80000,
    });
  });

  it("no mezcla vales personales con gastos del negocio", () => {
    const transactions = [
      transaction({ id: "expense-1", type: "expense", amount: 20000, date: "2026-06-03" }),
      transaction({ id: "voucher-1", type: "personal_voucher", amount: 15000, date: "2026-06-03" }),
    ];

    expect(groupTransactionsByDay(transactions, "expense")[0]?.totalAmount).toBe(20000);
    expect(groupTransactionsByDay(transactions, "personal_voucher")[0]?.totalAmount).toBe(15000);
  });

  it("calcula resumen mensual con día de más movimientos y día de mayor valor", () => {
    const transactions = [
      transaction({ id: "income-1", type: "income", amount: 30000, date: "2026-06-01" }),
      transaction({ id: "income-2", type: "income", amount: 20000, date: "2026-06-01" }),
      transaction({ id: "income-3", type: "income", amount: 90000, date: "2026-06-02" }),
      transaction({ id: "income-old", type: "income", amount: 500000, date: "2026-05-31" }),
    ];

    const summary = getMonthlyCalendarSummary(transactions, "income", "2026-06");

    expect(summary.monthlyTotal).toBe(140000);
    expect(summary.monthlyCount).toBe(3);
    expect(summary.highestCountDay?.dayKey).toBe("2026-06-01");
    expect(summary.highestAmountDay?.dayKey).toBe("2026-06-02");
  });

  it("agrupa totales por mes para el gráfico", () => {
    const transactions = [
      transaction({ id: "expense-1", type: "expense", amount: 10000, date: "2026-05-30" }),
      transaction({ id: "expense-2", type: "expense", amount: 15000, date: "2026-06-01" }),
      transaction({ id: "expense-3", type: "expense", amount: 25000, date: "2026-06-20" }),
    ];

    expect(groupTransactionsByMonth(transactions, "expense")).toEqual([
      { monthKey: "2026-05", monthLabel: "may 2026", totalAmount: 10000, count: 1 },
      { monthKey: "2026-06", monthLabel: "jun 2026", totalAmount: 40000, count: 2 },
    ]);
  });

  it("tolera fechas y valores inválidos sin romper los cálculos", () => {
    const transactions = [
      transaction({ id: "valid", type: "income", amount: 10000, date: "2026-06-01" }),
      transaction({ id: "bad-date", type: "income", amount: 10000, date: "no-date" }),
      transaction({ id: "bad-amount", type: "income", amount: Number.NaN, date: "2026-06-02" }),
      transaction({ id: "zero", type: "income", amount: 0, date: "2026-06-03" }),
    ];

    expect(groupTransactionsByDay(transactions, "income")).toHaveLength(1);
  });

  it("soporta Date, string y Timestamp de Firestore", () => {
    const jsDate = new Date(2026, 5, 12);
    const timestamp = { toDate: () => new Date(2026, 5, 13) };

    expect(getDayKey(jsDate)).toBe("2026-06-12");
    expect(getMonthKey(jsDate)).toBe("2026-06");
    expect(getTransactionDate(transaction({ id: "date", type: "income", amount: 1, date: jsDate as unknown as string }))).toEqual(jsDate);
    expect(getTransactionDate(transaction({ id: "timestamp", type: "income", amount: 1, date: timestamp as unknown as string }))).toEqual(timestamp.toDate());
  });

  it("agrupa el detalle del día por servicio y conserva horas de creación", () => {
    const transactions = [
      transaction({
        id: "income-1",
        type: "income",
        amount: 30000,
        date: "2026-06-12",
        createdAt: "2026-06-12T09:15:00.000-05:00",
        serviceId: "service-1",
        serviceName: "Manicura",
      }),
      transaction({
        id: "income-2",
        type: "income",
        amount: 50000,
        date: "2026-06-12",
        createdAt: "2026-06-12T11:30:00.000-05:00",
        serviceId: "service-1",
        serviceName: "Manicura",
      }),
    ];

    expect(groupDayTransactionsForDetail(transactions)).toMatchObject([
      {
        title: "Manicura",
        count: 2,
        totalAmount: 80000,
        times: ["09:15", "11:30"],
      },
    ]);
  });
});
