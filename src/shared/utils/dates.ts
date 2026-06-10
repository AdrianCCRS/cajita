import { endOfMonth, format, isSameDay, isWithinInterval, parseISO, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";

export function toDate(value: string | Date) {
  return typeof value === "string" ? parseISO(value) : value;
}

export function formatDateShort(date: string | Date): string {
  return format(toDate(date), "dd MMM yyyy", { locale: es });
}

export function formatInputDate(date: Date = new Date()): string {
  return format(date, "yyyy-MM-dd");
}

export function isInMonth(date: string | Date, year: number, month: number) {
  const reference = new Date(year, month - 1, 1);
  return isWithinInterval(toDate(date), {
    start: startOfMonth(reference),
    end: endOfMonth(reference),
  });
}

export function isToday(date: string | Date) {
  return isSameDay(toDate(date), new Date());
}
