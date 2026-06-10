import { formatCurrency } from "../../shared/utils/formatCurrency";
import { useSpaData } from "../../shared/data/SpaDataContext";
import { isToday } from "../../shared/utils/dates";
import {
  getBreakEvenPoint,
  getBreakEvenProgress,
  getDailySuggestedGoal,
  getEstimatedProfit,
  getMonthlyExpenses,
  getMonthlyIncome,
  getMonthlyWithdrawals,
  getNetProfit,
  getOwnerSalaryPending,
  getTopServiceByRevenue,
  getTopServiceBySales,
} from "../../shared/utils/financials";

export function DashboardPlaceholder() {
  const { transactions, fixedExpenses, financialSettings } = useSpaData();
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const monthlyIncome = getMonthlyIncome(transactions, year, month);
  const monthlyExpenses = getMonthlyExpenses(transactions, year, month);
  const monthlyWithdrawals = getMonthlyWithdrawals(transactions, year, month);
  const todayIncome = transactions
    .filter((transaction) => transaction.type === "income" && isToday(transaction.date))
    .reduce((total, transaction) => total + transaction.amount, 0);
  const todayExpenses = transactions
    .filter((transaction) => transaction.type === "expense" && isToday(transaction.date))
    .reduce((total, transaction) => total + transaction.amount, 0);
  const estimatedProfit = getEstimatedProfit(monthlyIncome, monthlyExpenses);
  const netProfit = getNetProfit(monthlyIncome, monthlyExpenses, monthlyWithdrawals);
  const salaryPending = getOwnerSalaryPending(financialSettings.salaryTarget, monthlyWithdrawals);
  const breakEven = getBreakEvenPoint(fixedExpenses, transactions);
  const breakEvenProgress = breakEven ? getBreakEvenProgress(monthlyIncome, breakEven) : 0;
  const topSales = getTopServiceBySales(transactions);
  const topRevenue = getTopServiceByRevenue(transactions);

  return (
    <section className="screen-stack" aria-labelledby="dashboard-title">
      <div className="hero-panel">
        <h2 id="dashboard-title">Cómo vas este mes</h2>
        <p>Ventas, gastos, salario y lo que queda para reinvertir, sin mezclar cuentas.</p>
      </div>

      <div className="placeholder-grid">
        <article className="metric-card">
          <span>Ventas de hoy</span>
          <strong>{formatCurrency(todayIncome)}</strong>
          {!todayIncome ? <p>Hoy todavía no hay ventas registradas. ¡Empieza cuando quieras!</p> : null}
        </article>
        <article className="metric-card">
          <span>Gastos de hoy</span>
          <strong>{formatCurrency(todayExpenses)}</strong>
        </article>
        <article className="metric-card">
          <span>Ventas del mes</span>
          <strong>{formatCurrency(monthlyIncome)}</strong>
        </article>
        <article className="metric-card tone-expense">
          <span>Gastos del negocio</span>
          <strong>{formatCurrency(monthlyExpenses)}</strong>
          {!monthlyExpenses ? <p>No has registrado gastos este mes. ¡Eso es buena señal!</p> : null}
        </article>
        <article className="metric-card tone-business">
          <span>Dinero del negocio</span>
          <strong>{formatCurrency(estimatedProfit)}</strong>
          <p>Ventas menos gastos. Aquí no contamos tu salario.</p>
        </article>
        <article className="metric-card tone-salary">
          <span>Mi salario pagado</span>
          <strong>{formatCurrency(monthlyWithdrawals)}</strong>
          <p>
            {salaryPending > 0
              ? `Te faltan ${formatCurrency(salaryPending)} para tu meta.`
              : `Te pagaste ${formatCurrency(Math.abs(salaryPending))} por encima de tu meta.`}
          </p>
        </article>
        <article className="metric-card tone-profit">
          <span>Ganancia para reinversión</span>
          <strong>{formatCurrency(netProfit)}</strong>
          <p>Lo que quedó después de gastos y salario.</p>
        </article>
      </div>

      <article className="wide-card">
        <div className="section-heading">
          <div>
            <span>Meta mínima para no perder plata</span>
            <strong>{breakEven ? formatCurrency(breakEven) : "Sin datos suficientes"}</strong>
          </div>
          {breakEven ? <b>{Math.round(breakEvenProgress)}%</b> : null}
        </div>
        {breakEven ? (
          <>
            <div className="progress-track" aria-label="Avance de meta mínima">
              <span style={{ width: `${Math.min(breakEvenProgress, 100)}%` }} />
            </div>
            <p>Meta sugerida por día: {formatCurrency(getDailySuggestedGoal(breakEven, 24))}.</p>
          </>
        ) : (
          <p>Configura tus gastos fijos para ver cuánto necesitas vender cada mes.</p>
        )}
      </article>

      <div className="placeholder-grid">
        <article className="task-card">
          <span>Servicio más vendido</span>
          <strong>{topSales?.serviceName ?? "Sin ventas todavía"}</strong>
          <p>{topSales ? `${topSales.count} ventas registradas.` : "Registra ventas para ver esta métrica."}</p>
        </article>
        <article className="task-card">
          <span>Servicio que más dinero dejó</span>
          <strong>{topRevenue?.serviceName ?? "Sin ventas todavía"}</strong>
          <p>{topRevenue ? formatCurrency(topRevenue.total) : "Aparecerá cuando registres ventas."}</p>
        </article>
      </div>
    </section>
  );
}
