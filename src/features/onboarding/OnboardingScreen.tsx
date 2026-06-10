import { Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useAuth } from "../../shared/auth/AuthContext";
import { Button, Card, CardBody, CardHeader, Chip, Input, MoneyField, Progress } from "../../shared/components/ui";
import { db } from "../../shared/lib/firebase";
import type { ExpenseCategory, FixedExpense, Service } from "../../shared/types/domain";
import { formatCurrency } from "../../shared/utils/formatCurrency";
import { fixedExpenseSchema, onboardingBusinessSchema, serviceSchema } from "../../shared/validation/schemas";
import { defaultCategories, defaultFixedExpenses, defaultServices } from "./constants/defaultSeeds";
import { initializeUserBusiness } from "./services/initializeUserBusiness";

type OnboardingScreenProps = {
  onComplete: () => void;
};

type ServiceDraft = Pick<Service, "id" | "name" | "defaultPrice" | "estimatedCost" | "isActive">;
type FixedExpenseDraft = Pick<FixedExpense, "id" | "name" | "amount" | "isActive">;
type CategoryDraft = Pick<ExpenseCategory, "id" | "name" | "color" | "isActive">;

const steps = ["Negocio", "Servicios", "Gastos", "Resumen"];

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
  const progress = ((step + 1) / steps.length) * 100;

  function nextStep() {
    const validationError = validateStep(step);
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

  function validateStep(stepIndex: number) {
    if (stepIndex === 0) {
      const parsed = onboardingBusinessSchema.safeParse({ businessName, ownerSalaryTarget });
      if (!parsed.success) {
        return parsed.error.issues[0]?.message ?? "Revisa los datos del negocio.";
      }
    }

    if (stepIndex === 1) {
      if (activeServices.length === 0) {
        return "Aún no has configurado tus servicios. Es el primer paso.";
      }

      const invalidService = activeServices.find((service) => !serviceSchema.safeParse(service).success);
      if (invalidService) {
        return "Revisa que cada servicio tenga nombre, precio y costo válido.";
      }
    }

    if (stepIndex === 2) {
      const invalidExpense = visibleFixedExpenses.find((expense) => !fixedExpenseSchema.safeParse(expense).success);
      if (invalidExpense) {
        return "Revisa que cada gasto fijo tenga nombre y valor válido.";
      }
    }

    return "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    for (let index = 0; index < steps.length - 1; index += 1) {
      const validationError = validateStep(index);
      if (validationError) {
        setStep(index);
        setError(validationError);
        return;
      }
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
          <Button radius="sm" variant="light" onPress={() => void signOut()}>
            Salir
          </Button>
        </header>

        <div className="stepper" aria-label="Progreso de configuración">
          <Progress aria-label="Progreso" color="primary" value={progress} />
          <div className="stepper__labels">
            {steps.map((label, index) => (
              <Chip className={index === step ? "active" : ""} color={index <= step ? "primary" : "default"} key={label} size="sm" variant="flat">
                {label}
              </Chip>
            ))}
          </div>
        </div>

        <form className="onboarding-form" onSubmit={handleSubmit}>
          {step === 0 ? (
            <Card className="ui-card onboarding-step" shadow="none">
              <CardHeader>
                <h2>Tu negocio</h2>
              </CardHeader>
              <CardBody>
                <Input
                  autoComplete="organization"
                  className="form-control"
                  isRequired
                  label="Nombre del negocio"
                  name="business-name"
                  radius="sm"
                  value={businessName}
                  variant="bordered"
                  onValueChange={setBusinessName}
                />
                <MoneyField
                  isRequired
                  label="¿Cuánto quieres ganarte al mes?"
                  value={ownerSalaryTarget}
                  onValueChange={setOwnerSalaryTarget}
                />
                <Card className="ui-card setup-summary" shadow="none">
                  <CardBody>
                    <span>Moneda</span>
                    <strong>COP</strong>
                  </CardBody>
                </Card>
              </CardBody>
            </Card>
          ) : null}

          {step === 1 ? (
            <Card className="ui-card onboarding-step" shadow="none">
              <CardHeader>
                <h2>Servicios iniciales</h2>
              </CardHeader>
              <CardBody>
                <div className="add-row">
                  <Input
                    aria-label="Nuevo servicio"
                    autoComplete="off"
                    className="form-control"
                    name="new-service"
                    placeholder="Ej. Manicura tradicional"
                    radius="sm"
                    value={newServiceName}
                    variant="bordered"
                    onValueChange={setNewServiceName}
                  />
                  <Button isIconOnly aria-label="Agregar servicio" color="primary" radius="sm" onPress={addService}>
                    <Plus aria-hidden="true" size={20} />
                  </Button>
                </div>
                <div className="editable-list">
                  {activeServices.map((service) => (
                    <Card className="ui-card editable-item" key={service.id} shadow="none">
                      <CardBody>
                        <Input
                          autoComplete="off"
                          className="form-control"
                          label="Servicio"
                          name={`service-${service.id}-name`}
                          radius="sm"
                          value={service.name}
                          variant="bordered"
                          onValueChange={(value) => updateService(service.id, { name: value })}
                        />
                        <div className="two-column">
                          <MoneyField
                            isRequired
                            label="Precio"
                            min={1}
                            value={service.defaultPrice}
                            onValueChange={(value) => updateService(service.id, { defaultPrice: Number(value) })}
                          />
                          <MoneyField
                            label="Costo"
                            value={service.estimatedCost}
                            onValueChange={(value) => updateService(service.id, { estimatedCost: Number(value) })}
                          />
                        </div>
                        <Button
                          className="danger-inline"
                          color="danger"
                          radius="sm"
                          startContent={<Trash2 aria-hidden="true" size={17} />}
                          variant="light"
                          onPress={() => updateService(service.id, { isActive: false })}
                        >
                          Quitar
                        </Button>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </CardBody>
            </Card>
          ) : null}

          {step === 2 ? (
            <Card className="ui-card onboarding-step" shadow="none">
              <CardHeader>
                <h2>Gastos fijos</h2>
              </CardHeader>
              <CardBody>
                <Card className="ui-card setup-summary" shadow="none">
                  <CardBody>
                    <span>Total mensual</span>
                    <strong>{formatCurrency(totalFixedExpenses)}</strong>
                  </CardBody>
                </Card>
                <div className="add-row">
                  <Input
                    aria-label="Nuevo gasto fijo"
                    autoComplete="off"
                    className="form-control"
                    name="new-fixed-expense"
                    placeholder="Ej. Arriendo"
                    radius="sm"
                    value={newExpenseName}
                    variant="bordered"
                    onValueChange={setNewExpenseName}
                  />
                  <Button isIconOnly aria-label="Agregar gasto fijo" color="primary" radius="sm" onPress={addFixedExpense}>
                    <Plus aria-hidden="true" size={20} />
                  </Button>
                </div>
                <div className="editable-list">
                  {visibleFixedExpenses.map((expense) => (
                    <Card className="ui-card editable-item compact-item" key={expense.id} shadow="none">
                      <CardBody>
                        <Input
                          autoComplete="off"
                          className="form-control"
                          label="Gasto"
                          name={`fixed-expense-${expense.id}-name`}
                          radius="sm"
                          value={expense.name}
                          variant="bordered"
                          onValueChange={(value) => updateFixedExpense(expense.id, { name: value })}
                        />
                        <MoneyField
                          label="Valor"
                          value={expense.amount}
                          onValueChange={(value) => updateFixedExpense(expense.id, { amount: Number(value) })}
                        />
                        <Button
                          className="danger-inline"
                          color="danger"
                          radius="sm"
                          startContent={<Trash2 aria-hidden="true" size={17} />}
                          variant="light"
                          onPress={() => updateFixedExpense(expense.id, { isActive: false })}
                        >
                          Quitar
                        </Button>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </CardBody>
            </Card>
          ) : null}

          {step === 3 ? (
            <Card className="ui-card onboarding-step" shadow="none">
              <CardHeader>
                <h2>Resumen</h2>
              </CardHeader>
              <CardBody>
                <div className="summary-grid">
                  <Card className="ui-card setup-summary" shadow="none">
                    <CardBody>
                      <span>Negocio</span>
                      <strong>{businessName}</strong>
                    </CardBody>
                  </Card>
                  <Card className="ui-card setup-summary" shadow="none">
                    <CardBody>
                      <span>Servicios activos</span>
                      <strong>{activeServices.length}</strong>
                    </CardBody>
                  </Card>
                  <Card className="ui-card setup-summary" shadow="none">
                    <CardBody>
                      <span>Gastos fijos</span>
                      <strong>{formatCurrency(totalFixedExpenses)}</strong>
                    </CardBody>
                  </Card>
                  <Card className="ui-card setup-summary" shadow="none">
                    <CardBody>
                      <span>Mi salario objetivo</span>
                      <strong>{formatCurrency(Number(ownerSalaryTarget) || 0)}</strong>
                    </CardBody>
                  </Card>
                </div>
                <p className="hint-text">Si algo no está perfecto, puedes ajustarlo después en Configuración.</p>
              </CardBody>
            </Card>
          ) : null}

          {error ? <p className="error-text">{error}</p> : null}

          <footer className="onboarding-actions">
            <Button isDisabled={step === 0 || isSubmitting} radius="sm" variant="bordered" onPress={previousStep}>
              Anterior
            </Button>
            {step < steps.length - 1 ? (
              <Button color="primary" radius="sm" onPress={nextStep}>
                Siguiente
              </Button>
            ) : (
              <Button color="primary" isLoading={isSubmitting} radius="sm" type="submit">
                Entrar al dashboard
              </Button>
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
