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

export function financialSettingsDoc(db: Firestore, userId: string) {
  return doc(businessDoc(db, userId), "financialSettings", "main");
}

export function educationalConceptsCollection(db: Firestore) {
  return collection(db, "educationalConcepts");
}

export function educationalConceptDoc(db: Firestore, conceptId: string) {
  return doc(db, "educationalConcepts", conceptId);
}
