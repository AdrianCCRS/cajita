import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Button, Card, HelpDrawer, MetricCard, ProgressBar, ScreenHero } from "../../shared/components/ui";
import { useSpaData } from "../../shared/data/SpaDataContext";
import type { TransactionType } from "../../shared/types/domain";
import { isToday } from "../../shared/utils/dates";
import { formatCurrency } from "../../shared/utils/formatCurrency";
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

type DashboardHelpKey = "income" | "expense" | "business" | "salary" | "profit" | "breakEven";

const helpContent: Record<DashboardHelpKey, { title: string; definition: string; example: string; decision: string }> = {
  income: {
    title: "Ventas",
    definition: "Todo el dinero que entra al negocio por los servicios que prestaste.",
    example: "3 manicuras a $35.000 + cabello a $80.000 = $185.000.",
    decision: "Saber si estás vendiendo lo suficiente para cubrir tus gastos.",
  },
  expense: {
    title: "Gastos",
    definition: "Todo el dinero que sale del negocio para mantenerlo funcionando.",
    example: "Esmaltes $40.000 + arriendo $800.000.",
    decision: "Ver en qué se está yendo la plata del negocio.",
  },
  business: {
    title: "Dinero del negocio",
    definition: "Ventas menos gastos del negocio. Aquí no contamos lo que te pagas a ti.",
    example: "Ventas $1.500.000 - gastos $900.000 = $600.000 para operar.",
    decision: "Saber si el spa tiene dinero para sus próximos compromisos.",
  },
  salary: {
    title: "Mi salario",
    definition: "El dinero que te pagas a ti misma por tu trabajo, separado de los gastos del spa.",
    example: "Tu meta es $1.800.000 y ya te pagaste $600.000.",
    decision: "Ver cuánto falta para pagarte tu meta mensual.",
  },
  profit: {
    title: "Ganancia para reinversión",
    definition: "Lo que queda después de gastos del negocio y tu salario.",
    example: "Ventas $2.500.000 - gastos $900.000 - salario $1.200.000 = $400.000.",
    decision: "Saber si puedes ahorrar, comprar algo para el spa o esperar.",
  },
  breakEven: {
    title: "Meta mínima para no perder plata",
    definition: "La cantidad mínima que necesitas vender para cubrir lo que siempre pagas.",
    example: "Si tus gastos fijos son $1.100.000, esa es la primera meta del mes.",
    decision: "Ver si el mes ya dejó de estar en rojo.",
  },
};

