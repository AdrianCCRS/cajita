import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Firestore } from "firebase/firestore";
import { initializeUserBusiness } from "./initializeUserBusiness";
import { defaultBusinessId } from "../../../shared/lib/firestorePaths";

const { batchSetMock, batchCommitMock, getDocMock, timestamp } = vi.hoisted(() => ({
  batchSetMock: vi.fn(),
  batchCommitMock: vi.fn(),
  getDocMock: vi.fn(),
  timestamp: { kind: "serverTimestamp" },
}));

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
    getDoc: getDocMock,
    serverTimestamp: vi.fn(() => timestamp),
    writeBatch: vi.fn(() => ({
      set: batchSetMock,
      commit: batchCommitMock,
    })),
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
  };
});

function fakeDb() {
  return {} as Firestore;
}

const validInput = {
  db: fakeDb(),
  uid: "user-abc-123",
  email: "dueña@spa.com",
  displayName: "Dueña",
  businessName: "Spa Bella",
  ownerSalaryTarget: 1800000,
};

function missingSnapshot() {
  return {
    exists: () => false,
    data: () => undefined,
  };
}

beforeEach(() => {
  batchSetMock.mockReset();
  batchCommitMock.mockReset();
  getDocMock.mockReset();
  getDocMock.mockResolvedValue(missingSnapshot());
  batchCommitMock.mockResolvedValue(undefined);
});

describe("initializeUserBusiness", () => {
  it("lanza error si uid esta vacio", async () => {
    await expect(
      initializeUserBusiness({ ...validInput, uid: "" }),
    ).rejects.toThrow("No se pudo inicializar el negocio porque falta el usuario.");
  });

  it("lanza error si uid solo tiene espacios", async () => {
    await expect(
      initializeUserBusiness({ ...validInput, uid: "   " }),
    ).rejects.toThrow("No se pudo inicializar el negocio porque falta el usuario.");
  });

  it("lanza error si businessName esta vacio", async () => {
    await expect(
      initializeUserBusiness({ ...validInput, businessName: "" }),
    ).rejects.toThrow("El nombre del negocio no puede estar vacío.");
  });

  it("lanza error si businessName solo tiene espacios", async () => {
    await expect(
      initializeUserBusiness({ ...validInput, businessName: "   " }),
    ).rejects.toThrow("El nombre del negocio no puede estar vacío.");
  });

  it("lanza error si ownerSalaryTarget es negativo", async () => {
    await expect(
      initializeUserBusiness({ ...validInput, ownerSalaryTarget: -100 }),
    ).rejects.toThrow("El salario mensual debe ser mayor o igual a $0.");
  });

  it("lanza error si ownerSalaryTarget es NaN", async () => {
    await expect(
      initializeUserBusiness({ ...validInput, ownerSalaryTarget: NaN }),
    ).rejects.toThrow("El salario mensual debe ser mayor o igual a $0.");
  });

  it("lanza error si ownerSalaryTarget es Infinity", async () => {
    await expect(
      initializeUserBusiness({ ...validInput, ownerSalaryTarget: Infinity }),
    ).rejects.toThrow("El salario mensual debe ser mayor o igual a $0.");
  });

  it("acepta salario en cero", async () => {
    const result = await initializeUserBusiness({
      ...validInput,
      ownerSalaryTarget: 0,
      services: [],
      fixedExpenses: [],
      categories: [],
    });

    expect(result).toEqual({
      success: true,
      businessId: defaultBusinessId,
      alreadyInitialized: false,
    });
    expect(batchSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "users/user-abc-123/businesses/main/financialSettings/main",
      }),
      expect.objectContaining({
        salaryTarget: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      }),
      { merge: true },
    );
    expect(batchCommitMock).toHaveBeenCalledTimes(1);
  });
});
