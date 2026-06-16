import { Banknote, CircleDollarSign, HandCoins, Home, ListChecks, Moon, Package, Receipt, Scissors, Settings, UserRound, X } from "lucide-react";
import { useMemo, useState, type FormEvent, type Key } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../shared/auth/AuthContext";
import { defaultTransactionDate, useSpaData } from "../shared/data/SpaDataContext";
import type { ExpenseType, PaymentMethod, Transaction, TransactionType } from "../shared/types/domain";
import { formatCurrency } from "../shared/utils/formatCurrency";
import { getEstimatedProfit, getMonthlyExpenses, getMonthlyIncome, getMonthlyPersonalVouchers, getMonthlyWithdrawals } from "../shared/utils/financials";
import { transactionSchema } from "../shared/validation/schemas";
import { BottomSheet, Button, Card, Label, MoneyField, SkeletonCard, TextArea, TextField, ToastRegion } from "../shared/components/ui";
import { Avatar, Dropdown, Switch } from "@heroui/react";
import { ArrowRightFromSquare } from "@gravity-ui/icons";

const navItems = [
  { id: "inicio", to: "/", label: "Inicio", icon: Home },
  { id: "historial", to: "/historial", label: "Historial", icon: ListChecks },
  { id: "servicios", to: "/servicios", label: "Servicios", icon: Scissors },
  { id: "configuracion", to: "/configuracion", label: "Configuración", icon: Settings },
];

