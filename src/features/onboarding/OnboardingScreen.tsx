import { Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useAuth } from "../../shared/auth/AuthContext";
import { db } from "../../shared/lib/firebase";
import type { ExpenseCategory, FixedExpense, Service } from "../../shared/types/domain";
import { formatCurrency } from "../../shared/utils/formatCurrency";
import { defaultCategories, defaultFixedExpenses, defaultServices } from "./constants/defaultSeeds";
import { initializeUserBusiness } from "./services/initializeUserBusiness";

type OnboardingScreenProps = {
  onComplete: () => void;
};

type ServiceDraft = Pick<Service, "id" | "name" | "defaultPrice" | "estimatedCost" | "isActive">;
type FixedExpenseDraft = Pick<FixedExpense, "id" | "name" | "amount" | "isActive">;
type CategoryDraft = Pick<ExpenseCategory, "id" | "name" | "color" | "isActive">;

const steps = ["Negocio", "Servicios", "Gastos"];

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { user, signOut } = useAuth();
  const [step, setStep] = useState(0);
  const [businessName, setBusinessName] = useState("Spa Bella");
  const [ownerSalaryTarget, setOwnerSalaryTarget] = useState("1800000");
  const [services, setServices] = useState<ServiceDraft[]>(
    defaultServices.map(({ id, name, defaultPrice, estimatedCost, isActive }) => ({
      id,
      name,
      defaultPrice,
      estimatedCost,
      isActive,
    })),
  );
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpenseDraft[]>(
    defaultFixedExpenses.map(({ id, name, amount, isActive }) => ({ id, name, amount, isActive })),
  );
  const [categories] = useState<CategoryDraft[]>(
    defaultCategories.map(({ id, name, color, isActive }) => ({ id, name, color, isActive })),
  );
  const [newServiceName, setNewServiceName] = useState("");
  const [newExpenseName, setNewExpenseName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeServices = services.filter((service) => service.isActive);
  const visibleFixedExpenses = fixedExpenses.filter((expense) => expense.isActive);
  const totalFixedExpenses = visibleFixedExpenses.reduce((total, expense) => total + expense.amount, 0);

  function nextStep() {
    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function previousStep() {
    setError("");
    setStep((current) => Math.max(current - 1, 0));
  }

  function validateCurrentStep() {
    if (step === 0) {
      if (!businessName.trim()) {
        return "Escribe el nombre del negocio.";
      }

      if (!Number.isFinite(Number(ownerSalaryTarget)) || Number(ownerSalaryTarget) < 0) {
        return "El salario mensual debe ser mayor o igual a $0.";
      }
    }

    if (step === 1) {
      if (activeServices.length === 0) {
        return "Aún no has configurado tus servicios. Es el primer paso.";
      }

      if (activeServices.some((service) => !service.name.trim() || service.defaultPrice <= 0 || service.estimatedCost < 0)) {
        return "Revisa que cada servicio tenga nombre, precio y costo válido.";
      }
    }

    if (step === 2 && visibleFixedExpenses.some((expense) => !expense.name.trim() || expense.amount < 0)) {
      return "Revisa que cada gasto fijo tenga nombre y valor válido.";
    }

    return "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateCurrentStep();

    if (validationError) {
      setError(validationError);
      return;
    }

    if (!db || !user) {
      setError("No pudimos conectar con Firebase. Intenta de nuevo.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await initializeUserBusiness({
        db,
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        businessName,
        ownerSalaryTarget: Number(ownerSalaryTarget),
        services: activeServices,
        fixedExpenses: visibleFixedExpenses,
        categories,
      });
      onComplete();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Algo salió mal. Intenta de nuevo en un momento.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateService(id: string, update: Partial<ServiceDraft>) {
    setServices((current) => current.map((service) => (service.id === id ? { ...service, ...update } : service)));
  }

  function updateFixedExpense(id: string, update: Partial<FixedExpenseDraft>) {
    setFixedExpenses((current) => current.map((expense) => (expense.id === id ? { ...expense, ...update } : expense)));
  }

  function addService() {
    const name = newServiceName.trim();
    if (!name) {
      return;
    }

    setServices((current) => [
      ...current,
      {
        id: `svc_${slugify(name)}_${Date.now()}`,
        name,
        defaultPrice: 30000,
        estimatedCost: 0,
        isActive: true,
      },
    ]);
    setNewServiceName("");
  }

  function addFixedExpense() {
    const name = newExpenseName.trim();
    if (!name) {
      return;
    }

    setFixedExpenses((current) => [
      ...current,
      {
        id: `fe_${slugify(name)}_${Date.now()}`,
        name,
        amount: 0,
        isActive: true,
      },
    ]);
    setNewExpenseName("");
  }

  return (
    <main className="onboarding-screen">
      <section className="onboarding-panel" aria-labelledby="onboarding-title">
        <header className="onboarding-header">
          <div>
            <p className="eyebrow">Primeros datos</p>
            <h1 id="onboarding-title">Configura tu spa</h1>
          </div>
          <button className="secondary-button compact" type="button" onClick={() => void signOut()}>
            Salir
          </button>
        </header>

        <div className="stepper" aria-label="Progreso de configuración">
          {steps.map((label, index) => (
            <span className={index <= step ? "active" : ""} key={label}>
              {label}
            </span>
          ))}
        </div>

        <form className="onboarding-form" onSubmit={handleSubmit}>
          {step === 0 ? (
            <section className="onboarding-step">
              <h2>Tu negocio</h2>
              <label>
                Nombre del negocio
                <input value={businessName} onChange={(event) => setBusinessName(event.target.value)} required />
              </label>
              <label>
                ¿Cuánto quieres ganarte al mes?
                <input
                  inputMode="numeric"
                  min="0"
                  type="number"
                  value={ownerSalaryTarget}
                  onChange={(event) => setOwnerSalaryTarget(event.target.value)}
                  required
                />
              </label>
              <article className="setup-summary">
                <span>Moneda</span>
                <strong>COP</strong>
              </article>
            </section>
          ) : null}

          {step === 1 ? (
            <section className="onboarding-step">
              <h2>Servicios iniciales</h2>
              <div className="add-row">
                <input
                  value={newServiceName}
                  onChange={(event) => setNewServiceName(event.target.value)}
                  placeholder="Nuevo servicio"
                />
                <button className="icon-button" type="button" aria-label="Agregar servicio" onClick={addService}>
                  <Plus aria-hidden="true" size={20} />
                </button>
              </div>
              <div className="editable-list">
                {activeServices.map((service) => (
                  <article className="editable-item" key={service.id}>
                    <label>
                      Servicio
                      <input value={service.name} onChange={(event) => updateService(service.id, { name: event.target.value })} />
                    </label>
                    <div className="two-column">
                      <label>
                        Precio
                        <input
                          inputMode="numeric"
                          min="1"
                          type="number"
                          value={service.defaultPrice}
                          onChange={(event) => updateService(service.id, { defaultPrice: Number(event.target.value) })}
                        />
                      </label>
                      <label>
                        Costo
                        <input
                          inputMode="numeric"
                          min="0"
                          type="number"
                          value={service.estimatedCost}
                          onChange={(event) => updateService(service.id, { estimatedCost: Number(event.target.value) })}
                        />
                      </label>
                    </div>
                    <button
                      className="icon-button danger"
                      type="button"
                      aria-label="Quitar servicio"
                      onClick={() => updateService(service.id, { isActive: false })}
                    >
                      <Trash2 aria-hidden="true" size={18} />
                    </button>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {step === 2 ? (
            <section className="onboarding-step">
              <h2>Gastos fijos</h2>
              <article className="setup-summary">
                <span>Total mensual</span>
                <strong>{formatCurrency(totalFixedExpenses)}</strong>
              </article>
              <div className="add-row">
                <input
                  value={newExpenseName}
                  onChange={(event) => setNewExpenseName(event.target.value)}
                  placeholder="Nuevo gasto fijo"
                />
                <button className="icon-button" type="button" aria-label="Agregar gasto fijo" onClick={addFixedExpense}>
                  <Plus aria-hidden="true" size={20} />
                </button>
              </div>
              <div className="editable-list">
                {visibleFixedExpenses.map((expense) => (
                  <article className="editable-item compact-item" key={expense.id}>
                    <label>
                      Gasto
                      <input value={expense.name} onChange={(event) => updateFixedExpense(expense.id, { name: event.target.value })} />
                    </label>
                    <label>
                      Valor
                      <input
                        inputMode="numeric"
                        min="0"
                        type="number"
                        value={expense.amount}
                        onChange={(event) => updateFixedExpense(expense.id, { amount: Number(event.target.value) })}
                      />
                    </label>
                    <button
                      className="icon-button danger"
                      type="button"
                      aria-label="Quitar gasto fijo"
                      onClick={() => updateFixedExpense(expense.id, { isActive: false })}
                    >
                      <Trash2 aria-hidden="true" size={18} />
                    </button>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {error ? <p className="error-text">{error}</p> : null}

          <footer className="onboarding-actions">
            <button className="secondary-button" type="button" onClick={previousStep} disabled={step === 0 || isSubmitting}>
              Anterior
            </button>
            {step < steps.length - 1 ? (
              <button className="primary-button" type="button" onClick={nextStep}>
                Siguiente
              </button>
            ) : (
              <button className="primary-button" type="submit" disabled={isSubmitting}>
                Entrar al dashboard
              </button>
            )}
          </footer>
        </form>
      </section>
    </main>
  );
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
