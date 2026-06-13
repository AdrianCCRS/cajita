import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  deleteDoc,
  getDoc,
  onSnapshot,
  setDoc,
  type CollectionReference,
  type DocumentData,
} from "firebase/firestore";
import { defaultCategories, defaultFixedExpenses, defaultPersonalExpenseCategories, defaultServices } from "../../features/onboarding/constants/defaultSeeds";
import { registerExpense, registerIncome, registerPersonalVoucher, registerWithdrawal } from "../../features/transactions/services/createTransaction";
import { useAuth } from "../auth/AuthContext";
import {
  businessDoc,
  categoriesCollection,
  financialSettingsDoc,
  fixedExpenseDoc,
  fixedExpensesCollection,
  personalExpenseCategoriesCollection,
  personalExpenseCategoryDoc,
  rawMaterialDoc,
  rawMaterialPriceHistoryDoc,
  rawMaterialsCollection,
  serviceDoc,
  serviceMaterialDoc,
  serviceMaterialsCollection,
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
  PersonalExpenseCategory,
  RawMaterial,
  RawMaterialPriceHistory,
  Service,
  ServiceMaterial,
  Transaction,
} from "../types/domain";
import { formatInputDate } from "../utils/dates";
import { buildRawMaterialCalculation, buildServiceMaterial, calculateServiceEstimatedCost } from "../utils/rawMaterials";

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
    }
  | {
      type: "personal_voucher";
      personalCategoryId: string;
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
  upsertService: (input: Pick<Service, "name" | "defaultPrice" | "estimatedCost"> & { id?: string; costCalculationMode?: Service["costCalculationMode"] }) => Promise<void>;
  deactivateService: (id: string) => Promise<void>;
  upsertRawMaterial: (input: RawMaterialInput) => Promise<void>;
  deleteRawMaterial: (id: string) => Promise<void>;
  upsertServiceMaterial: (serviceId: string, input: ServiceMaterialInput) => Promise<void>;
  deleteServiceMaterial: (serviceId: string, materialId: string) => Promise<void>;
  upsertFixedExpense: (input: Pick<FixedExpense, "name" | "amount"> & { id?: string }) => Promise<void>;
  updateSalaryTarget: (salaryTarget: number) => Promise<void>;
};

type RawMaterialInput = Pick<RawMaterial, "name" | "measurementType" | "purchaseQuantity" | "purchaseUnit" | "purchasePrice"> & {
  id?: string;
  stockQuantity?: number;
  minimumStock?: number | null;
};

type ServiceMaterialInput = {
  id?: string;
  rawMaterialId: string;
  servicesCovered: number;
};

const storageKey = "spa-control-demo-v1";
const now = new Date().toISOString();

type SpaState = {
  business: Business;
  services: Service[];
  rawMaterials: RawMaterial[];
  serviceMaterialsByServiceId: Record<string, ServiceMaterial[]>;
  rawMaterialPriceHistoryByMaterialId: Record<string, RawMaterialPriceHistory[]>;
  fixedExpenses: FixedExpense[];
  categories: ExpenseCategory[];
  personalExpenseCategories: PersonalExpenseCategory[];
  transactions: Transaction[];
  financialSettings: FinancialSettings;
};