type Toast = {
  kind?: "success" | "warning" | "error";
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function AppShell() {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [initialType, setInitialType] = useState<TransactionType>("income");
  const [toast, setToast] = useState<Toast | null>(null);
  const navigate = useNavigate();
  const { isFirebaseEnabled, signOut, user } = useAuth();
  const { business, isLoading, error, uiSettings, updateThemeMode } = useSpaData();
  const isDarkMode = uiSettings.themeMode === "dark";

  function openRegister(type: TransactionType) {
    setInitialType(type);
    setIsRegisterOpen(true);
  }

  function showToast(nextToast: Toast) {
    setToast(nextToast);
    window.setTimeout(() => setToast(null), nextToast.actionLabel ? 5000 : 3000);
  }

  async function handleMenuAction(key: Key) {
    if (key === "logout") {
      await signOut();
      return;
    }

    const selectedItem = navItems.find((item) => item.id === key);
    if (selectedItem) {
      navigate(selectedItem.to);
    }
  }

  async function handleThemeModeChange(isSelected: boolean) {
    const nextMode = isSelected ? "dark" : "light";
    try {
      await updateThemeMode(nextMode);
      showToast({ kind: "success", message: "Tema actualizado." });
    } catch {
      showToast({ kind: "error", message: "No pudimos guardar el tema. Intenta nuevamente." });
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow flex items-center gap-1"><Package className="size-3.5" />Cajita</p>
          <h1>{business.name}</h1>
        </div>
        <div className="header-actions">
          {isFirebaseEnabled ? (
            <Dropdown>
              <Dropdown.Trigger>
                <Avatar size="lg" variant="soft">
                  <Avatar.Fallback className="avatar--business" delayMs={600}>{getFirstLetters(business.name)}</Avatar.Fallback>
                </Avatar>
              </Dropdown.Trigger>
              <Dropdown.Popover>
                <div className="px-3 pt-3 pb-1">
                  <div className="flex items-center gap-2">
                    <Avatar size="md">
                      <Avatar.Fallback>{getFirstLetters(business.name)}</Avatar.Fallback>
                    </Avatar>
                    <div className="flex flex-col gap-0">
                      <p className="text-sm leading-5 font-medium">{business.name}</p>
                      <p className="text-xs leading-none text-muted">{user?.email ?? "Sin correo disponible"}</p>
                    </div>
                  </div>
                </div>
                <div className="dropdown-theme-row">
                  <div className="dropdown-theme-row__label">
                    <Moon aria-hidden="true" size={16} />
                    <span>Modo oscuro</span>
                  </div>
                  <Switch
                    aria-label="Modo oscuro"
                    isSelected={isDarkMode}
                    size="sm"
                    onChange={handleThemeModeChange}
                  >
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                  </Switch>
                </div>
                <Dropdown.Menu onAction={handleMenuAction}>
                  {navItems.map((item) => (
                    <Dropdown.Item key={item.id} id={item.id} textValue={item.label}>
                      <div className="flex w-full items-center justify-between gap-2">
                        <Label>{item.label}</Label>
                        <item.icon className="size-3.5 text-muted" />
                      </div>
                    </Dropdown.Item>
                  ))}
                  <Dropdown.Item id="logout" textValue="Logout" variant="danger">
                    <div className="flex w-full items-center justify-between gap-2">
                      <Label>Salir</Label>
                      <ArrowRightFromSquare className="size-3.5 text-danger" />
                    </div>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          ) : null}
        </div>
      </header>

      <main className="app-main">
        {isLoading ? (
          <div className="placeholder-grid" aria-label="Cargando datos">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : null}
        {error ? (
          <Card className="ui-card error-panel">
            <Card.Content>
              <strong>Algo salió mal.</strong>
              <p>{error}</p>
              <Button variant="outline" onPress={() => window.location.reload()}>
                Reintentar
              </Button>
            </Card.Content>
          </Card>
        ) : null}
        <Outlet context={{ openRegister, showToast }} />
      </main>

      <QuickActionFab onSelect={openRegister} />

      {isRegisterOpen ? (
        <RegisterMovementSheet
          initialType={initialType}
          onClose={() => setIsRegisterOpen(false)}
          onSaved={(message) => showToast({ kind: "success", message })}
        />
      ) : null}

      <ToastRegion toast={toast} onDismiss={() => setToast(null)} />

      <nav className="bottom-nav" aria-label="Navegación principal">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            <item.icon aria-hidden="true" size={21} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function QuickActionFab({ onSelect }: { onSelect: (type: TransactionType) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);

  function choose(type: TransactionType) {
    setIsExpanded(false);
    onSelect(type);
  }

  return (
    <div className="fab-cluster">
      <div className={`fab-menu${isExpanded ? " fab-menu--expanded" : ""}`} aria-hidden={!isExpanded} aria-label="Acciones rápidas">
        <Button className="btn-income" onPress={() => choose("income")}>
          <Banknote aria-hidden="true" size={18} />
            Venta
          </Button>
          <Button variant="secondary" className="btn-expense" onPress={() => choose("expense")}>
            <Receipt aria-hidden="true" size={18} />
            Gasto
          </Button>
          <Button variant="secondary" className="btn-withdrawal" onPress={() => choose("withdrawal")}>
            <UserRound aria-hidden="true" size={18} />
            Pagarme
          </Button>
          <Button variant="secondary" className="btn-voucher" onPress={() => choose("personal_voucher")}>
            <HandCoins aria-hidden="true" size={18} />
            Vale
          </Button>
        </div>
      <Button
        isIconOnly
        aria-label={isExpanded ? "Cerrar acciones rápidas" : "Registrar movimiento"}
        className={`quick-action${isExpanded ? " quick-action--active" : ""}`}
        onPress={() => setIsExpanded((current) => !current)}
      >
        {isExpanded ? <X aria-hidden="true" size={26} /> : <CircleDollarSign aria-hidden="true" size={26} />}
      </Button>
    </div>
  );
}

function RegisterMovementSheet({
  initialType,
  onClose,
  onSaved,
}: {
  initialType: TransactionType;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const { services, categories, personalExpenseCategories, transactions, financialSettings, addTransaction } = useSpaData();
  const activeServices = services.filter((service) => service.isActive);
  const activeCategories = categories.filter((category) => category.isActive);
  const activePersonalCategories = personalExpenseCategories.filter((category) => category.isActive);
  const [type, setType] = useState<TransactionType>(initialType);
  const [serviceId, setServiceId] = useState(activeServices[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(activeCategories[0]?.id ?? "");
  const [personalCategoryId, setPersonalCategoryId] = useState(activePersonalCategories[0]?.id ?? "");
  const selectedService = activeServices.find((service) => service.id === serviceId);
  const [amount, setAmount] = useState<number | undefined>(initialType === "income" ? selectedService?.defaultPrice : undefined);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [expenseType, setExpenseType] = useState<ExpenseType>("variable");
  const [date, setDate] = useState(defaultTransactionDate());
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date();
  const monthly = useMemo(() => {
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const income = getMonthlyIncome(transactions, year, month);
    const expenses = getMonthlyExpenses(transactions, year, month);
    const withdrawals = getMonthlyWithdrawals(transactions, year, month);
    const personalVouchers = getMonthlyPersonalVouchers(transactions, year, month);
    return { available: getEstimatedProfit(income, expenses), withdrawals, personalVouchers };
  }, [transactions]);

  function changeType(nextType: TransactionType) {
    setType(nextType);
    setError("");
    if (nextType === "income") {
      const nextService = activeServices.find((service) => service.id === serviceId) ?? activeServices[0];
      setServiceId(nextService?.id ?? "");
      setAmount(nextService?.defaultPrice);
    } else {
      setAmount(undefined);
    }
  }

  function changeService(nextServiceId: string) {
    const nextService = activeServices.find((service) => service.id === nextServiceId);
    setServiceId(nextServiceId);
    setAmount(nextService?.defaultPrice);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numericAmount = amount ?? 0;
    const parsed = transactionSchema.safeParse({ amount: numericAmount, date, paymentMethod, notes });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Revisa los datos.");
      return;
    }

    if (type === "income" && !serviceId) {
      setError("Aún no has configurado tus servicios. Es el primer paso.");
      return;
    }

    if (type === "expense" && !categoryId) {
      setError("Elige una categoría para el gasto.");
      return;
    }

    if (type === "personal_voucher" && !personalCategoryId) {
      setError("Elige una categoría personal para el vale.");
      return;
    }

    try {
      setIsSubmitting(true);
      const transaction =
        type === "income"
          ? await addTransaction({ type, serviceId, amount: numericAmount, paymentMethod, date, notes })
          : type === "expense"
            ? await addTransaction({ type, categoryId, amount: numericAmount, expenseType, paymentMethod, date, notes })
            : type === "withdrawal"
              ? await addTransaction({ type, amount: numericAmount, paymentMethod, date, notes })
              : await addTransaction({ type, personalCategoryId, amount: numericAmount, paymentMethod, date, notes });

      onSaved(buildSuccessMessage(transaction, monthly.withdrawals, monthly.personalVouchers));
      onClose();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Algo salió mal. Intenta de nuevo en un momento.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <BottomSheet isOpen title="Nuevo movimiento" eyebrow="Registro rápido" onClose={onClose}>
      <form className="form-stack register-form" onSubmit={handleSubmit}>
        <div className="segmented" aria-label="Tipo de movimiento">
          <Button variant={type === "income" ? "primary" : "tertiary"} className={type === "income" ? "segmented--income" : ""} onPress={() => changeType("income")}>
            <Banknote aria-hidden="true" size={16} />
            Venta
          </Button>
          <Button variant={type === "expense" ? "primary" : "tertiary"} className={type === "expense" ? "segmented--expense" : ""} onPress={() => changeType("expense")}>
            <Receipt aria-hidden="true" size={16} />
            Gasto
          </Button>
          <Button
            variant={type === "withdrawal" ? "primary" : "tertiary"}
            className={type === "withdrawal" ? "segmented--withdrawal" : ""}
            onPress={() => changeType("withdrawal")}
          >
            <UserRound aria-hidden="true" size={16} />
            Pagarme
          </Button>
          <Button
            variant={type === "personal_voucher" ? "primary" : "tertiary"}
            className={type === "personal_voucher" ? "segmented--voucher" : ""}
            onPress={() => changeType("personal_voucher")}
          >
            <HandCoins aria-hidden="true" size={16} />
            Vale
          </Button>
        </div>

        {type === "income" ? (
          <OptionGroup
            emptyText="Aún no has configurado tus servicios. Es el primer paso."
            items={activeServices.map((service) => ({
              id: service.id,
              label: service.name,
              detail: formatCurrency(service.defaultPrice),
            }))}
            label="Servicio"
            selectedId={serviceId}
            onSelect={changeService}
          />
        ) : null}

        {type === "personal_voucher" ? (
          <OptionGroup
            emptyText="No hay categorías personales disponibles."
            items={activePersonalCategories.map((category) => ({
              id: category.id,
              label: category.name,
            }))}
            label="Categoría personal"
            selectedId={personalCategoryId}
            onSelect={setPersonalCategoryId}
          />
        ) : null}

        {type === "expense" ? (
          <>
            <OptionGroup
              emptyText="No hay categorías disponibles."
              items={activeCategories.map((category) => ({
                id: category.id,
                label: category.name,
              }))}
              label="Categoría"
              selectedId={categoryId}
              onSelect={setCategoryId}
            />
            <OptionGroup
              items={[
                { id: "fixed", label: "Fijo" },
                { id: "variable", label: "Variable" },
                { id: "extraordinary", label: "Extraordinario" },
              ]}
              label="Tipo de gasto"
              selectedId={expenseType}
              onSelect={(value) => setExpenseType(value as ExpenseType)}
            />
          </>
        ) : null}

        <MoneyField isRequired label="Valor" minValue={1} value={amount} onChange={setAmount} />

        <OptionGroup
          items={[
            { id: "cash", label: "Efectivo" },
            { id: "transfer", label: "Transferencia" },
            { id: "other", label: "Otro" },
          ]}
          label="Método de pago"
          selectedId={paymentMethod}
          onSelect={(value) => setPaymentMethod(value as PaymentMethod)}
        />

        <input
          aria-label="Fecha"
          autoComplete="off"
          className="native-date"
          name="transaction-date"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          required
        />

        <TextField
          className="form-control"
          name="transaction-notes"
        >
          <Label>Nota opcional</Label>
          <TextArea
            autoComplete="off"
            rows={2}
            value={notes}
            variant="secondary"
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
          />
        </TextField>

        {type === "withdrawal" && (amount ?? 0) > monthly.available ? (
          <p className="warning-text">Este pago supera el dinero disponible del negocio. Puedes guardarlo si así lo decides.</p>
        ) : null}
        {type === "withdrawal" ? (
          <p className="hint-text">
            Meta mensual: {formatCurrency(financialSettings.salaryTarget)}. Pagado este mes: {formatCurrency(monthly.withdrawals)}.
          </p>
        ) : null}
        {type === "personal_voucher" ? (
          <p className="hint-text">
            Este valor se descuenta de tu salario del mes. No se cuenta como gasto del negocio.
          </p>
        ) : null}
        {error ? <p className="error-text">{error}</p> : null}

        <Button isPending={isSubmitting} type="submit">
          Guardar
        </Button>
      </form>
    </BottomSheet>
  );
}

function OptionGroup({
  label,
  items,
  selectedId,
  emptyText,
  onSelect,
}: {
  label: string;
  items: Array<{ id: string; label: string; detail?: string }>;
  selectedId: string;
  emptyText?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="option-group">
      <span>{label}</span>
      {items.length ? (
        <div className="chip-list">
          {items.map((item) => (
            <Button
              aria-pressed={selectedId === item.id}
              className="choice-chip"
              key={item.id}
              size="sm"
              variant={selectedId === item.id ? "primary" : "tertiary"}
              onPress={() => onSelect(item.id)}
            >
              {item.label}
              {item.detail ? <small>{item.detail}</small> : null}
            </Button>
          ))}
        </div>
      ) : (
        <p className="hint-text">{emptyText}</p>
      )}
    </div>
  );
}

function buildSuccessMessage(transaction: Transaction, previousWithdrawals: number, previousPersonalVouchers: number) {
  if (transaction.type === "income") {
    return `¡Listo! ${transaction.serviceName} por ${formatCurrency(transaction.amount)} quedó registrada.`;
  }

  if (transaction.type === "expense") {
    return `Gasto de ${formatCurrency(transaction.amount)} en ${transaction.categoryName} registrado.`;
  }

  if (transaction.type === "personal_voucher") {
    return `Vale de ${formatCurrency(transaction.amount)} en ${transaction.personalCategoryName} registrado. Se descuenta de tu salario.`;
  }

  return `¡Te pagaste ${formatCurrency(transaction.amount)}! Ya llevas ${formatCurrency(
    previousWithdrawals + previousPersonalVouchers + transaction.amount,
  )} de tu meta mensual.`;
}

function getFirstLetters(name: string) {
  const parts = name.trim().split(" ");
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
