import { useEffect, useState, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./AppShell";
import { OnboardingScreen } from "../features/onboarding/OnboardingScreen";
import { LoginScreen } from "../features/auth/LoginScreen";
import { AuthProvider, useAuth } from "../shared/auth/AuthContext";
import { SpaDataProvider } from "../shared/data/SpaDataContext";
import { userDoc } from "../shared/lib/firestorePaths";
import { db } from "../shared/lib/firebase";
import { DashboardPlaceholder } from "../features/dashboard/DashboardPlaceholder";
import { HistoryPlaceholder } from "../features/transactions/HistoryPlaceholder";
import { ServicesPlaceholder } from "../features/services/ServicesPlaceholder";
import { SettingsPlaceholder } from "../features/settings/SettingsPlaceholder";
import { getDoc } from "firebase/firestore";
import { Card } from "../shared/components/ui";

export function App() {
  return (
    <AuthProvider>
      <AuthGate>
        <OnboardingGate>
          <SpaDataProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<AppShell />}>
                  <Route index element={<DashboardPlaceholder />} />
                  <Route path="historial" element={<HistoryPlaceholder />} />
                  <Route path="servicios" element={<ServicesPlaceholder />} />
                  <Route path="configuracion" element={<SettingsPlaceholder />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </SpaDataProvider>
        </OnboardingGate>
      </AuthGate>
    </AuthProvider>
  );
}

function AuthGate({ children }: { children: ReactNode }) {
  const { isFirebaseEnabled, isLoading, user } = useAuth();

  if (!isFirebaseEnabled) {
    return children;
  }

  if (isLoading) {
    return <LoadingScreen message="Revisando tu sesión…" />;
  }

  return user ? children : <LoginScreen />;
}

function OnboardingGate({ children }: { children: ReactNode }) {
  const { isFirebaseEnabled, user } = useAuth();
  const [isChecking, setIsChecking] = useState(isFirebaseEnabled);
  const [isCompleted, setIsCompleted] = useState(!isFirebaseEnabled);

  useEffect(() => {
    if (!isFirebaseEnabled) {
      setIsChecking(false);
      setIsCompleted(true);
      return;
    }

    if (!db || !user) {
      setIsChecking(false);
      setIsCompleted(false);
      return;
    }

    let cancelled = false;
    setIsChecking(true);

    getDoc(userDoc(db, user.uid))
      .then((snapshot) => {
        if (!cancelled) {
          setIsCompleted(snapshot.data()?.onboardingCompleted === true);
          setIsChecking(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsCompleted(false);
          setIsChecking(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isFirebaseEnabled, user]);

  if (!isFirebaseEnabled) {
    return children;
  }

  if (isChecking) {
    return <LoadingScreen message="Preparando tu negocio…" />;
  }

  return isCompleted ? children : <OnboardingScreen onComplete={() => setIsCompleted(true)} />;
}

function LoadingScreen({ message }: { message: string }) {
  return (
    <main className="auth-screen">
      <Card className="auth-panel ui-card">
        <Card.Content>
          <p className="eyebrow">Control financiero</p>
          <h1>Cajita</h1>
          <p>{message}</p>
        </Card.Content>
      </Card>
    </main>
  );
}
