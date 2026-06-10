export type TransactionType = "income" | "expense" | "withdrawal";

export type PaymentMethod = "cash" | "transfer" | "other";

export type ExpenseType = "fixed" | "variable" | "extraordinary";

export type UserProfile = {
  id: string;
  email: string | null;
  displayName: string | null;
  onboardingCompleted: boolean;
  currentBusinessId: string | null;
  createdAt: unknown;
  updatedAt: unknown;
};

export type Business = {
  id: string;
  name: string;
  currency: "COP";
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type Service = {
  id: string;
  name: string;
  defaultPrice: number;
  estimatedCost: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FixedExpense = {
  id: string;
  name: string;
  amount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseCategory = {
  id: string;
  name: string;
  color?: string;
  isActive: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type FinancialSettings = {
  salaryTarget: number;
  createdAt?: unknown;
  updatedAt: unknown;
};

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: unknown;
  updatedAt: unknown;
  serviceId?: string | null;
  serviceName?: string | null;
  priceAtTime?: number | null;
  costAtTime?: number | null;
  categoryId?: string | null;
  categoryName?: string | null;
  expenseType?: ExpenseType | null;
};

export type EducationalConcept = {
  id: string;
  title: string;
  description: string;
  example: string;
  decisionHelp: string;
  isActive: boolean;
};
