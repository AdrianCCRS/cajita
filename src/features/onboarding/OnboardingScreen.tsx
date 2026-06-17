import { ArrowRight, BriefcaseBusiness, Building2, CalendarDays, Check, ChevronLeft, Coins, FlaskConical, ListChecks, Pencil, Plus, Sparkles, Trash2, Wallet } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "../../shared/auth/AuthContext";
import { BottomSheet, Button, Card, Input, Label, MoneyField, ScreenHero, TextField } from "../../shared/components/ui";
import { db } from "../../shared/lib/firebase";
import type { ExpenseCategory, FixedExpense, MeasurementType, PurchaseUnit, RawMaterial, Service } from "../../shared/types/domain";
import { formatCurrency } from "../../shared/utils/formatCurrency";
import { getServiceMargin } from "../../shared/utils/financials";
import { buildRawMaterialCalculation, getPurchaseUnits } from "../../shared/utils/rawMaterials";
import { fixedExpenseSchema, onboardingBusinessSchema, rawMaterialSchema, serviceSchema } from "../../shared/validation/schemas";
import { defaultCategories, defaultFixedExpenses, defaultServices } from "./constants/defaultSeeds";
import { initializeUserBusiness } from "./services/initializeUserBusiness";

type OnboardingScreenProps = {
  onComplete: () => void;
};

type ServiceDraft = Pick<Service, "id" | "name" | "defaultPrice" | "estimatedCost" | "costCalculationMode" | "isActive">;
type FixedExpenseDraft = Pick<FixedExpense, "id" | "name" | "amount" | "isActive"> & { dueDay?: number | null; categoryId?: string | null; categoryName?: string | null };
type CategoryDraft = Pick<ExpenseCategory, "id" | "name" | "color" | "isActive">;

type RawMaterialDraft = {
  id: string;
  name: string;
  measurementType: MeasurementType;
  purchaseQuantity: number;
  purchaseUnit: PurchaseUnit;
  purchasePrice: number;
  isActive: boolean;
};

const steps = [
  { label: "Negocio", icon: Building2 },
  { label: "Servicios", icon: Sparkles },
  { label: "Insumos", icon: FlaskConical },
  { label: "Gastos fijos", icon: Wallet },
  { label: "Resumen", icon: ListChecks },
];

const measurementLabels: Record<MeasurementType, string> = {
  volume: "Líquido",
  weight: "Peso",
  unit: "Unidad",
};

