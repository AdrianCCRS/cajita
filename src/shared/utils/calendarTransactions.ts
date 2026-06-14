import { format, isValid, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { Transaction, TransactionType } from "../types/domain";

export type CalendarTransactionType = TransactionType;

export type DayTransactionGroup = {
  date: Date;
  dayKey: string;
  count: number;
  totalAmount: number;
  transactions: Transaction[];
};

export type MonthTransactionGroup = {
  monthKey: string;
  monthLabel: string;
  totalAmount: number;
  count: number;
};

export type MonthlyCalendarSummary = {
  monthlyTotal: number;
  monthlyCount: number;
  highestAmountDay: DayTransactionGroup | null;
  highestCountDay: DayTransactionGroup | null;
};

export type DayTransactionSummaryGroup = {
  key: string;
  title: string;
  count: number;
  totalAmount: number;
  paymentMethods: string[];
  times: string[];
  notes: string[];
  transactions: Transaction[];
};

export const calendarTransactionTypes: Array<{
  id: CalendarTransactionType;
  label: string;
  colorVar: string;
  colorClass: string;
}> = [
  { id: "income", label: "Ventas", colorVar: "var(--income)", colorClass: "calendar-tone--income" },
  { id: "expense", label: "Gastos", colorVar: "var(--expense)", colorClass: "calendar-tone--expense" },
  { id: "withdrawal", label: "Pagos a la dueña", colorVar: "var(--salary)", colorClass: "calendar-tone--withdrawal" },
  { id: "personal_voucher", label: "Vales personales", colorVar: "var(--vales)", colorClass: "calendar-tone--personal_voucher" },
];

export function getTransactionDate(transaction: Pick<Transaction, "date" | "createdAt">): Date | null {
  const candidates = [transaction.date, transaction.createdAt];

  for (const candidate of candidates) {
    const date = coerceToDate(candidate);
    if (date) {
      return date;
    }
  }

  return null;
}

export function getDayKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function getMonthKey(date: Date): string {
  return format(date, "yyyy-MM");
}

export function formatDisplayDate(date: Date): string {
  return format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
}

export function formatMonthLabel(date: Date): string {
  return format(date, "MMM yyyy", { locale: es });
}

export function formatTransactionTime(transaction: Pick<Transaction, "date" | "createdAt">): string | null {
  const date = coerceToDate(transaction.createdAt) ?? coerceToDate(transaction.date);
  return date ? format(date, "HH:mm") : null;
}

export function groupTransactionsByDay(
  transactions: Transaction[],
  selectedType: CalendarTransactionType,
): DayTransactionGroup[] {
  const groups = new Map<string, DayTransactionGroup>();

  getValidTransactions(transactions, selectedType).forEach(({ transaction, date }) => {
    const dayKey = getDayKey(date);
    const current = groups.get(dayKey);

    if (current) {
      current.count += 1;
      current.totalAmount += transaction.amount;
      current.transactions.push(transaction);
      return;
    }

    groups.set(dayKey, {
      date,
      dayKey,
      count: 1,
      totalAmount: transaction.amount,
      transactions: [transaction],
    });
  });

  return [...groups.values()].sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function groupTransactionsByMonth(
  transactions: Transaction[],
  selectedType: CalendarTransactionType,
): MonthTransactionGroup[] {
  const groups = new Map<string, MonthTransactionGroup & { date: Date }>();

  getValidTransactions(transactions, selectedType).forEach(({ transaction, date }) => {
    const monthKey = getMonthKey(date);
    const current = groups.get(monthKey);

    if (current) {
      current.count += 1;
      current.totalAmount += transaction.amount;
      return;
    }

    groups.set(monthKey, {
      date: new Date(date.getFullYear(), date.getMonth(), 1),
      monthKey,
      monthLabel: formatMonthLabel(date),
      totalAmount: transaction.amount,
      count: 1,
    });
  });

  return [...groups.values()]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map(({ date: _date, ...group }) => group);
}

export function getMonthlyCalendarSummary(
  transactions: Transaction[],
  selectedType: CalendarTransactionType,
  monthKey: string,
): MonthlyCalendarSummary {
  const days = groupTransactionsByDay(transactions, selectedType).filter((day) => getMonthKey(day.date) === monthKey);
  const monthlyTotal = days.reduce((total, day) => total + day.totalAmount, 0);
  const monthlyCount = days.reduce((total, day) => total + day.count, 0);

  return {
    monthlyTotal,
    monthlyCount,
    highestAmountDay: days.reduce<DayTransactionGroup | null>(
      (highest, day) => (!highest || day.totalAmount > highest.totalAmount ? day : highest),
      null,
    ),
    highestCountDay: days.reduce<DayTransactionGroup | null>(
      (highest, day) => (!highest || day.count > highest.count ? day : highest),
      null,
    ),
  };
}

export function getCalendarTypeMeta(type: CalendarTransactionType) {
  return calendarTransactionTypes.find((item) => item.id === type) ?? calendarTransactionTypes[0];
}

export function getMonthlyTotalLabel(type: CalendarTransactionType) {
  if (type === "income") return "Total vendido";
  if (type === "expense") return "Total gastado";
  if (type === "withdrawal") return "Pagado a la dueña";
  return "Total en vales";
}

export function getMonthlyCountLabel(type: CalendarTransactionType) {
  if (type === "income") return "Ventas registradas";
  if (type === "expense") return "Gastos registrados";
  if (type === "withdrawal") return "Pagos registrados";
  return "Vales registrados";
}

export function getDayDetailTitle(type: CalendarTransactionType) {
  if (type === "income") return "Ventas del día";
  if (type === "expense") return "Gastos del día";
  if (type === "withdrawal") return "Pagos a la dueña";
  return "Vales personales";
}

export function getDayDetailTotalLabel(type: CalendarTransactionType) {
  if (type === "income") return "Total vendido este día";
  if (type === "expense") return "Total gastado este día";
  if (type === "withdrawal") return "Total pagado a la dueña este día";
  return "Total en vales este día";
}

export function getTransactionCalendarTitle(transaction: Transaction) {
  if (transaction.type === "income") {
    return transaction.serviceName || "Venta";
  }

  if (transaction.type === "expense") {
    return transaction.categoryName || "Gasto del negocio";
  }

  if (transaction.type === "personal_voucher") {
    return transaction.personalCategoryName || "Vale personal";
  }

  return "Pago a la dueña";
}

export function groupDayTransactionsForDetail(transactions: Transaction[]): DayTransactionSummaryGroup[] {
  const groups = new Map<string, DayTransactionSummaryGroup>();

  transactions.forEach((transaction) => {
    const title = getTransactionCalendarTitle(transaction);
    const key = `${transaction.type}:${transaction.serviceId ?? transaction.categoryId ?? transaction.personalCategoryId ?? title}`;
    const time = formatTransactionTime(transaction);
    const paymentLabel = getPaymentLabel(transaction.paymentMethod);
    const current = groups.get(key);

    if (current) {
      current.count += 1;
      current.totalAmount += transaction.amount;
      current.transactions.push(transaction);
      if (!current.paymentMethods.includes(paymentLabel)) {
        current.paymentMethods.push(paymentLabel);
      }
      if (time) {
        current.times.push(time);
      }
      if (transaction.notes && !current.notes.includes(transaction.notes)) {
        current.notes.push(transaction.notes);
      }
      return;
    }

    groups.set(key, {
      key,
      title,
      count: 1,
      totalAmount: transaction.amount,
      paymentMethods: [paymentLabel],
      times: time ? [time] : [],
      notes: transaction.notes ? [transaction.notes] : [],
      transactions: [transaction],
    });
  });

  return [...groups.values()].sort((a, b) => b.totalAmount - a.totalAmount);
}

export function getPaymentLabel(paymentMethod: Transaction["paymentMethod"]) {
  if (paymentMethod === "cash") return "Efectivo";
  if (paymentMethod === "transfer") return "Transferencia";
  return "Otro";
}

function getValidTransactions(transactions: Transaction[], selectedType: CalendarTransactionType) {
  return transactions
    .filter((transaction) => transaction.type === selectedType)
    .map((transaction) => ({ transaction, date: getTransactionDate(transaction) }))
    .filter((item): item is { transaction: Transaction; date: Date } =>
      Boolean(item.date) && Number.isFinite(item.transaction.amount) && item.transaction.amount > 0,
    );
}

function coerceToDate(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return isValid(value) ? value : null;
  }

  if (typeof value === "string") {
    const parsed = parseISO(value);
    return isValid(parsed) ? parsed : null;
  }

  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    const parsed = value.toDate();
    return parsed instanceof Date && isValid(parsed) ? parsed : null;
  }

  return null;
}
