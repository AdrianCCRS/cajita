import { getDoc, serverTimestamp, writeBatch, type Firestore } from "firebase/firestore";
import { defaultBusinessId, businessDoc, categoryDoc, financialSettingsDoc, fixedExpenseDoc, personalExpenseCategoryDoc, serviceDoc, userDoc } from "../../../shared/lib/firestorePaths";
import type { ExpenseCategory, FixedExpense, PersonalExpenseCategory, Service } from "../../../shared/types/domain";
import { defaultCategories, defaultFixedExpenses, defaultPersonalExpenseCategories, defaultServices } from "../constants/defaultSeeds";

type InitializeUserBusinessInput = {
  db: Firestore;
  uid: string;
  email: string | null;
  displayName: string | null;
  businessName: string;
  ownerSalaryTarget: number;
  services?: ServiceSeedInput[];
  fixedExpenses?: FixedExpenseSeedInput[];
  categories?: CategorySeedInput[];
  personalExpenseCategories?: PersonalExpenseCategorySeedInput[];
};

type ServiceSeedInput = Pick<Service, "id" | "name" | "defaultPrice" | "estimatedCost" | "isActive">;
type FixedExpenseSeedInput = Pick<FixedExpense, "id" | "name" | "amount" | "isActive">;
type CategorySeedInput = Pick<ExpenseCategory, "id" | "name" | "color" | "isActive">;
type PersonalExpenseCategorySeedInput = Pick<PersonalExpenseCategory, "id" | "name" | "color" | "isActive">;

type InitializeUserBusinessResult = {
  success: true;
  businessId: typeof defaultBusinessId;
  alreadyInitialized: boolean;
};

export async function initializeUserBusiness(
  input: InitializeUserBusinessInput,
): Promise<InitializeUserBusinessResult> {
  const uid = input.uid.trim();
  const businessName = input.businessName.trim();

  if (!uid) {
    throw new Error("No se pudo inicializar el negocio porque falta el usuario.");
  }

  if (!businessName) {
    throw new Error("El nombre del negocio no puede estar vacío.");
  }

  if (!Number.isFinite(input.ownerSalaryTarget) || input.ownerSalaryTarget < 0) {
    throw new Error("El salario mensual debe ser mayor o igual a $0.");
  }

  const userRef = userDoc(input.db, uid);
  const businessRef = businessDoc(input.db, uid);
  const [userSnapshot, businessSnapshot] = await Promise.all([getDoc(userRef), getDoc(businessRef)]);
  const userData = userSnapshot.data();

  if (businessSnapshot.exists() && userData?.onboardingCompleted === true) {
    return { success: true, businessId: defaultBusinessId, alreadyInitialized: true };
  }

  const timestamp = serverTimestamp();
  const batch = writeBatch(input.db);
  const categories = input.categories?.length ? input.categories : defaultCategories;
  const personalExpenseCategories = input.personalExpenseCategories?.length ? input.personalExpenseCategories : defaultPersonalExpenseCategories;
  const services = input.services?.length ? input.services : defaultServices;
  const fixedExpenses = input.fixedExpenses?.length ? input.fixedExpenses : defaultFixedExpenses;

  batch.set(
    userRef,
    {
      email: input.email,
      displayName: input.displayName,
      currentBusinessId: defaultBusinessId,
      onboardingCompleted: true,
      createdAt: userSnapshot.exists() ? userData?.createdAt ?? timestamp : timestamp,
      updatedAt: timestamp,
    },
    { merge: true },
  );

  batch.set(
    businessRef,
    {
      name: businessName,
      currency: "COP",
      createdAt: businessSnapshot.exists() ? businessSnapshot.data()?.createdAt ?? timestamp : timestamp,
      updatedAt: timestamp,
    },
    { merge: true },
  );

  batch.set(
    financialSettingsDoc(input.db, uid),
    {
      salaryTarget: input.ownerSalaryTarget,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    { merge: true },
  );

  categories.forEach((category) => {
    batch.set(
      categoryDoc(input.db, uid, category.id),
      {
        name: category.name.trim(),
        color: category.color,
        isActive: category.isActive,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      { merge: true },
    );
  });

  personalExpenseCategories.forEach((category) => {
    batch.set(
      personalExpenseCategoryDoc(input.db, uid, category.id),
      {
        name: category.name.trim(),
        color: category.color,
        isActive: category.isActive,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      { merge: true },
    );
  });

  services.forEach((service) => {
    batch.set(
      serviceDoc(input.db, uid, service.id),
      {
        name: service.name.trim(),
        defaultPrice: service.defaultPrice,
        estimatedCost: service.estimatedCost,
        isActive: service.isActive,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      { merge: true },
    );
  });

  fixedExpenses.forEach((expense) => {
    batch.set(
      fixedExpenseDoc(input.db, uid, expense.id),
      {
        name: expense.name.trim(),
        amount: expense.amount,
        isActive: expense.isActive,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      { merge: true },
    );
  });

  await batch.commit();

  return { success: true, businessId: defaultBusinessId, alreadyInitialized: false };
}
