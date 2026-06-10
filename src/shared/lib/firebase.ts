import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { firebaseEnv, hasFirebaseEnv } from "../../config/env";

export const app: FirebaseApp | null = hasFirebaseEnv() ? initializeApp(firebaseEnv) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

export function getFirebaseApp() {
  return app;
}

export function getFirebaseAuth() {
  return auth;
}

export function getFirebaseDb() {
  return db;
}
