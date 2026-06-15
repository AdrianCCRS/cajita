import { describe, expect, it, vi } from "vitest";
import type { Firestore } from "firebase/firestore";

vi.mock("firebase/firestore", () => {
  function makeRef(type: "document" | "collection", path: string) {
    return {
      type,
      path,
      id: path.split("/").pop() ?? "",
      parent: null,
      firestore: null,
      converter: null,
    };
  }

  return {
    collection: vi.fn((parent: unknown, path: string) => {
      const parentPath = (parent as { path?: string })?.path ?? "";
      return makeRef("collection", parentPath ? `${parentPath}/${path}` : path);
    }),
    doc: vi.fn((parent: unknown, ...segments: string[]) => {
      const parentPath = (parent as { path?: string; type?: string })?.path ?? "";
      const parentType = (parent as { type?: string })?.type;
      if (parentType === "collection" || parentType === "document") {
        return makeRef("document", `${parentPath}/${segments.join("/")}`);
      }
      return makeRef("document", segments.join("/"));
    }),
    getFirestore: vi.fn(),
    initializeFirestore: vi.fn(),
    connectFirestoreEmulator: vi.fn(),
    serverTimestamp: vi.fn(() => new Date()),
    writeBatch: vi.fn(),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    addDoc: vi.fn(),
    deleteDoc: vi.fn(),
    onSnapshot: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
  };
});

import {
  businessDoc,
  categoriesCollection,
  categoryDoc,
  defaultBusinessId,
  educationalConceptDoc,
  educationalConceptsCollection,
  financialSettingsDoc,
  fixedExpenseDoc,
  fixedExpensesCollection,
  personalExpenseCategoriesCollection,
  personalExpenseCategoryDoc,
  rawMaterialDoc,
  rawMaterialPriceHistoryCollection,
  rawMaterialPriceHistoryDoc,
  rawMaterialsCollection,
  serviceDoc,
  serviceMaterialDoc,
  serviceMaterialsCollection,
  servicesCollection,
  transactionDoc,
  transactionsCollection,
  uiSettingsDoc,
  userDoc,
} from "./firestorePaths";

function fakeDb() {
  return { type: "firestore", projectId: "test" } as unknown as Firestore;
}

