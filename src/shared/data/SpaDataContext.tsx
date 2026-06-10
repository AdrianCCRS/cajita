import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  deleteDoc,
  onSnapshot,
  setDoc,
  type CollectionReference,
  type DocumentData,
} from "firebase/firestore";
import { defaultCategories, defaultFixedExpenses, defaultServices } from "../../features/onboarding/constants/defaultSeeds";
import { registerExpense, registerIncome, registerWithdrawal } from "../../features/transactions/services/createTransaction";
import { useAuth } from "../auth/AuthContext";
import {
  businessDoc,
  categoriesCollection,
  financialSettingsDoc,
  fixedExpenseDoc,
  fixedExpensesCollection,
  serviceDoc,
  servicesCollection,
  transactionDoc,
  transactionsCollection,
} from "../lib/firestorePaths";
import { getFirebaseDb } from "../lib/firebase";
import type {
  Business,
  ExpenseCategory,
  ExpenseType,
  FinancialSettings,
  FixedExpense,
  PaymentMethod,
  Service,
  Transaction,
} from "../types/domain";
import { formatInputDate } from "../utils/dates";

type TransactionInput =
  | {
      type: "income";
      serviceId: string;
      amount: number;
      paymentMethod: PaymentMethod;
      date: string;
      notes?: string;
    }
  | {
      type: "expense";
      categoryId: string;
      amount: number;
      expenseType: ExpenseType;
      paymentMethod: PaymentMethod;
      date: string;
      notes?: string;
    }
  | {
      type: "withdrawal";
      amount: number;
      paymentMethod: PaymentMethod;
      date: string;
      notes?: string;
    };

type SpaData = SpaState & {
  source: "firebase" | "local";
  isLoading: boolean;
  error: string | null;
  addTransaction: (input: TransactionInput) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  restoreTransaction: (transaction: Transaction) => Promise<void>;
  upsertService: (input: Pick<Service, "name" | "defaultPrice" | "estimatedCost"> & { id?: string }) => Promise<void>;
  deactivateService: (id: string) => Promise<void>;
  upsertFixedExpense: (input: Pick<FixedExpense, "name" | "amount"> & { id?: string }) => Promise<void>;
  updateSalaryTarget: (salaryTarget: number) => Promise<void>;
};

const storageKey = "spa-control-demo-v1";
const now = new Date().toISOString();

type SpaState = {
  business: Business;
  services: Service[];
  fixedExpenses: FixedExpense[];
  categories: ExpenseCategory[];
  transactions: Transaction[];
  financialSettings: FinancialSettings;
};

const initialState: SpaState = {
  business: { id: "main", name: "Spa Bella", currency: "COP" as const },
  services: defaultServices.map((item) => ({ ...item, createdAt: now, updatedAt: now })),
  fixedExpenses: defaultFixedExpenses.map((item) => ({ ...item, createdAt: now, updatedAt: now })),
  categories: defaultCategories.map((item) => ({ ...item, createdAt: now, updatedAt: now })),
  transactions: [],
  financialSettings: { salaryTarget: 1800000, updatedAt: now },
};

const SpaDataContext = createContext<SpaData | null>(null);

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readInitialState(): SpaState {
  if (typeof window === "undefined") {
    return initialState;
  }

  const stored = window.localStorage.getItem(storageKey);
  if (!stored) {
    return initialState;
  }

  try {
    return { ...initialState, ...JSON.parse(stored) };
  } catch {
    return initialState;
  }
}

function withoutId<T extends { id: string }>(item: T) {
  const { id: _id, ...data } = item;
  return data;
}

function docsWithId<T extends { id: string }>(collectionRef: CollectionReference<DocumentData>, callback: (items: T[]) => void) {
  return onSnapshot(collectionRef, (snapshot) => {
    callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as T));
  });
}

