import { addDoc, serverTimestamp, setDoc, type Firestore } from "firebase/firestore";
import { transactionDoc, transactionsCollection } from "../../../shared/lib/firestorePaths";
import type { ExpenseType, PaymentMethod, ServiceMaterial, Transaction } from "../../../shared/types/domain";

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
  materialsSnapshot?: Array<Pick<ServiceMaterial, "rawMaterialId" | "rawMaterialName" | "servicesCovered" | "quantityUsed" | "unitType" | "unitCostSnapshot" | "totalCost">>;
};

type RegisterExpenseInput = BaseTransactionInput & {
  categoryId: string;
  categoryName: string;
  expenseType: ExpenseType;
  fixedExpenseId?: string;
  fixedExpenseName?: string;
};

type RegisterWithdrawalInput = BaseTransactionInput;

type RegisterPersonalVoucherInput = BaseTransactionInput & {
  personalCategoryId: string;
  personalCategoryName: string;
};

type EditPersonalVoucherInput = RegisterPersonalVoucherInput & {
  transactionId: string;
};

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
    materialsSnapshot: input.materialsSnapshot ?? [],
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
    fixedExpenseId: input.fixedExpenseId ?? null,
    fixedExpenseName: input.fixedExpenseName ?? null,
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

export async function registerPersonalVoucher(input: RegisterPersonalVoucherInput): Promise<Transaction> {
  validateBase(input);

  if (!input.personalCategoryId.trim() || !input.personalCategoryName.trim()) {
    throw new Error("Elige una categoría personal para registrar el vale.");
  }

  const data = {
    type: "personal_voucher" as const,
    amount: input.amount,
    date: input.date,
    serviceId: null,
    serviceName: null,
    priceAtTime: null,
    costAtTime: null,
    categoryId: null,
    categoryName: null,
    personalCategoryId: input.personalCategoryId,
    personalCategoryName: input.personalCategoryName,
    expenseType: null,
    paymentMethod: input.paymentMethod,
    notes: input.notes ?? "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const documentRef = await addDoc(transactionsCollection(input.db, input.uid), data);

  return { id: documentRef.id, ...data };
}

export async function editPersonalVoucher(input: EditPersonalVoucherInput): Promise<Transaction> {
  if (!input.transactionId.trim()) {
    throw new Error("No se pudo editar el vale porque falta el movimiento.");
  }

  validateBase(input);

  if (!input.personalCategoryId.trim() || !input.personalCategoryName.trim()) {
    throw new Error("Elige una categoría personal para registrar el vale.");
  }

  const data = {
    type: "personal_voucher" as const,
    amount: input.amount,
    date: input.date,
    serviceId: null,
    serviceName: null,
    priceAtTime: null,
    costAtTime: null,
    categoryId: null,
    categoryName: null,
    personalCategoryId: input.personalCategoryId,
    personalCategoryName: input.personalCategoryName,
    expenseType: null,
    paymentMethod: input.paymentMethod,
    notes: input.notes ?? "",
    updatedAt: serverTimestamp(),
  };

  await setDoc(transactionDoc(input.db, input.uid, input.transactionId), data, { merge: true });

  return {
    id: input.transactionId,
    ...data,
    createdAt: "",
  };
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
