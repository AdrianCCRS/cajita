import { addDoc, serverTimestamp, type Firestore } from "firebase/firestore";
import { transactionsCollection } from "../../../shared/lib/firestorePaths";
import type { ExpenseType, PaymentMethod, Transaction } from "../../../shared/types/domain";

const paymentMethods: PaymentMethod[] = ["cash", "transfer", "other"];
const expenseTypes: ExpenseType[] = ["fixed", "variable", "extraordinary"];

type BaseTransactionInput = {
  db: Firestore;
  uid: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  notes?: string;
};

type RegisterIncomeInput = BaseTransactionInput & {
  serviceId: string;
  serviceName: string;
  priceAtTime: number;
  costAtTime: number;
};

type RegisterExpenseInput = BaseTransactionInput & {
  categoryId: string;
  categoryName: string;
  expenseType: ExpenseType;
};

type RegisterWithdrawalInput = BaseTransactionInput;

export async function registerIncome(input: RegisterIncomeInput): Promise<Transaction> {
  validateBase(input);

  if (!input.serviceId.trim() || !input.serviceName.trim()) {
    throw new Error("Selecciona un servicio para registrar la venta.");
  }

  if (!Number.isFinite(input.priceAtTime) || input.priceAtTime <= 0) {
    throw new Error("El precio del servicio debe ser mayor a $0.");
  }

  if (!Number.isFinite(input.costAtTime) || input.costAtTime < 0) {
    throw new Error("El costo del servicio no puede ser negativo.");
  }

  const data = {
    type: "income" as const,
    amount: input.amount,
    date: input.date,
    serviceId: input.serviceId,
    serviceName: input.serviceName,
    priceAtTime: input.priceAtTime,
    costAtTime: input.costAtTime,
    categoryId: null,
    categoryName: null,
    expenseType: null,
    paymentMethod: input.paymentMethod,
    notes: input.notes ?? "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const documentRef = await addDoc(transactionsCollection(input.db, input.uid), data);

  return { id: documentRef.id, ...data };
}

export async function registerExpense(input: RegisterExpenseInput): Promise<Transaction> {
  validateBase(input);

  if (!input.categoryId.trim() || !input.categoryName.trim()) {
    throw new Error("Selecciona una categoría para registrar el gasto.");
  }

  if (!expenseTypes.includes(input.expenseType)) {
    throw new Error("Selecciona un tipo de gasto válido.");
  }

  const data = {
    type: "expense" as const,
    amount: input.amount,
    date: input.date,
    serviceId: null,
    serviceName: null,
    priceAtTime: null,
    costAtTime: null,
    categoryId: input.categoryId,
    categoryName: input.categoryName,
    expenseType: input.expenseType,
    paymentMethod: input.paymentMethod,
    notes: input.notes ?? "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const documentRef = await addDoc(transactionsCollection(input.db, input.uid), data);

  return { id: documentRef.id, ...data };
}

export async function registerWithdrawal(input: RegisterWithdrawalInput): Promise<Transaction> {
  validateBase(input);

  const data = {
    type: "withdrawal" as const,
    amount: input.amount,
    date: input.date,
    serviceId: null,
    serviceName: null,
    priceAtTime: null,
    costAtTime: null,
    categoryId: null,
    categoryName: "Salario de la dueña",
    expenseType: null,
    paymentMethod: input.paymentMethod,
    notes: input.notes ?? "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const documentRef = await addDoc(transactionsCollection(input.db, input.uid), data);

  return { id: documentRef.id, ...data };
}

function validateBase(input: BaseTransactionInput) {
  if (!input.uid.trim()) {
    throw new Error("No se pudo registrar el movimiento porque falta el usuario.");
  }

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("El valor debe ser mayor a $0");
  }

  if (!input.date.trim()) {
    throw new Error("Selecciona una fecha.");
  }

  if (!paymentMethods.includes(input.paymentMethod)) {
    throw new Error("Selecciona un método de pago válido.");
  }
}