const unitLabels: Record<PurchaseUnit, string> = {
  ml: "ml",
  l: "l",
  g: "g",
  kg: "kg",
  unit: "unid.",
};

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { user, signOut } = useAuth();
  const [step, setStep] = useState(0);
  const [businessName, setBusinessName] = useState("");
  const [ownerSalaryTarget, setOwnerSalaryTarget] = useState<number | undefined>();
  const [services, setServices] = useState<ServiceDraft[]>(
    defaultServices.map((svc) => ({ ...svc })),
  );
  const [rawMaterials, setRawMaterials] = useState<RawMaterialDraft[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpenseDraft[]>(
    defaultFixedExpenses.map(({ id, name, amount, isActive, dueDay, categoryId, categoryName }) => ({ id, name, amount, isActive, dueDay, categoryId, categoryName })),
  );
  const [categories] = useState<CategoryDraft[]>(
    defaultCategories.map(({ id, name, color, isActive }) => ({ id, name, color, isActive })),
  );
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ---- Expense sheet state ----
  const [isExpenseSheetOpen, setIsExpenseSheetOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | undefined>();
  const [expName, setExpName] = useState("");
  const [expAmount, setExpAmount] = useState<number | undefined>();
  const [expDueDay, setExpDueDay] = useState<number | undefined>(1);
  const [expCategoryId, setExpCategoryId] = useState("");
  const [expenseSheetError, setExpenseSheetError] = useState("");

  // ---- Service sheet state ----
  const [isServiceSheetOpen, setIsServiceSheetOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | undefined>();
  const [svcSheetName, setSvcSheetName] = useState("");
  const [svcSheetPrice, setSvcSheetPrice] = useState<number | undefined>();
  const [svcSheetCost, setSvcSheetCost] = useState<number | undefined>();
  const [svcSheetCostMode, setSvcSheetCostMode] = useState<Service["costCalculationMode"]>("automatic");
  const [serviceSheetError, setServiceSheetError] = useState("");

  // ---- Raw material sheet state ----
  const [isMaterialSheetOpen, setIsMaterialSheetOpen] = useState(false);
  const [editingMaterialId, setEditingMaterialId] = useState<string | undefined>();
  const [matName, setMatName] = useState("");
  const [matMeasurementType, setMatMeasurementType] = useState<MeasurementType>("volume");
  const [matQuantity, setMatQuantity] = useState<number | undefined>();
  const [matUnit, setMatUnit] = useState<PurchaseUnit>("ml");
  const [matPrice, setMatPrice] = useState<number | undefined>();
  const [matMinimumStock, setMatMinimumStock] = useState<number | undefined>();
  const [materialError, setMaterialError] = useState("");

  const activeServices = services.filter((svc) => svc.isActive);
  const activeRawMaterials = rawMaterials.filter((mat) => mat.isActive);
  const visibleFixedExpenses = fixedExpenses.filter((expense) => expense.isActive);
  const totalFixedExpenses = visibleFixedExpenses.reduce((total, expense) => total + expense.amount, 0);

  const materialPreview = useMemo(() => {
    if (!matQuantity || matPrice === undefined) {
      return null;
    }

    try {
      return buildRawMaterialCalculation({
        measurementType: matMeasurementType,
        purchaseQuantity: matQuantity,
        purchaseUnit: matUnit,
        purchasePrice: matPrice,
      });
    } catch {
      return null;
    }
  }, [matMeasurementType, matPrice, matQuantity, matUnit]);

  useEffect(() => {
    document.documentElement.dataset.theme = "light";

    return () => {
      document.documentElement.dataset.theme = "light";
    };
  }, []);

  // ---- Navigation ----

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
        return "Configura al menos un servicio para continuar.";
      }

      const invalidService = activeServices.find((service) => !serviceSchema.safeParse(service).success);
      if (invalidService) {
        return "Revisa que cada servicio tenga nombre, precio y costo válido.";
      }
    }

    if (stepIndex === 3) {
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
      if (index === 2) {
        // Insumos step has no validation
        continue;
      }

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
        rawMaterials: activeRawMaterials.map((mat) => ({
          ...mat,
          baseUnit: mat.measurementType === "volume" ? "ml" as const : mat.measurementType === "weight" ? "g" as const : "unit" as const,
          baseQuantity: mat.purchaseUnit === "l" || mat.purchaseUnit === "kg" ? mat.purchaseQuantity * 1000 : mat.purchaseQuantity,
        })),
      });
      onComplete();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Algo salió mal. Intenta de nuevo en un momento.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ---- Fixed expenses sheet ----

  function openCreateExpenseSheet() {
    setEditingExpenseId(undefined);
    setExpName("");
    setExpAmount(undefined);
    setExpDueDay(1);
    setExpCategoryId("");
    setExpenseSheetError("");
    setIsExpenseSheetOpen(true);
  }

  function openEditExpenseSheet(expense: FixedExpenseDraft) {
    setEditingExpenseId(expense.id);
    setExpName(expense.name);
    setExpAmount(expense.amount);
    setExpDueDay(expense.dueDay ?? 1);
    setExpCategoryId(expense.categoryId ?? "");
    setExpenseSheetError("");
    setIsExpenseSheetOpen(true);
  }

  function closeExpenseSheet() {
    setEditingExpenseId(undefined);
    setExpName("");
    setExpAmount(undefined);
    setExpDueDay(1);
    setExpCategoryId("");
    setExpenseSheetError("");
    setIsExpenseSheetOpen(false);
  }

  function handleExpenseSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = fixedExpenseSchema.safeParse({ name: expName, amount: expAmount, categoryId: expCategoryId || undefined, dueDay: expDueDay });

    if (!parsed.success) {
      setExpenseSheetError(parsed.error.issues[0]?.message ?? "Revisa los datos del gasto fijo.");
      return;
    }

    const categoryName = categories.find((cat) => cat.id === expCategoryId)?.name ?? null;

    if (editingExpenseId) {
      setFixedExpenses((current) =>
        current.map((expense) =>
          expense.id === editingExpenseId
            ? { ...expense, name: parsed.data.name, amount: parsed.data.amount, dueDay: expDueDay, categoryId: expCategoryId || null, categoryName }
            : expense,
        ),
      );
    } else {
      setFixedExpenses((current) => [
        ...current,
        { id: `fe_${slugify(parsed.data.name)}_${Date.now()}`, name: parsed.data.name, amount: parsed.data.amount, dueDay: expDueDay, categoryId: expCategoryId || null, categoryName, isActive: true },
      ]);
    }

    closeExpenseSheet();
  }

  // ---- Services sheet ----

  function openCreateServiceSheet() {
    setEditingServiceId(undefined);
    setSvcSheetName("");
    setSvcSheetPrice(undefined);
    setSvcSheetCost(undefined);
    setSvcSheetCostMode("automatic");
    setServiceSheetError("");
    setIsServiceSheetOpen(true);
  }

  function openEditServiceSheet(service: ServiceDraft) {
    setEditingServiceId(service.id);
    setSvcSheetName(service.name);
    setSvcSheetPrice(service.defaultPrice);
    setSvcSheetCost(service.estimatedCost);
    setSvcSheetCostMode(service.costCalculationMode ?? "automatic");
    setServiceSheetError("");
    setIsServiceSheetOpen(true);
  }

  function closeServiceSheet() {
    setEditingServiceId(undefined);
    setSvcSheetName("");
    setSvcSheetPrice(undefined);
    setSvcSheetCost(undefined);
    setSvcSheetCostMode("automatic");
    setServiceSheetError("");
    setIsServiceSheetOpen(false);
  }

  function handleServiceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = serviceSchema.safeParse({
      name: svcSheetName,
      defaultPrice: svcSheetPrice,
      estimatedCost: svcSheetCostMode === "automatic" ? 0 : (svcSheetCost ?? 0),
      costCalculationMode: svcSheetCostMode,
    });

    if (!parsed.success) {
      setServiceSheetError(parsed.error.issues[0]?.message ?? "Revisa los datos del servicio.");
      return;
    }

    if (editingServiceId) {
      setServices((current) =>
        current.map((svc) =>
          svc.id === editingServiceId
            ? { ...svc, name: parsed.data.name, defaultPrice: parsed.data.defaultPrice, estimatedCost: parsed.data.estimatedCost, costCalculationMode: parsed.data.costCalculationMode }
            : svc,
        ),
      );
    } else {
      setServices((current) => [
        ...current,
        {
          id: `svc_${slugify(parsed.data.name)}_${Date.now()}`,
          name: parsed.data.name,
          defaultPrice: parsed.data.defaultPrice,
          estimatedCost: parsed.data.estimatedCost,
          costCalculationMode: parsed.data.costCalculationMode,
          isActive: true,
        },
      ]);
    }

    closeServiceSheet();
  }

  // ---- Raw materials sheet ----

  function changeMatMeasurementType(nextType: MeasurementType) {
    setMatMeasurementType(nextType);
    setMatUnit(getPurchaseUnits(nextType)[0]);
  }

  function openCreateMaterialSheet() {
    setEditingMaterialId(undefined);
    setMatName("");
    setMatMeasurementType("volume");
    setMatQuantity(undefined);
    setMatUnit("ml");
    setMatPrice(undefined);
    setMatMinimumStock(undefined);
    setMaterialError("");
    setIsMaterialSheetOpen(true);
  }

  function openEditMaterialSheet(material: RawMaterialDraft) {
    setEditingMaterialId(material.id);
    setMatName(material.name);
    setMatMeasurementType(material.measurementType);
    setMatQuantity(material.purchaseQuantity);
    setMatUnit(material.purchaseUnit);
    setMatPrice(material.purchasePrice);
    setMatMinimumStock(undefined);
    setMaterialError("");
    setIsMaterialSheetOpen(true);
  }

  function closeMaterialSheet() {
    setEditingMaterialId(undefined);
    setMatName("");
    setMatQuantity(undefined);
    setMatPrice(undefined);
    setMaterialError("");
    setIsMaterialSheetOpen(false);
  }

  function handleMaterialSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = rawMaterialSchema.safeParse({
      name: matName,
      measurementType: matMeasurementType,
      purchaseQuantity: matQuantity,
      purchaseUnit: matUnit,
      purchasePrice: matPrice,
      minimumStock: matMinimumStock,
    });

    if (!parsed.success) {
      setMaterialError(parsed.error.issues[0]?.message ?? "Revisa el insumo.");
      return;
    }

    if (editingMaterialId) {
      setRawMaterials((current) =>
        current.map((mat) =>
          mat.id === editingMaterialId
            ? {
                ...mat,
                name: parsed.data.name,
                measurementType: parsed.data.measurementType,
                purchaseQuantity: parsed.data.purchaseQuantity,
                purchaseUnit: parsed.data.purchaseUnit,
                purchasePrice: parsed.data.purchasePrice,
              }
            : mat,
        ),
      );
    } else {
      setRawMaterials((current) => [
        ...current,
        {
          id: `rm_${slugify(parsed.data.name)}_${Date.now()}`,
          name: parsed.data.name,
          measurementType: parsed.data.measurementType,
          purchaseQuantity: parsed.data.purchaseQuantity,
          purchaseUnit: parsed.data.purchaseUnit,
          purchasePrice: parsed.data.purchasePrice,
          isActive: true,
        },
      ]);
    }

    closeMaterialSheet();
  }

  function formatQuantity(value: number, unit: string) {
    return `${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 }).format(value)} ${unitLabels[unit as PurchaseUnit] ?? unit}`;
  }

  // ---- Render ----

  return (
    <main className="onboarding-screen">
      <section aria-labelledby="onboarding-title" className="onboarding-panel">
        <ScreenHero title="Configura tu spa">
          Unos pocos datos para dejar tu cuaderno atrás y empezar a ver tu dinero claro.
        </ScreenHero>
        <br/>
        <div aria-label="Progreso de configuración" className="onboarding-stepper">
          {steps.map(({ label, icon: Icon }, index) => {
            const isCurrent = index === step;
            const isCompleted = index < step;

            return (
              <button
                className={`onboarding-stepper__step${isCurrent ? " onboarding-stepper__step--current" : ""}${isCompleted ? " onboarding-stepper__step--completed" : ""}`}
                disabled={index > step}
                key={label}
                type="button"
                onClick={() => { if (isCompleted) setStep(index); }}
              >
                <span className="onboarding-stepper__bullet">
                  {isCompleted ? <Check aria-hidden="true" size={14} /> : <Icon aria-hidden="true" size={16} />}
                </span>
                <span className="onboarding-stepper__label">{label}</span>
              </button>
            );
          })}
        </div>

        <form className="form-stack" onSubmit={handleSubmit}>
          {/* ---- Step 0: Negocio ---- */}
          {step === 0 ? (
            <Card className="ui-card">
              <Card.Content>
                <div className="section-heading">
                  <div className="section-subheading">
                    <span>Paso 1 de {steps.length}</span>
                    <strong>Tu negocio</strong>
                  </div>
                </div>
                <TextField className="form-control" isRequired name="business-name">
                  <Label>Nombre del negocio</Label>
                  <Input autoComplete="organization" placeholder="Ej. Spa Mariela" value={businessName} variant="secondary" onChange={(e) => setBusinessName(e.target.value)} />
                </TextField>
                <MoneyField isRequired label="¿Cuánto quieres ganarte al mes?" value={ownerSalaryTarget} onChange={setOwnerSalaryTarget} />
                <Card className="ui-card setup-summary">
                  <Card.Content>
                    <span>Moneda</span>
                    <strong>COP</strong>
                    <small>Pesos colombianos</small>
                  </Card.Content>
                </Card>
              </Card.Content>
            </Card>
          ) : null}

          {/* ---- Step 1: Servicios ---- */}
          {step === 1 ? (
            <Card className="ui-card">
              <Card.Content>
                <div className="section-heading">
                  <div className="section-subheading">
                    <span>Paso 2 de {steps.length}</span>
                    <strong>Servicios iniciales</strong>
                  </div>
                  <b>{activeServices.length}</b>
                </div>
                <p className="hint-text">Toca cualquier fila para editar precio y costo. El costo inicia en automático mientras no haya insumos.</p>
                <Button onPress={openCreateServiceSheet}>
                  <Plus aria-hidden="true" size={18} />
                  Nuevo servicio
                </Button>
                {activeServices.length ? (
                  <Card className="ui-card service-table-card">
                    <Card.Content>
                      <div className="service-table-scroll">
                        <table className="service-table">
                          <caption>Servicios configurados</caption>
                          <thead>
                            <tr>
                              <th scope="col">Servicio</th>
                              <th scope="col">Precio</th>
                              <th scope="col" className="optional-column">Costo</th>
                              <th scope="col" className="optional-column">Deja</th>
                              <th scope="col">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activeServices.map((service) => (
                              <tr key={service.id}>
                                <th scope="row">
                                  <span>{service.name}</span>
                                  <small>{service.costCalculationMode === "automatic" ? "Costo automático" : `Costo manual · Deja ${Math.round(getServiceMargin(service as unknown as Service))}%`}</small>
                                </th>
                                <td><b>{formatCurrency(service.defaultPrice)}</b></td>
                                <td className="optional-column">{formatCurrency(service.estimatedCost)}</td>
                                <td className="optional-column"><b>{Math.round(getServiceMargin(service as unknown as Service))}%</b></td>
                                <td>
                                  <div className="table-actions">
                                    <Button isIconOnly aria-label={`Editar ${service.name}`} size="sm" variant="outline" onPress={() => openEditServiceSheet(service)}>
                                      <Pencil aria-hidden="true" size={16} />
                                    </Button>
                                    <Button isIconOnly aria-label={`Quitar ${service.name}`} size="sm" variant="danger" onPress={() => setServices((current) => current.map((svc) => (svc.id === service.id ? { ...svc, isActive: false } : svc)))}>
                                      <Trash2 aria-hidden="true" size={16} />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card.Content>
                  </Card>
                ) : (
                  <Card className="ui-card empty-state">
                    <Card.Content>
                      <div className="empty-state__icon" aria-hidden="true"><Sparkles size={24} /></div>
                      <strong>Sin servicios configurados</strong>
                      <p>Agrega al menos un servicio para continuar.</p>
                    </Card.Content>
                  </Card>
                )}
              </Card.Content>
            </Card>
          ) : null}

          {/* ---- Step 2: Insumos ---- */}
          {step === 2 ? (
            <Card className="ui-card">
              <Card.Content>
                <div className="section-heading">
                  <div className="section-subheading">
                    <span>Paso 3 de {steps.length}</span>
                    <strong>Insumos</strong>
                  </div>
                  <b>{activeRawMaterials.length}</b>
                </div>
                <p className="hint-text">Configura los insumos que usas para prestar servicios. Luego podrás asociarlos y calcular costos reales.</p>
                <Button onPress={openCreateMaterialSheet}>
                  <Plus aria-hidden="true" size={18} />
                  Nuevo insumo
                </Button>
                {activeRawMaterials.length ? (
                  <Card className="ui-card service-table-card">
                    <Card.Content>
                      <div className="service-table-scroll">
                        <table className="service-table">
                          <caption>Insumos configurados</caption>
                          <thead>
                            <tr>
                              <th scope="col">Insumo</th>
                              <th scope="col">Compra</th>
                              <th scope="col" className="optional-column">Costo base</th>
                              <th scope="col">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activeRawMaterials.map((mat) => {
                              const preview = (() => {
                                try {
                                  return buildRawMaterialCalculation({ measurementType: mat.measurementType, purchaseQuantity: mat.purchaseQuantity, purchaseUnit: mat.purchaseUnit, purchasePrice: mat.purchasePrice });
                                } catch {
                                  return null;
                                }
                              })();

                              return (
                                <tr key={mat.id}>
                                  <th scope="row">
                                    <span>{mat.name}</span>
                                    <small>{measurementLabels[mat.measurementType]}</small>
                                  </th>
                                  <td><b>{formatQuantity(mat.purchaseQuantity, mat.purchaseUnit)}</b></td>
                                  <td className="optional-column">{preview ? `${formatCurrency(preview.unitCost)} / ${unitLabels[mat.purchaseUnit === "l" || mat.purchaseUnit === "kg" ? (mat.measurementType === "volume" ? "ml" : "g") as PurchaseUnit : mat.purchaseUnit]}` : "—"}</td>
                                  <td>
                                    <div className="table-actions">
                                      <Button isIconOnly aria-label={`Editar ${mat.name}`} size="sm" variant="outline" onPress={() => openEditMaterialSheet(mat)}>
                                        <Pencil aria-hidden="true" size={16} />
                                      </Button>
                                      <Button isIconOnly aria-label={`Quitar ${mat.name}`} size="sm" variant="danger" onPress={() => setRawMaterials((current) => current.map((item) => (item.id === mat.id ? { ...item, isActive: false } : item)))}>
                                        <Trash2 aria-hidden="true" size={16} />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </Card.Content>
                  </Card>
                ) : (
                  <Card className="ui-card empty-state">
                    <Card.Content>
                      <div className="empty-state__icon" aria-hidden="true"><FlaskConical size={24} /></div>
                      <strong>Sin insumos configurados</strong>
                      <p>Agrega insumos para calcular costos reales de tus servicios.</p>
                    </Card.Content>
                  </Card>
                )}
              </Card.Content>
            </Card>
          ) : null}

          {/* ---- Step 3: Gastos fijos ---- */}
          {step === 3 ? (
            <Card className="ui-card">
              <Card.Content>
                <div className="section-heading">
                  <div className="section-subheading">
                    <span>Paso 4 de {steps.length}</span>
                    <strong>Gastos fijos</strong>
                  </div>
                  <b>{visibleFixedExpenses.length}</b>
                </div>
                <p className="hint-text">Compromisos mensuales como arriendo o internet. Solo afectan tus gastos cuando registras el pago.</p>
                <Card className="ui-card setup-summary">
                  <Card.Content>
                    <span>Compromiso mensual total</span>
                    <strong>{formatCurrency(totalFixedExpenses)}</strong>
                  </Card.Content>
                </Card>
                <Button onPress={openCreateExpenseSheet}>
                  <Plus aria-hidden="true" size={18} />
                  Nuevo gasto fijo
                </Button>
                {visibleFixedExpenses.length ? (
                  <Card className="ui-card service-table-card">
                    <Card.Content>
                      <div className="service-table-scroll">
                        <table className="service-table settings-table">
                          <caption>Gastos fijos configurados</caption>
                          <thead>
                            <tr>
                              <th scope="col">Gasto</th>
                              <th scope="col">Valor</th>
                              <th scope="col">Día</th>
                              <th scope="col">Categoría</th>
                              <th scope="col">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {visibleFixedExpenses.map((expense) => (
                              <tr key={expense.id}>
                                <th scope="row">
                                  <span>{expense.name}</span>
                                  <small>Mensual</small>
                                </th>
                                <td><b>{formatCurrency(expense.amount)}</b></td>
                                <td><span className="status-pill status-pill--active">Día {expense.dueDay ?? 1}</span></td>
                                <td><span>{expense.categoryName ?? "Sin categoría"}</span></td>
                                <td>
                                  <div className="table-actions">
                                    <Button isIconOnly aria-label={`Editar ${expense.name}`} size="sm" variant="outline" onPress={() => openEditExpenseSheet(expense)}>
                                      <Pencil aria-hidden="true" size={16} />
                                    </Button>
                                    <Button isIconOnly aria-label={`Quitar ${expense.name}`} size="sm" variant="danger" onPress={() => setFixedExpenses((current) => current.map((item) => (item.id === expense.id ? { ...item, isActive: false } : item)))}>
                                      <Trash2 aria-hidden="true" size={16} />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card.Content>
                  </Card>
                ) : (
                  <Card className="ui-card empty-state">
                    <Card.Content>
                      <div className="empty-state__icon" aria-hidden="true"><Wallet size={24} /></div>
                      <strong>Sin gastos fijos</strong>
                      <p>Agrega tus compromisos mensuales para calcular la meta mínima.</p>
                    </Card.Content>
                  </Card>
                )}
              </Card.Content>
            </Card>
          ) : null}

          {/* ---- Step 4: Resumen ---- */}
          {step === 4 ? (
            <Card className="ui-card">
              <Card.Content>
                <div className="section-heading">
                  <div className="section-subheading">
                    <span>Paso {steps.length} de {steps.length}</span>
                    <strong>Resumen</strong>
                  </div>
                </div>
                <div className="summary-grid">
                  <Card className="ui-card metric-card metric-card--business">
                    <Card.Content className="metric-card__body">
                      <div className="metric-card__topline">
                        <span>Negocio</span>
                        <BriefcaseBusiness aria-hidden="true" size={20} />
                      </div>
                      <strong>{businessName || "Sin nombre"}</strong>
                    </Card.Content>
                  </Card>
                  <Card className="ui-card metric-card metric-card--income">
                    <Card.Content className="metric-card__body">
                      <div className="metric-card__topline">
                        <span>Servicios activos</span>
                        <Sparkles aria-hidden="true" size={20} />
                      </div>
                      <strong>{activeServices.length}</strong>
                      <p>{activeServices.map((svc) => svc.name).join(", ") || "Ninguno"}</p>
                    </Card.Content>
                  </Card>
                  <Card className="ui-card metric-card metric-card--salary">
                    <Card.Content className="metric-card__body">
                      <div className="metric-card__topline">
                        <span>Insumos configurados</span>
                        <FlaskConical aria-hidden="true" size={20} />
                      </div>
                      <strong>{activeRawMaterials.length}</strong>
                      <p>{activeRawMaterials.map((mat) => mat.name).join(", ") || "Ninguno"}</p>
                    </Card.Content>
                  </Card>
                  <Card className="ui-card metric-card metric-card--expense">
                    <Card.Content className="metric-card__body">
                      <div className="metric-card__topline">
                        <span>Gastos fijos mensuales</span>
                        <Wallet aria-hidden="true" size={20} />
                      </div>
                      <strong>{formatCurrency(totalFixedExpenses)}</strong>
                      <p>{visibleFixedExpenses.length} compromisos</p>
                    </Card.Content>
                  </Card>
                  <Card className="ui-card metric-card metric-card--vales">
                    <Card.Content className="metric-card__body">
                      <div className="metric-card__topline">
                        <span>Mi salario objetivo</span>
                        <Coins aria-hidden="true" size={20} />
                      </div>
                      <strong>{formatCurrency(ownerSalaryTarget || 0)}</strong>
                      <p>Meta mensual</p>
                    </Card.Content>
                  </Card>
                </div>
                <p className="hint-text">Si algo no está perfecto, puedes ajustarlo después en Configuración.</p>
              </Card.Content>
            </Card>
          ) : null}

          {error ? <p className="error-text">{error}</p> : null}

          <div className="onboarding-actions">
            <Button isDisabled={step === 0 || isSubmitting} variant="secondary" onPress={previousStep}>
              <ChevronLeft aria-hidden="true" size={18} />
              Anterior
            </Button>
            <span className="onboarding-actions__step-info">
              {step + 1} de {steps.length}
            </span>
            {step < steps.length - 1 ? (
              <Button onPress={nextStep}>
                Siguiente
                <ArrowRight aria-hidden="true" size={18} />
              </Button>
            ) : (
              <Button isPending={isSubmitting} type="submit">
                Entrar al dashboard
                <ArrowRight aria-hidden="true" size={18} />
              </Button>
            )}
          </div>
        </form>

        <footer className="onboarding-footer">
          <Button variant="ghost" onPress={() => void signOut()}>
            Salir y cerrar sesión
          </Button>
        </footer>
      </section>

      {/* ---- Service BottomSheet ---- */}
      {isServiceSheetOpen ? (
        <BottomSheet isOpen eyebrow="Servicios iniciales" title={editingServiceId ? "Editar servicio" : "Nuevo servicio"} onClose={closeServiceSheet}>
          <form className="form-stack" onSubmit={handleServiceSubmit}>
            <TextField className="form-control" isRequired name="svc-sheet-name">
              <Label>Nombre del servicio</Label>
              <Input autoComplete="off" value={svcSheetName} variant="secondary" onChange={(e) => setSvcSheetName(e.target.value)} />
            </TextField>
            <MoneyField isRequired label="Precio" minValue={1} value={svcSheetPrice} onChange={setSvcSheetPrice} />
            <div className="chip-list" aria-label="Modo de cálculo del costo">
              <Button size="sm" variant={svcSheetCostMode === "automatic" ? "primary" : "tertiary"} onPress={() => { setSvcSheetCostMode("automatic"); setSvcSheetCost(undefined); }}>
                Automático
              </Button>
              <Button size="sm" variant={svcSheetCostMode === "manual" ? "primary" : "tertiary"} onPress={() => { setSvcSheetCostMode("manual"); if (svcSheetCost === undefined) setSvcSheetCost(0); }}>
                Manual
              </Button>
            </div>
            {svcSheetCostMode === "manual" ? (
              <MoneyField isRequired label="Costo estimado" value={svcSheetCost} onChange={setSvcSheetCost} />
            ) : (
              <p className="hint-text">El costo se calcula con los insumos asociados al servicio.</p>
            )}
            {serviceSheetError ? <p className="error-text">{serviceSheetError}</p> : null}
            <div className="button-row">
              <Button type="submit">{editingServiceId ? "Guardar cambios" : "Crear servicio"}</Button>
              <Button variant="ghost" onPress={closeServiceSheet}>Cancelar</Button>
            </div>
          </form>
        </BottomSheet>
      ) : null}

      {/* ---- Raw Material BottomSheet ---- */}
      {isMaterialSheetOpen ? (
        <BottomSheet isOpen eyebrow="Materias primas" title={editingMaterialId ? "Editar insumo" : "Nuevo insumo"} onClose={closeMaterialSheet}>
          <form className="form-stack" onSubmit={handleMaterialSubmit}>
            <TextField className="form-control" isRequired name="mat-name">
              <Label>Nombre del insumo</Label>
              <Input autoComplete="off" value={matName} variant="secondary" onChange={(e) => setMatName(e.target.value)} />
            </TextField>
            <div className="chip-list" aria-label="Tipo de medición">
              {(Object.keys(measurementLabels) as MeasurementType[]).map((type) => (
                <Button key={type} size="sm" variant={matMeasurementType === type ? "primary" : "tertiary"} onPress={() => changeMatMeasurementType(type)}>
                  {measurementLabels[type]}
                </Button>
              ))}
            </div>
            <NumberField label="Cantidad comprada" minValue={1} value={matQuantity} onChange={setMatQuantity} />
            <div className="chip-list" aria-label="Unidad de compra">
              {getPurchaseUnits(matMeasurementType).map((unit) => (
                <Button key={unit} size="sm" variant={matUnit === unit ? "primary" : "tertiary"} onPress={() => setMatUnit(unit)}>
                  {unitLabels[unit]}
                </Button>
              ))}
            </div>
            <MoneyField isRequired label="Precio de compra" value={matPrice} onChange={setMatPrice} />
            <NumberField label="Mínimo recomendado" value={matMinimumStock} onChange={setMatMinimumStock} />
            {materialPreview ? (
              <Card className="ui-card setup-summary service-margin-preview">
                <Card.Content>
                  <FlaskConical aria-hidden="true" size={20} />
                  <div>
                    <span>Base para cálculo</span>
                    <strong>{formatQuantity(materialPreview.baseQuantity, materialPreview.baseUnit)} · {formatCurrency(materialPreview.unitCost)} / {unitLabels[materialPreview.baseUnit]}</strong>
                  </div>
                </Card.Content>
              </Card>
            ) : null}
            {materialError ? <p className="error-text">{materialError}</p> : null}
            <div className="button-row">
              <Button type="submit">{editingMaterialId ? "Guardar insumo" : "Crear insumo"}</Button>
              <Button variant="ghost" onPress={closeMaterialSheet}>Cancelar</Button>
            </div>
          </form>
        </BottomSheet>
      ) : null}

      {/* ---- Fixed Expense BottomSheet ---- */}
      {isExpenseSheetOpen ? (
        <BottomSheet isOpen eyebrow="Gastos fijos" title={editingExpenseId ? "Editar gasto fijo" : "Nuevo gasto fijo"} onClose={closeExpenseSheet}>
          <form className="form-stack" onSubmit={handleExpenseSubmit}>
            <TextField className="form-control" isRequired name="exp-name">
              <Label>Nombre</Label>
              <Input autoComplete="off" value={expName} variant="secondary" onChange={(e) => setExpName(e.target.value)} />
            </TextField>
            <MoneyField isRequired label="Valor" minValue={1} value={expAmount} onChange={setExpAmount} />
            <TextField className="form-control" isRequired name="exp-due-day">
              <Label>Día estimado de pago</Label>
              <Input
                inputMode="numeric"
                max={31}
                min={1}
                type="number"
                value={String(expDueDay ?? "")}
                variant="secondary"
                onChange={(event) => setExpDueDay(event.target.value ? Number(event.target.value) : undefined)}
              />
            </TextField>
            <label className="form-control">
              <span>Categoría</span>
              <select
                className="native-date"
                value={expCategoryId}
                onChange={(event) => setExpCategoryId(event.target.value)}
              >
                <option value="">Sin categoría</option>
                {categories.filter((cat) => cat.isActive).map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </label>
            {expenseSheetError ? <p className="error-text">{expenseSheetError}</p> : null}
            <div className="button-row">
              <Button type="submit">{editingExpenseId ? "Guardar cambios" : "Crear gasto fijo"}</Button>
              <Button variant="ghost" onPress={closeExpenseSheet}>Cancelar</Button>
            </div>
          </form>
        </BottomSheet>
      ) : null}
    </main>
  );
}

function NumberField({ label, value, onChange, minValue = 0 }: { label: string; value: number | undefined; onChange: (value: number | undefined) => void; minValue?: number }) {
  return (
    <TextField className="form-control">
      <Label>{label}</Label>
      <Input
        inputMode="numeric"
        min={minValue}
        type="number"
        value={value === undefined ? "" : String(value)}
        variant="secondary"
        onChange={(e) => { const parsed = Number(e.target.value); onChange(e.target.value === "" ? undefined : Number.isNaN(parsed) ? value : parsed); }}
      />
    </TextField>
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
