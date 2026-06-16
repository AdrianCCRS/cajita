import { collection, doc, type Firestore } from "firebase/firestore";

export const defaultBusinessId = "main";

export function userDoc(db: Firestore, userId: string) {
  return doc(db, "users", userId);
}

export function businessDoc(db: Firestore, userId: string) {
  return doc(db, "users", userId, "businesses", defaultBusinessId);
}

export function servicesCollection(db: Firestore, userId: string) {
  return collection(businessDoc(db, userId), "services");
}

export function serviceDoc(db: Firestore, userId: string, serviceId: string) {
  return doc(servicesCollection(db, userId), serviceId);
}

export function serviceMaterialsCollection(db: Firestore, userId: string, serviceId: string) {
  return collection(serviceDoc(db, userId, serviceId), "materials");
}

export function serviceMaterialDoc(db: Firestore, userId: string, serviceId: string, materialId: string) {
  return doc(serviceMaterialsCollection(db, userId, serviceId), materialId);
}

export function rawMaterialsCollection(db: Firestore, userId: string) {
  return collection(businessDoc(db, userId), "rawMaterials");
}

export function rawMaterialDoc(db: Firestore, userId: string, rawMaterialId: string) {
  return doc(rawMaterialsCollection(db, userId), rawMaterialId);
}

export function rawMaterialPriceHistoryCollection(db: Firestore, userId: string, rawMaterialId: string) {
  return collection(rawMaterialDoc(db, userId, rawMaterialId), "priceHistory");
}

export function rawMaterialPriceHistoryDoc(db: Firestore, userId: string, rawMaterialId: string, historyId: string) {
  return doc(rawMaterialPriceHistoryCollection(db, userId, rawMaterialId), historyId);
}

export function transactionsCollection(db: Firestore, userId: string) {
  return collection(businessDoc(db, userId), "transactions");
}

export function transactionDoc(db: Firestore, userId: string, transactionId: string) {
  return doc(transactionsCollection(db, userId), transactionId);
}

export function fixedExpensesCollection(db: Firestore, userId: string) {
  return collection(businessDoc(db, userId), "fixedExpenses");
}

export function fixedExpenseDoc(db: Firestore, userId: string, fixedExpenseId: string) {
  return doc(fixedExpensesCollection(db, userId), fixedExpenseId);
}

export function categoriesCollection(db: Firestore, userId: string) {
  return collection(businessDoc(db, userId), "categories");
}

export function categoryDoc(db: Firestore, userId: string, categoryId: string) {
  return doc(categoriesCollection(db, userId), categoryId);
}

export function personalExpenseCategoriesCollection(db: Firestore, userId: string) {
  return collection(businessDoc(db, userId), "personalExpenseCategories");
}

export function personalExpenseCategoryDoc(db: Firestore, userId: string, categoryId: string) {
  return doc(personalExpenseCategoriesCollection(db, userId), categoryId);
}

export function financialSettingsDoc(db: Firestore, userId: string) {
  return doc(businessDoc(db, userId), "financialSettings", "main");
}

export function uiSettingsDoc(db: Firestore, userId: string) {
  return doc(businessDoc(db, userId), "uiSettings", "main");
}

export function educationalConceptsCollection(db: Firestore) {
  return collection(db, "educationalConcepts");
}

export function educationalConceptDoc(db: Firestore, conceptId: string) {
  return doc(db, "educationalConcepts", conceptId);
}