function buildTransaction(input: TransactionInput, state: SpaState): Transaction {
  const timestamp = new Date().toISOString();

  if (input.type === "income") {
    const selectedService = state.services.find((item) => item.id === input.serviceId);
    if (!selectedService || selectedService.defaultPrice <= 0) {
      throw new Error("Servicio sin precio configurado");
    }

    return {
      id: createId("transaction"),
      type: "income",
      amount: input.amount,
      date: input.date,
      paymentMethod: input.paymentMethod,
      notes: input.notes,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      priceAtTime: input.amount,
      costAtTime: selectedService.estimatedCost,
      categoryId: null,
      categoryName: null,
      expenseType: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  if (input.type === "expense") {
    const selectedCategory = state.categories.find((item) => item.id === input.categoryId);

    return {
      id: createId("transaction"),
      type: "expense",
      amount: input.amount,
      date: input.date,
      paymentMethod: input.paymentMethod,
      notes: input.notes,
      serviceId: null,
      serviceName: null,
      priceAtTime: null,
      costAtTime: null,
      categoryId: selectedCategory?.id ?? input.categoryId,
      categoryName: selectedCategory?.name ?? "Otros",
      expenseType: input.expenseType,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  return {
    id: createId("transaction"),
    type: "withdrawal",
    amount: input.amount,
    date: input.date,
    paymentMethod: input.paymentMethod,
    notes: input.notes,
    serviceId: null,
    serviceName: null,
    priceAtTime: null,
    costAtTime: null,
    categoryId: null,
    categoryName: "Salario de la dueña",
    expenseType: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function SpaDataProvider({ children }: { children: ReactNode }) {
  const { isFirebaseEnabled, user } = useAuth();
  const db = getFirebaseDb();
  const useFirestore = Boolean(isFirebaseEnabled && db && user);
  const [state, setState] = useState<SpaState>(useFirestore ? initialState : readInitialState);
  const [isLoading, setIsLoading] = useState(useFirestore);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!useFirestore || !db || !user) {
      setIsLoading(false);
      return undefined;
    }

    let cancelled = false;
    const unsubscribers: Array<() => void> = [];
    setIsLoading(true);
    setError(null);

    try {
      unsubscribers.push(
        onSnapshot(businessDoc(db, user.uid), (snapshot) => {
          if (snapshot.exists()) {
            setState((current) => ({
              ...current,
              business: { id: snapshot.id, ...snapshot.data() } as Business,
            }));
          }
        }),
        docsWithId<Service>(servicesCollection(db, user.uid), (services) => {
          setState((current) => ({ ...current, services }));
        }),
        docsWithId<FixedExpense>(fixedExpensesCollection(db, user.uid), (fixedExpenses) => {
          setState((current) => ({ ...current, fixedExpenses }));
        }),
        docsWithId<ExpenseCategory>(categoriesCollection(db, user.uid), (categories) => {
          setState((current) => ({ ...current, categories }));
        }),
        docsWithId<Transaction>(transactionsCollection(db, user.uid), (transactions) => {
          setState((current) => ({ ...current, transactions }));
        }),
        onSnapshot(financialSettingsDoc(db, user.uid), (snapshot) => {
          setState((current) => ({
            ...current,
            financialSettings: snapshot.exists()
              ? ({ ...initialState.financialSettings, ...snapshot.data() } as FinancialSettings)
              : initialState.financialSettings,
          }));
        }),
      );
      if (!cancelled) {
        setIsLoading(false);
      }
    } catch {
      if (!cancelled) {
        setError("Algo salió mal. Intenta de nuevo en un momento.");
        setIsLoading(false);
      }
    }

    return () => {
      cancelled = true;
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [db, useFirestore, user]);

  function commitLocal(updater: (current: SpaState) => SpaState) {
    setState((current) => {
      const next = updater(current);
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }

  const value = useMemo<SpaData>(
    () => ({
      ...state,
      source: useFirestore ? "firebase" : "local",
      isLoading,
      error,
      async addTransaction(input) {
        const transaction = buildTransaction(input, state);

        if (useFirestore && db && user) {
          if (input.type === "income") {
            const selectedService = state.services.find((item) => item.id === input.serviceId);
            if (!selectedService) {
              throw new Error("Servicio sin precio configurado");
            }

            return registerIncome({
              db,
              uid: user.uid,
              amount: input.amount,
              date: input.date,
              serviceId: selectedService.id,
              serviceName: selectedService.name,
              priceAtTime: input.amount,
              costAtTime: selectedService.estimatedCost,
              paymentMethod: input.paymentMethod,
              notes: input.notes,
            });
          }

          if (input.type === "expense") {
            const selectedCategory = state.categories.find((item) => item.id === input.categoryId);

            return registerExpense({
              db,
              uid: user.uid,
              amount: input.amount,
              date: input.date,
              categoryId: selectedCategory?.id ?? input.categoryId,
              categoryName: selectedCategory?.name ?? "Otros",
              expenseType: input.expenseType,
              paymentMethod: input.paymentMethod,
              notes: input.notes,
            });
          }

          return registerWithdrawal({
            db,
            uid: user.uid,
            amount: input.amount,
            date: input.date,
            paymentMethod: input.paymentMethod,
            notes: input.notes,
          });
        } else {
          commitLocal((current) => ({ ...current, transactions: [transaction, ...current.transactions] }));
        }

        return transaction;
      },
      async deleteTransaction(id) {
        if (useFirestore && db && user) {
          await deleteDoc(transactionDoc(db, user.uid, id));
        } else {
          commitLocal((current) => ({
            ...current,
            transactions: current.transactions.filter((transaction) => transaction.id !== id),
          }));
        }
      },
      async restoreTransaction(transaction) {
        if (useFirestore && db && user) {
          await setDoc(transactionDoc(db, user.uid, transaction.id), withoutId(transaction));
        } else {
          commitLocal((current) => ({
            ...current,
            transactions: current.transactions.some((item) => item.id === transaction.id)
              ? current.transactions
              : [transaction, ...current.transactions],
          }));
        }
      },
      async upsertService(input) {
        const timestamp = new Date().toISOString();
        const id = input.id ?? createId("service");
        const nextService: Service = {
          id,
          name: input.name,
          defaultPrice: input.defaultPrice,
          estimatedCost: input.estimatedCost,
          isActive: true,
          createdAt: state.services.find((item) => item.id === id)?.createdAt ?? timestamp,
          updatedAt: timestamp,
        };

        if (useFirestore && db && user) {
          await setDoc(serviceDoc(db, user.uid, id), withoutId(nextService), { merge: true });
        } else {
          commitLocal((current) => ({
            ...current,
            services: input.id
              ? current.services.map((item) => (item.id === input.id ? { ...item, ...nextService } : item))
              : [...current.services, nextService],
          }));
        }
      },
      async deactivateService(id) {
        const updatedAt = new Date().toISOString();

        if (useFirestore && db && user) {
          await setDoc(serviceDoc(db, user.uid, id), { isActive: false, updatedAt }, { merge: true });
        } else {
          commitLocal((current) => ({
            ...current,
            services: current.services.map((item) => (item.id === id ? { ...item, isActive: false, updatedAt } : item)),
          }));
        }
      },
      async upsertFixedExpense(input) {
        const timestamp = new Date().toISOString();
        const id = input.id ?? createId("fixed");
        const nextExpense: FixedExpense = {
          id,
          name: input.name,
          amount: input.amount,
          isActive: true,
          createdAt: state.fixedExpenses.find((item) => item.id === id)?.createdAt ?? timestamp,
          updatedAt: timestamp,
        };

        if (useFirestore && db && user) {
          await setDoc(fixedExpenseDoc(db, user.uid, id), withoutId(nextExpense), { merge: true });
        } else {
          commitLocal((current) => ({
            ...current,
            fixedExpenses: input.id
              ? current.fixedExpenses.map((item) => (item.id === input.id ? { ...item, ...nextExpense } : item))
              : [...current.fixedExpenses, nextExpense],
          }));
        }
      },
      async updateSalaryTarget(salaryTarget) {
        const nextSettings = { salaryTarget, updatedAt: new Date().toISOString() };

        if (useFirestore && db && user) {
          await setDoc(financialSettingsDoc(db, user.uid), nextSettings, { merge: true });
        } else {
          commitLocal((current) => ({ ...current, financialSettings: nextSettings }));
        }
      },
    }),
    [db, error, isLoading, state, useFirestore, user],
  );

  return <SpaDataContext.Provider value={value}>{children}</SpaDataContext.Provider>;
}

export function useSpaData() {
  const context = useContext(SpaDataContext);
  if (!context) {
    throw new Error("useSpaData debe usarse dentro de SpaDataProvider");
  }

  return context;
}

export const defaultTransactionDate = formatInputDate;