const initialState: SpaState = {
  business: { id: "main", name: "Spa Bella", currency: "COP" as const },
  services: defaultServices.map((item) => ({ ...item, createdAt: now, updatedAt: now })),
  rawMaterials: [],
  serviceMaterialsByServiceId: {},
  rawMaterialPriceHistoryByMaterialId: {},
  fixedExpenses: defaultFixedExpenses.map((item) => ({ ...item, createdAt: now, updatedAt: now })),
  categories: defaultCategories.map((item) => ({ ...item, createdAt: now, updatedAt: now })),
  personalExpenseCategories: defaultPersonalExpenseCategories.map((item) => ({ ...item, createdAt: now, updatedAt: now })),
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
    const materialsSnapshot = (state.serviceMaterialsByServiceId[selectedService.id] ?? []).map((material) => ({
      rawMaterialId: material.rawMaterialId,
      rawMaterialName: material.rawMaterialName,
      servicesCovered: material.servicesCovered,
      quantityUsed: material.quantityUsed,
      unitType: material.unitType,
      unitCostSnapshot: material.unitCostSnapshot,
      totalCost: material.totalCost,
    }));

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
      materialsSnapshot,
      categoryId: null,
      categoryName: null,
      personalCategoryId: null,
      personalCategoryName: null,
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
      personalCategoryId: null,
      personalCategoryName: null,
      expenseType: input.expenseType,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  if (input.type === "withdrawal") {
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
      personalCategoryId: null,
      personalCategoryName: null,
      expenseType: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  const selectedPersonalCategory = state.personalExpenseCategories.find((item) => item.id === input.personalCategoryId);

  return {
    id: createId("transaction"),
    type: "personal_voucher",
    amount: input.amount,
    date: input.date,
    paymentMethod: input.paymentMethod,
    notes: input.notes,
    serviceId: null,
    serviceName: null,
    priceAtTime: null,
    costAtTime: null,
    categoryId: null,
    categoryName: null,
    personalCategoryId: selectedPersonalCategory?.id ?? input.personalCategoryId,
    personalCategoryName: selectedPersonalCategory?.name ?? "Otros",
    expenseType: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function recalculateServicesForMaterials(
  current: SpaState,
  nextMaterialsByServiceId: Record<string, ServiceMaterial[]>,
): Service[] {
  return current.services.map((service) => {
    if (service.costCalculationMode !== "automatic") {
      return service;
    }

    return {
      ...service,
      estimatedCost: calculateServiceEstimatedCost(nextMaterialsByServiceId[service.id] ?? []),
      updatedAt: new Date().toISOString(),
    };
  });
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
        docsWithId<RawMaterial>(rawMaterialsCollection(db, user.uid), (rawMaterials) => {
          setState((current) => ({ ...current, rawMaterials }));
        }),
        docsWithId<FixedExpense>(fixedExpensesCollection(db, user.uid), (fixedExpenses) => {
          setState((current) => ({ ...current, fixedExpenses }));
        }),
        docsWithId<ExpenseCategory>(categoriesCollection(db, user.uid), (categories) => {
          setState((current) => ({ ...current, categories }));
        }),
        docsWithId<PersonalExpenseCategory>(personalExpenseCategoriesCollection(db, user.uid), (personalExpenseCategories) => {
          setState((current) => ({
            ...current,
            personalExpenseCategories: personalExpenseCategories.length ? personalExpenseCategories : initialState.personalExpenseCategories,
          }));
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

  useEffect(() => {
    if (!useFirestore || !db || !user || state.services.length === 0) {
      return undefined;
    }

    const unsubscribers = state.services.map((service) =>
      docsWithId<ServiceMaterial>(serviceMaterialsCollection(db, user.uid, service.id), (materials) => {
        setState((current) => ({
          ...current,
          serviceMaterialsByServiceId: {
            ...current.serviceMaterialsByServiceId,
            [service.id]: materials,
          },
        }));
      }),
    );

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [db, state.services, useFirestore, user]);

  useEffect(() => {
    if (!useFirestore || !db || !user) {
      return;
    }

    void Promise.all(
      defaultPersonalExpenseCategories.map(async (category) => {
        const categoryRef = personalExpenseCategoryDoc(db, user.uid, category.id);
        const snapshot = await getDoc(categoryRef);
        if (snapshot.exists()) {
          return;
        }

        const timestamp = new Date().toISOString();
        await setDoc(categoryRef, {
          name: category.name,
          color: category.color,
          isActive: category.isActive,
          createdAt: timestamp,
          updatedAt: timestamp,
        }, { merge: true });
      }),
    );
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
              materialsSnapshot: transaction.materialsSnapshot,
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

          if (input.type === "withdrawal") {
            return registerWithdrawal({
              db,
              uid: user.uid,
              amount: input.amount,
              date: input.date,
              paymentMethod: input.paymentMethod,
              notes: input.notes,
            });
          }

          const selectedPersonalCategory = state.personalExpenseCategories.find((item) => item.id === input.personalCategoryId);

          return registerPersonalVoucher({
            db,
            uid: user.uid,
            amount: input.amount,
            date: input.date,
            personalCategoryId: selectedPersonalCategory?.id ?? input.personalCategoryId,
            personalCategoryName: selectedPersonalCategory?.name ?? "Otros",
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
          costCalculationMode: input.costCalculationMode ?? "manual",
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
      async upsertRawMaterial(input) {
        const timestamp = new Date().toISOString();
        const id = input.id ?? createId("raw");
        const previous = state.rawMaterials.find((item) => item.id === id);
        const calculation = buildRawMaterialCalculation(input);
        const nextRawMaterial: RawMaterial = {
          id,
          name: input.name,
          measurementType: input.measurementType,
          purchaseQuantity: input.purchaseQuantity,
          purchaseUnit: input.purchaseUnit,
          baseQuantity: calculation.baseQuantity,
          baseUnit: calculation.baseUnit,
          purchasePrice: input.purchasePrice,
          unitCost: calculation.unitCost,
          stockQuantity: input.stockQuantity ?? previous?.stockQuantity ?? calculation.baseQuantity,
          minimumStock: input.minimumStock ?? null,
          isActive: true,
          createdAt: previous?.createdAt ?? timestamp,
          updatedAt: timestamp,
        };

        const nextMaterialsByServiceId = Object.fromEntries(
          Object.entries(state.serviceMaterialsByServiceId).map(([serviceId, materials]) => [
            serviceId,
            materials.map((material) => {
              if (material.rawMaterialId !== id) {
                return material;
              }

              const servicesCovered = material.servicesCovered ?? Math.max(1, previous?.baseQuantity ? previous.baseQuantity / material.quantityUsed : 1);

              return {
                ...material,
                rawMaterialName: nextRawMaterial.name,
                unitType: nextRawMaterial.baseUnit,
                servicesCovered,
                quantityUsed: nextRawMaterial.baseQuantity / servicesCovered,
                unitCostSnapshot: nextRawMaterial.unitCost,
                totalCost: nextRawMaterial.purchasePrice / servicesCovered,
                updatedAt: timestamp,
              };
            }),
          ]),
        );
        const nextServices = recalculateServicesForMaterials(state, nextMaterialsByServiceId);

        const priceChanged = previous && (
          previous.purchasePrice !== nextRawMaterial.purchasePrice ||
          previous.unitCost !== nextRawMaterial.unitCost ||
          previous.baseQuantity !== nextRawMaterial.baseQuantity
        );

        if (useFirestore && db && user) {
          await setDoc(rawMaterialDoc(db, user.uid, id), withoutId(nextRawMaterial), { merge: true });

          if (priceChanged) {
            const historyId = createId("price");
            const history: RawMaterialPriceHistory = {
              id: historyId,
              previousPurchasePrice: previous.purchasePrice,
              newPurchasePrice: nextRawMaterial.purchasePrice,
              previousUnitCost: previous.unitCost,
              newUnitCost: nextRawMaterial.unitCost,
              previousBaseQuantity: previous.baseQuantity,
              newBaseQuantity: nextRawMaterial.baseQuantity,
              changedAt: timestamp,
            };
            await setDoc(rawMaterialPriceHistoryDoc(db, user.uid, id, historyId), withoutId(history));
          }

          await Promise.all(
            Object.entries(nextMaterialsByServiceId).flatMap(([serviceId, materials]) =>
              materials
                .filter((material) => material.rawMaterialId === id)
                .map((material) => setDoc(serviceMaterialDoc(db, user.uid, serviceId, material.id), withoutId(material), { merge: true })),
            ),
          );

          await Promise.all(
            nextServices
              .filter((service) => service.costCalculationMode === "automatic")
              .map((service) => setDoc(serviceDoc(db, user.uid, service.id), withoutId(service), { merge: true })),
          );

          setState((current) => ({
            ...current,
            rawMaterials: current.rawMaterials.some((item) => item.id === id)
              ? current.rawMaterials.map((item) => (item.id === id ? nextRawMaterial : item))
              : [...current.rawMaterials, nextRawMaterial],
            serviceMaterialsByServiceId: nextMaterialsByServiceId,
            services: nextServices,
          }));
        } else {
          commitLocal((current) => ({
            ...current,
            rawMaterials: current.rawMaterials.some((item) => item.id === id)
              ? current.rawMaterials.map((item) => (item.id === id ? nextRawMaterial : item))
              : [...current.rawMaterials, nextRawMaterial],
            serviceMaterialsByServiceId: nextMaterialsByServiceId,
            services: nextServices,
            rawMaterialPriceHistoryByMaterialId: priceChanged
              ? {
                  ...current.rawMaterialPriceHistoryByMaterialId,
                  [id]: [
                    {
                      id: createId("price"),
                      previousPurchasePrice: previous.purchasePrice,
                      newPurchasePrice: nextRawMaterial.purchasePrice,
                      previousUnitCost: previous.unitCost,
                      newUnitCost: nextRawMaterial.unitCost,
                      previousBaseQuantity: previous.baseQuantity,
                      newBaseQuantity: nextRawMaterial.baseQuantity,
                      changedAt: timestamp,
                    },
                    ...(current.rawMaterialPriceHistoryByMaterialId[id] ?? []),
                  ],
                }
              : current.rawMaterialPriceHistoryByMaterialId,
          }));
        }
      },
      async deleteRawMaterial(id) {
        const updatedAt = new Date().toISOString();

        if (useFirestore && db && user) {
          await setDoc(rawMaterialDoc(db, user.uid, id), { isActive: false, updatedAt }, { merge: true });
        } else {
          commitLocal((current) => ({
            ...current,
            rawMaterials: current.rawMaterials.map((material) => (material.id === id ? { ...material, isActive: false, updatedAt } : material)),
          }));
        }
      },
      async upsertServiceMaterial(serviceId, input) {
        const timestamp = new Date().toISOString();
        const rawMaterial = state.rawMaterials.find((material) => material.id === input.rawMaterialId);
        if (!rawMaterial) {
          throw new Error("Elige un insumo válido.");
        }

        const id = input.id ?? rawMaterial.id;
        const previous = state.serviceMaterialsByServiceId[serviceId]?.find((material) => material.id === id);
        const nextMaterial: ServiceMaterial = {
          id,
          ...buildServiceMaterial(rawMaterial, input.servicesCovered),
          createdAt: previous?.createdAt ?? timestamp,
          updatedAt: timestamp,
        };
        const currentMaterials = state.serviceMaterialsByServiceId[serviceId] ?? [];
        const nextServiceMaterials = currentMaterials.some((material) => material.id === id)
          ? currentMaterials.map((material) => (material.id === id ? nextMaterial : material))
          : [...currentMaterials, nextMaterial];
        const nextMaterialsByServiceId = {
          ...state.serviceMaterialsByServiceId,
          [serviceId]: nextServiceMaterials,
        };
        const nextEstimatedCost = calculateServiceEstimatedCost(nextServiceMaterials);

        if (useFirestore && db && user) {
          await setDoc(serviceMaterialDoc(db, user.uid, serviceId, id), withoutId(nextMaterial), { merge: true });
          await setDoc(serviceDoc(db, user.uid, serviceId), {
            estimatedCost: nextEstimatedCost,
            costCalculationMode: "automatic",
            updatedAt: timestamp,
          }, { merge: true });
        }

        commitLocal((current) => ({
          ...current,
          serviceMaterialsByServiceId: nextMaterialsByServiceId,
          services: current.services.map((service) =>
            service.id === serviceId
              ? { ...service, estimatedCost: nextEstimatedCost, costCalculationMode: "automatic", updatedAt: timestamp }
              : service,
          ),
        }));
      },
      async deleteServiceMaterial(serviceId, materialId) {
        const timestamp = new Date().toISOString();
        const nextServiceMaterials = (state.serviceMaterialsByServiceId[serviceId] ?? []).filter((material) => material.id !== materialId);
        const nextEstimatedCost = calculateServiceEstimatedCost(nextServiceMaterials);

        if (useFirestore && db && user) {
          await deleteDoc(serviceMaterialDoc(db, user.uid, serviceId, materialId));
          await setDoc(serviceDoc(db, user.uid, serviceId), {
            estimatedCost: nextEstimatedCost,
            costCalculationMode: "automatic",
            updatedAt: timestamp,
          }, { merge: true });
        }

        commitLocal((current) => ({
          ...current,
          serviceMaterialsByServiceId: {
            ...current.serviceMaterialsByServiceId,
            [serviceId]: nextServiceMaterials,
          },
          services: current.services.map((service) =>
            service.id === serviceId
              ? { ...service, estimatedCost: nextEstimatedCost, costCalculationMode: "automatic", updatedAt: timestamp }
              : service,
          ),
        }));
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
