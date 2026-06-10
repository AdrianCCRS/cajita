import { CircleDollarSign, Home, ListChecks, Scissors, Settings, X } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../shared/auth/AuthContext";
import { useSpaData, defaultTransactionDate } from "../shared/data/SpaDataContext";
import type { ExpenseType, PaymentMethod, TransactionType } from "../shared/types/domain";
import { formatCurrency } from "../shared/utils/formatCurrency";
import { getEstimatedProfit, getMonthlyExpenses, getMonthlyIncome, getMonthlyWithdrawals } from "../shared/utils/financials";

const navItems = [
  { to: "/", label: "Inicio", icon: Home },
  { to: "/historial", label: "Historial", icon: ListChecks },
  { to: "/servicios", label: "Servicios", icon: Scissors },
  { to: "/configuracion", label: "Config", icon: Settings },
];

export function AppShell() {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const { isFirebaseEnabled, signOut } = useAuth();
  const { source, isLoading, error } = useSpaData();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Control financiero</p>
          <h1>Spa Control</h1>
        </div>
        <div className="header-actions">
          <span className="status-pill">{source === "firebase" ? "Firebase" : "Demo local"}</span>
          {isFirebaseEnabled ? (
            <button className="secondary-button compact" type="button" onClick={() => void signOut()}>
              Salir
            </button>
          ) : null}
        </div>
      </header>

      <main className="app-main">
        {isLoading ? <p className="hint-text">Cargando datos...</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
        <Outlet />
      </main>

      <button
        className="quick-action"
        type="button"
        aria-label="Registrar movimiento"
        onClick={() => setIsRegisterOpen(true)}
      >
        <CircleDollarSign aria-hidden="true" size={26} />
      </button>

      {isRegisterOpen ? <RegisterMovementDialog onClose={() => setIsRegisterOpen(false)} /> : null}

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

function RegisterMovementDialog({ onClose }: { onClose: () => void }) {
  const { services, categories, transactions, financialSettings, addTransaction } = useSpaData();
  const activeServices = services.filter((service) => service.isActive);
  const activeCategories = categories.filter((category) => category.isActive);
  const [type, setType] = useState<TransactionType>("income");
  const [serviceId, setServiceId] = useState(activeServices[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(activeCategories[0]?.id ?? "");
  const selectedService = activeServices.find((service) => service.id === serviceId);
  const [amount, setAmount] = useState(selectedService?.defaultPrice.toString() ?? "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [expenseType, setExpenseType] = useState<ExpenseType>("variable");
  const [date, setDate] = useState(defaultTransactionDate());
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date();
  const monthly = useMemo(() => {
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const income = getMonthlyIncome(transactions, year, month);
    const expenses = getMonthlyExpenses(transactions, year, month);
    const withdrawals = getMonthlyWithdrawals(transactions, year, month);
    return { available: getEstimatedProfit(income, expenses), withdrawals };
  }, [transactions]);

  function changeType(nextType: TransactionType) {
    setType(nextType);
    setError("");
    setSuccess("");
    if (nextType === "income") {
      setAmount(selectedService?.defaultPrice.toString() ?? "");
    } else {
      setAmount("");
    }
  }

  function changeService(nextServiceId: string) {
    const nextService = activeServices.find((service) => service.id === nextServiceId);
    setServiceId(nextServiceId);
    setAmount(nextService?.defaultPrice.toString() ?? "");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("El valor debe ser mayor a $0");
      return;
    }

    try {
      setIsSubmitting(true);
      const transaction =
        type === "income"
          ? await addTransaction({ type, serviceId, amount: numericAmount, paymentMethod, date, notes })
          : type === "expense"
            ? await addTransaction({ type, categoryId, amount: numericAmount, expenseType, paymentMethod, date, notes })
            : await addTransaction({ type, amount: numericAmount, paymentMethod, date, notes });

      const message =
        transaction.type === "income"
          ? `¡Listo! ${transaction.serviceName} por ${formatCurrency(transaction.amount)} quedó registrada.`
          : transaction.type === "expense"
            ? `Gasto de ${formatCurrency(transaction.amount)} en ${transaction.categoryName} registrado.`
            : `¡Te pagaste ${formatCurrency(transaction.amount)}! Ya llevas ${formatCurrency(
                monthly.withdrawals + transaction.amount,
              )} de tu meta mensual.`;
      setSuccess(message);
      setError("");
      setNotes("");
      if (type !== "income") {
        setAmount("");
      }
      window.setTimeout(onClose, 900);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Algo salió mal. Intenta de nuevo en un momento.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="register-title">
        <header className="sheet-header">
          <div>
            <p className="eyebrow">Registro rápido</p>
            <h2 id="register-title">Nuevo movimiento</h2>
          </div>
          <button className="icon-button" type="button" aria-label="Cerrar" onClick={onClose}>
            <X aria-hidden="true" size={22} />
          </button>
        </header>

        <form className="form-stack" onSubmit={handleSubmit}>
          <div className="segmented" aria-label="Tipo de movimiento">
            <button type="button" className={type === "income" ? "active" : ""} onClick={() => changeType("income")}>
              Venta
            </button>
            <button type="button" className={type === "expense" ? "active" : ""} onClick={() => changeType("expense")}>
              Gasto
            </button>
            <button
              type="button"
              className={type === "withdrawal" ? "active" : ""}
              onClick={() => changeType("withdrawal")}
            >
              Pagarme
            </button>
          </div>

          {type === "income" ? (
            <label>
              Servicio
              <select value={serviceId} onChange={(event) => changeService(event.target.value)} required>
                {activeServices.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {type === "expense" ? (
            <>
              <label>
                Categoría
                <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required>
                  {activeCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Tipo de gasto
                <select value={expenseType} onChange={(event) => setExpenseType(event.target.value as ExpenseType)}>
                  <option value="fixed">Fijo</option>
                  <option value="variable">Variable</option>
                  <option value="extraordinary">Extraordinario</option>
                </select>
              </label>
            </>
          ) : null}

          <label>
            Valor
            <input
              inputMode="numeric"
              min="1"
              type="number"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0"
              required
            />
          </label>

          <label>
            Método de pago
            <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}>
              <option value="cash">Efectivo</option>
              <option value="transfer">Transferencia</option>
              <option value="other">Otro</option>
            </select>
          </label>

          <label>
            Fecha
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
          </label>

          <label>
            Nota opcional
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} />
          </label>

          {type === "withdrawal" && Number(amount) > monthly.available ? (
            <p className="warning-text">Este pago supera el dinero disponible del negocio. Puedes guardarlo si así lo decides.</p>
          ) : null}
          {type === "withdrawal" ? (
            <p className="hint-text">
              Meta mensual: {formatCurrency(financialSettings.salaryTarget)}. Pagado este mes:{" "}
              {formatCurrency(monthly.withdrawals)}.
            </p>
          ) : null}
          {error ? <p className="error-text">{error}</p> : null}
          {success ? <p className="success-text">{success}</p> : null}

          <button className="primary-button" type="submit" disabled={isSubmitting}>
            Guardar
          </button>
        </form>
      </section>
    </div>
  );
}