export function DashboardPlaceholder() {
  const { openRegister } = useOutletContext<{ openRegister: (type: TransactionType) => void }>();
  const { transactions, fixedExpenses, financialSettings } = useSpaData();
  const [helpKey, setHelpKey] = useState<DashboardHelpKey | null>(null);
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
  const salaryProgress = financialSettings.salaryTarget ? (monthlyWithdrawals / financialSettings.salaryTarget) * 100 : 0;
  const topSales = getTopServiceBySales(transactions);
  const topRevenue = getTopServiceByRevenue(transactions);
  const selectedHelp = helpKey ? helpContent[helpKey] : null;

  return (
    <section className="screen-stack" aria-labelledby="dashboard-title">
      <ScreenHero title="Cómo vas este mes">
        Ventas, gastos, salario y lo que queda para reinvertir, sin mezclar cuentas.
      </ScreenHero>

      <div className="quick-strip">
        <Button onPress={() => openRegister("income")}>
          Registrar venta
        </Button>
        <Button variant="secondary" onPress={() => openRegister("expense")}>
          Registrar gasto
        </Button>
      </div>

      <div className="placeholder-grid">
        <MetricCard
          description={!todayIncome ? "Hoy todavía no hay ventas registradas. ¡Empieza cuando quieras!" : "Lo que vendiste hoy."}
          title="Ventas de hoy"
          tone="income"
          value={formatCurrency(todayIncome)}
          onHelp={() => setHelpKey("income")}
        />
        <MetricCard
          description={todayExpenses ? "Gastos registrados hoy." : "No has registrado gastos hoy."}
          title="Gastos de hoy"
          tone="expense"
          value={formatCurrency(todayExpenses)}
          onHelp={() => setHelpKey("expense")}
        />
        <MetricCard
          description="Todo lo que vendiste este mes."
          title="Ventas del mes"
          tone="income"
          value={formatCurrency(monthlyIncome)}
          onHelp={() => setHelpKey("income")}
        />
        <MetricCard
          description={!monthlyExpenses ? "No has registrado gastos este mes. ¡Eso es buena señal!" : "Sin contar lo que te pagas."}
          title="Gastos del negocio"
          tone="expense"
          value={formatCurrency(monthlyExpenses)}
          onHelp={() => setHelpKey("expense")}
        />
        <MetricCard
          description="Ventas menos gastos. Aquí no contamos tu salario."
          title="Dinero del negocio"
          tone="business"
          value={formatCurrency(estimatedProfit)}
          onHelp={() => setHelpKey("business")}
        />
        <MetricCard
          description={
            salaryPending > 0
              ? `Te faltan ${formatCurrency(salaryPending)} para tu meta.`
              : `Te pagaste ${formatCurrency(Math.abs(salaryPending))} por encima de tu meta.`
          }
          title="Mi salario pagado"
          tone="salary"
          value={formatCurrency(monthlyWithdrawals)}
          onHelp={() => setHelpKey("salary")}
        />
        <MetricCard
          description="Lo que quedó después de gastos y salario."
          title="Ganancia para reinversión"
          tone="profit"
          value={formatCurrency(netProfit)}
          onHelp={() => setHelpKey("profit")}
        />
      </div>

      <Card className="ui-card wide-card">
        <Card.Content>
          <div className="section-heading">
            <div>
              <span>Meta mínima para no perder plata</span>
              <strong>{breakEven ? formatCurrency(breakEven) : "Sin datos suficientes"}</strong>
            </div>
            {breakEven ? <b>{Math.round(breakEvenProgress)}%</b> : null}
          </div>
          {breakEven ? (
            <>
              <ProgressBar aria-label="Avance de meta mínima" color={breakEvenProgress >= 100 ? "success" : "warning"} value={Math.min(breakEvenProgress, 100)} />
              <p>Meta sugerida por día: {formatCurrency(getDailySuggestedGoal(breakEven, 24))}.</p>
            </>
          ) : (
            <p>Configura tus gastos fijos para ver cuánto necesitas vender cada mes.</p>
          )}
          <Button variant="ghost" onPress={() => setHelpKey("breakEven")}>
            Entender esta meta
          </Button>
        </Card.Content>
      </Card>

      <Card className="ui-card wide-card">
        <Card.Content>
          <div className="section-heading">
            <div>
              <span>Avance de mi salario</span>
              <strong>
                {formatCurrency(monthlyWithdrawals)} de {formatCurrency(financialSettings.salaryTarget)}
              </strong>
            </div>
            <b>{Math.round(salaryProgress)}%</b>
          </div>
          <ProgressBar aria-label="Avance de salario" color="accent" value={Math.min(salaryProgress, 100)} />
          <Button variant="ghost" onPress={() => openRegister("withdrawal")}>
            Registrar pago
          </Button>
        </Card.Content>
      </Card>

      <div className="placeholder-grid">
        <MetricCard
          description={topSales ? `${topSales.count} ventas registradas.` : "Registra ventas para ver esta métrica."}
          title="Servicio más vendido"
          value={topSales?.serviceName ?? "Sin ventas todavía"}
        />
        <MetricCard
          description={topRevenue ? formatCurrency(topRevenue.total) : "Aparecerá cuando registres ventas."}
          title="Servicio que más dinero dejó"
          value={topRevenue?.serviceName ?? "Sin ventas todavía"}
        />
      </div>

      {selectedHelp ? (
        <HelpDrawer
          decision={selectedHelp.decision}
          definition={selectedHelp.definition}
          example={selectedHelp.example}
          isOpen
          title={selectedHelp.title}
          onClose={() => setHelpKey(null)}
        />
      ) : null}
    </section>
  );
}
