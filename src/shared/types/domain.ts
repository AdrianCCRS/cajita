export type TransactionType = "income" | "expense" | "withdrawal" | "personal_voucher";

export type PaymentMethod = "cash" | "transfer" | "other";

export type ExpenseType = "fixed" | "variable" | "extraordinary";

export type MeasurementType = "volume" | "weight" | "unit";

export type PurchaseUnit = "ml" | "l" | "g" | "kg" | "unit";

export type BaseUnit = "ml" | "g" | "unit";

export type CostCalculationMode = "automatic" | "manual";

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
  costCalculationMode?: CostCalculationMode;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RawMaterial = {
  id: string;
  name: string;
  measurementType: MeasurementType;
  purchaseQuantity: number;
  purchaseUnit: PurchaseUnit;
  baseQuantity: number;
  baseUnit: BaseUnit;
  purchasePrice: number;
  unitCost: number;
  stockQuantity: number;
  minimumStock?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ServiceMaterial = {
  id: string;
  rawMaterialId: string;
  rawMaterialName: string;
  servicesCovered: number;
  quantityUsed: number;
  unitType: BaseUnit;
  unitCostSnapshot: number;
  totalCost: number;
  createdAt: string;
  updatedAt: string;
};

export type RawMaterialPriceHistory = {
  id: string;
  previousPurchasePrice: number;
  newPurchasePrice: number;
  previousUnitCost: number;
  newUnitCost: number;
  previousBaseQuantity: number;
  newBaseQuantity: number;
  reason?: string;
  changedAt: string;
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

export type PersonalExpenseCategory = {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type FinancialSettings = {
  salaryTarget: number;
  createdAt?: unknown;
  updatedAt: unknown;
};

export type ThemeMode = "light" | "dark";

export type UiSettings = {
  appAccentColor: string | null;
  themeMode: ThemeMode;
  createdAt?: unknown;
  updatedAt?: unknown;
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
  materialsSnapshot?: Array<Pick<ServiceMaterial, "rawMaterialId" | "rawMaterialName" | "servicesCovered" | "quantityUsed" | "unitType" | "unitCostSnapshot" | "totalCost">>;
  categoryId?: string | null;
  categoryName?: string | null;
  personalCategoryId?: string | null;
  personalCategoryName?: string | null;
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