describe("firestorePaths", () => {
  const db = fakeDb();
  const uid = "user-abc-123";

  it("userDoc construye la ruta correcta", () => {
    const ref = userDoc(db, uid);
    expect(ref.path).toBe("users/user-abc-123");
    expect(ref.type).toBe("document");
  });

  it("businessDoc construye la ruta correcta", () => {
    const ref = businessDoc(db, uid);
    expect(ref.path).toBe("users/user-abc-123/businesses/main");
    expect(ref.type).toBe("document");
  });

  it("servicesCollection construye la ruta correcta", () => {
    const ref = servicesCollection(db, uid);
    expect(ref.path).toBe("users/user-abc-123/businesses/main/services");
    expect(ref.type).toBe("collection");
  });

  it("serviceDoc construye la ruta correcta con id", () => {
    const ref = serviceDoc(db, uid, "svc_manicura");
    expect(ref.path).toBe("users/user-abc-123/businesses/main/services/svc_manicura");
    expect(ref.type).toBe("document");
  });

  it("serviceMaterialsCollection construye la subcoleccion correcta", () => {
    const ref = serviceMaterialsCollection(db, uid, "svc_manicura");
    expect(ref.path).toBe("users/user-abc-123/businesses/main/services/svc_manicura/materials");
    expect(ref.type).toBe("collection");
  });

  it("serviceMaterialDoc construye la ruta correcta con id", () => {
    const ref = serviceMaterialDoc(db, uid, "svc_manicura", "raw_removedor");
    expect(ref.path).toBe("users/user-abc-123/businesses/main/services/svc_manicura/materials/raw_removedor");
    expect(ref.type).toBe("document");
  });

  it("rawMaterialsCollection construye la ruta correcta", () => {
    const ref = rawMaterialsCollection(db, uid);
    expect(ref.path).toBe("users/user-abc-123/businesses/main/rawMaterials");
    expect(ref.type).toBe("collection");
  });

  it("rawMaterialDoc construye la ruta correcta con id", () => {
    const ref = rawMaterialDoc(db, uid, "raw_removedor");
    expect(ref.path).toBe("users/user-abc-123/businesses/main/rawMaterials/raw_removedor");
    expect(ref.type).toBe("document");
  });

  it("rawMaterialPriceHistoryCollection construye la subcoleccion correcta", () => {
    const ref = rawMaterialPriceHistoryCollection(db, uid, "raw_removedor");
    expect(ref.path).toBe("users/user-abc-123/businesses/main/rawMaterials/raw_removedor/priceHistory");
    expect(ref.type).toBe("collection");
  });

  it("rawMaterialPriceHistoryDoc construye la ruta correcta con id", () => {
    const ref = rawMaterialPriceHistoryDoc(db, uid, "raw_removedor", "history-1");
    expect(ref.path).toBe("users/user-abc-123/businesses/main/rawMaterials/raw_removedor/priceHistory/history-1");
    expect(ref.type).toBe("document");
  });

  it("transactionsCollection construye la ruta correcta", () => {
    const ref = transactionsCollection(db, uid);
    expect(ref.path).toBe("users/user-abc-123/businesses/main/transactions");
    expect(ref.type).toBe("collection");
  });

  it("transactionDoc construye la ruta correcta con id", () => {
    const ref = transactionDoc(db, uid, "tx-001");
    expect(ref.path).toBe("users/user-abc-123/businesses/main/transactions/tx-001");
    expect(ref.type).toBe("document");
  });

  it("fixedExpensesCollection construye la ruta correcta", () => {
    const ref = fixedExpensesCollection(db, uid);
    expect(ref.path).toBe("users/user-abc-123/businesses/main/fixedExpenses");
    expect(ref.type).toBe("collection");
  });

  it("fixedExpenseDoc construye la ruta correcta con id", () => {
    const ref = fixedExpenseDoc(db, uid, "fe_arriendo");
    expect(ref.path).toBe("users/user-abc-123/businesses/main/fixedExpenses/fe_arriendo");
    expect(ref.type).toBe("document");
  });

  it("categoriesCollection construye la ruta correcta", () => {
    const ref = categoriesCollection(db, uid);
    expect(ref.path).toBe("users/user-abc-123/businesses/main/categories");
    expect(ref.type).toBe("collection");
  });

  it("categoryDoc construye la ruta correcta con id", () => {
    const ref = categoryDoc(db, uid, "cat_insumos");
    expect(ref.path).toBe("users/user-abc-123/businesses/main/categories/cat_insumos");
    expect(ref.type).toBe("document");
  });

  it("personalExpenseCategoriesCollection construye la ruta correcta", () => {
    const ref = personalExpenseCategoriesCollection(db, uid);
    expect(ref.path).toBe("users/user-abc-123/businesses/main/personalExpenseCategories");
    expect(ref.type).toBe("collection");
  });

  it("personalExpenseCategoryDoc construye la ruta correcta con id", () => {
    const ref = personalExpenseCategoryDoc(db, uid, "pec_alimentacion");
    expect(ref.path).toBe("users/user-abc-123/businesses/main/personalExpenseCategories/pec_alimentacion");
    expect(ref.type).toBe("document");
  });

  it("financialSettingsDoc construye la ruta correcta", () => {
    const ref = financialSettingsDoc(db, uid);
    expect(ref.path).toBe("users/user-abc-123/businesses/main/financialSettings/main");
    expect(ref.type).toBe("document");
  });

  it("uiSettingsDoc construye la ruta correcta", () => {
    const ref = uiSettingsDoc(db, uid);
    expect(ref.path).toBe("users/user-abc-123/businesses/main/uiSettings/main");
    expect(ref.type).toBe("document");
  });

  it("educationalConceptsCollection es una coleccion global", () => {
    const ref = educationalConceptsCollection(db);
    expect(ref.path).toBe("educationalConcepts");
    expect(ref.type).toBe("collection");
  });

  it("educationalConceptDoc es un documento global", () => {
    const ref = educationalConceptDoc(db, "concept-1");
    expect(ref.path).toBe("educationalConcepts/concept-1");
    expect(ref.type).toBe("document");
  });

  it("defaultBusinessId es 'main'", () => {
    expect(defaultBusinessId).toBe("main");
  });
});
