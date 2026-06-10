# Integración de Onboarding con Firestore

Cuando exista la UI completa de onboarding, el flujo debe llamar `initializeUserBusiness` después de validar el formulario y antes de redirigir al dashboard.

```ts
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/auth/AuthContext";
import { db } from "../../shared/lib/firebase";
import { initializeUserBusiness } from "./services/initializeUserBusiness";

export function useCompleteOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return async function completeOnboarding(formValues: {
    businessName: string;
    ownerSalaryTarget: number;
  }) {
    if (!db || !user) {
      throw new Error("No pudimos conectar con Firebase. Intenta de nuevo.");
    }

    const result = await initializeUserBusiness({
      db,
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      businessName: formValues.businessName,
      ownerSalaryTarget: formValues.ownerSalaryTarget,
    });

    if (result.success) {
      navigate("/");
    }
  };
}
```

La función es idempotente: si `users/{uid}/businesses/main` ya existe y `users/{uid}.onboardingCompleted` es `true`, retorna `alreadyInitialized: true` y no duplica servicios, categorías ni gastos fijos.

En el corte actual, mientras no existe una pantalla dedicada de onboarding, `SpaDataProvider` llama esa misma función después del login para dejar la estructura base creada automáticamente.
