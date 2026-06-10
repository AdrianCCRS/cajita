import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "firebase/auth";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { hasFirebaseEnv } from "../../config/env";
import { getFirebaseAuth } from "../lib/firebase";

type AuthContextValue = {
  isFirebaseEnabled: boolean;
  isLoading: boolean;
  user: User | null;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const isFirebaseEnabled = hasFirebaseEnv();
  const auth = getFirebaseAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(isFirebaseEnabled);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseEnabled || !auth) {
      setIsLoading(false);
      return undefined;
    }

    return onAuthStateChanged(
      auth,
      (nextUser) => {
        setUser(nextUser);
        setIsLoading(false);
      },
      () => {
        setAuthError("No pudimos revisar tu sesión. Intenta de nuevo en un momento.");
        setIsLoading(false);
      },
    );
  }, [auth, isFirebaseEnabled]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isFirebaseEnabled,
      isLoading,
      user,
      authError,
      async signIn(email, password) {
        if (!auth) {
          return;
        }
        setAuthError(null);
        await signInWithEmailAndPassword(auth, email, password);
      },
      async signUp(email, password) {
        if (!auth) {
          return;
        }
        setAuthError(null);
        await createUserWithEmailAndPassword(auth, email, password);
      },
      async resetPassword(email) {
        if (!auth) {
          return;
        }
        setAuthError(null);
        await sendPasswordResetEmail(auth, email);
      },
      async signOut() {
        if (!auth) {
          return;
        }
        await firebaseSignOut(auth);
      },
    }),
    [auth, authError, isFirebaseEnabled, isLoading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }

  return context;
}
