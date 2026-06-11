import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Button, Card, HelpDrawer, MetricCard, ProgressBar, ScreenHero, Tabs } from "../../shared/components/ui";
import { useSpaData } from "../../shared/data/SpaDataContext";
import type { Transaction, TransactionType } from "../../shared/types/domain";
import {
  getDailyIncomeChartData,
  getExpensesByCategoryChartData,
  getServicesByCountChartData,
  getServicesByRevenueChartData,
  getWeeklyIncomeExpenseChartData,
} from "../../shared/utils/dashboardCharts";
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
} from "../../shared/utils/financials";
import { DailyIncomeTrendChart } from "./DailyIncomeTrendChart";
import { DashboardChartCard } from "./DashboardChartCard";
import { ExpensesByCategoryChart } from "./ExpensesByCategoryChart";
import { TopServicesChart } from "./TopServicesChart";

type DashboardHelpKey = "income" | "expense" | "business" | "salary" | "profit" | "breakEven";
type DashboardTab = "today" | "month" | "history";

const dashboardTabs: Array<{ id: DashboardTab; label: string; description: string }> = [
  { id: "today", label: "Hoy", description: "Día" },
  { id: "month", label: "Mes", description: "Actual" },
  { id: "history", label: "Histórico", description: "Todo" },
];

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
  const [activeTab, setActiveTab] = useState<DashboardTab>("month");
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
  const todayBusinessMoney = todayIncome - todayExpenses;
  const historicalIncome = getTotalByType(transactions, "income");
  const historicalExpenses = getTotalByType(transactions, "expense");
  const historicalWithdrawals = getTotalByType(transactions, "withdrawal");
  const historicalBusinessMoney = historicalIncome - historicalExpenses;
  const historicalProfit = historicalBusinessMoney - historicalWithdrawals;
  const estimatedProfit = getEstimatedProfit(monthlyIncome, monthlyExpenses);
  const netProfit = getNetProfit(monthlyIncome, monthlyExpenses, monthlyWithdrawals);
  const salaryPending = getOwnerSalaryPending(financialSettings.salaryTarget, monthlyWithdrawals);
  const breakEven = getBreakEvenPoint(fixedExpenses, transactions);
  const breakEvenProgress = breakEven ? getBreakEvenProgress(monthlyIncome, breakEven) : 0;
  const salaryProgress = financialSettings.salaryTarget ? (monthlyWithdrawals / financialSettings.salaryTarget) * 100 : 0;
  const weeklyChartData = getWeeklyIncomeExpenseChartData(transactions, year, month);
  const dailyIncomeData = getDailyIncomeChartData(transactions, year, month);
  const categoryExpenseData = getExpensesByCategoryChartData(transactions, year, month);
  const historicalCategoryExpenseData = getExpensesByCategoryChartData(transactions);
  const servicesByCountData = getServicesByCountChartData(transactions);
  const servicesByRevenueData = getServicesByRevenueChartData(transactions);
  const selectedHelp = helpKey ? helpContent[helpKey] : null;
  const summary = getDashboardSummary({
    activeTab,
    estimatedProfit,
    historicalBusinessMoney,
    historicalExpenses,
    historicalIncome,
    historicalProfit,
    monthlyExpenses,
    monthlyIncome,
    monthlyWithdrawals,
    netProfit,
    todayBusinessMoney,
    todayExpenses,
    todayIncome,
  });

  return (
    <section className="screen-stack" aria-labelledby="dashboard-title">
      <ScreenHero title="Cómo vas este mes">
        Ventas, gastos, salario y lo que queda para reinvertir, sin mezclar cuentas.
      </ScreenHero>

      <div className="quick-strip">
        <Button onPress={() => openRegister("income")}>
          Registrar venta
        </Button>
        <Button variant="secondary" className="btn-expense" onPress={() => openRegister("expense")}>
          Registrar gasto
        </Button>
      </div>

      <DashboardSummaryCard
        description={summary.description}
        metrics={summary.metrics}
        title={summary.title}
        value={summary.value}
      />

      <Tabs
        ariaLabel="Rango del dashboard"
        items={dashboardTabs}
        value={activeTab}
        onChange={setActiveTab}
      />

      <div className="dashboard-tab-panel" role="tabpanel">
        {activeTab === "today" ? (
          <>
            <div className="placeholder-grid compact-grid">
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
                description="Ventas menos gastos del día."
                title="Dinero de hoy"
                tone="business"
                value={formatCurrency(todayBusinessMoney)}
                onHelp={() => setHelpKey("business")}
              />
            </div>
            <DailyIncomeTrendChart data={dailyIncomeData} />
          </>
        ) : null}

        {activeTab === "month" ? (
          <>
            <DashboardChartCard
              data={weeklyChartData}
              onRegisterIncome={() => openRegister("income")}
            />
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
                    <ProgressBar aria-label="Avance de meta mínima" className={breakEvenProgress >= 100 ? "" : "progress--expense"} color={breakEvenProgress >= 100 ? "success" : "warning"} value={Math.min(breakEvenProgress, 100)} />
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
            <ExpensesByCategoryChart data={categoryExpenseData} />
          </>
        ) : null}

        {activeTab === "history" ? (
          <>
            <ExpensesByCategoryChart data={historicalCategoryExpenseData} />
            <TopServicesChart data={servicesByCountData} metric="count" />
            <TopServicesChart data={servicesByRevenueData} metric="revenue" />
          </>
        ) : null}
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

function DashboardSummaryCard({
  description,
  metrics,
  title,
  value,
}: {
  description: string;
  metrics: Array<{ label: string; value: string }>;
  title: string;
  value: string;
}) {
  return (
    <Card className="ui-card dashboard-summary">
      <Card.Content>
        <div>
          <span>{title}</span>
          <strong>{value}</strong>
          <p>{description}</p>
        </div>
        <div className="summary-metrics">
          {metrics.map((metric) => (
            <div key={metric.label}>
              <span>{metric.label}</span>
              <b>{metric.value}</b>
            </div>
          ))}
        </div>
      </Card.Content>
    </Card>
  );
}

function getDashboardSummary({
  activeTab,
  estimatedProfit,
  historicalBusinessMoney,
  historicalExpenses,
  historicalIncome,
  historicalProfit,
  monthlyExpenses,
  monthlyIncome,
  monthlyWithdrawals,
  netProfit,
  todayBusinessMoney,
  todayExpenses,
  todayIncome,
}: {
  activeTab: DashboardTab;
  estimatedProfit: number;
  historicalBusinessMoney: number;
  historicalExpenses: number;
  historicalIncome: number;
  historicalProfit: number;
  monthlyExpenses: number;
  monthlyIncome: number;
  monthlyWithdrawals: number;
  netProfit: number;
  todayBusinessMoney: number;
  todayExpenses: number;
  todayIncome: number;
}) {
  if (activeTab === "today") {
    return {
      title: "Resumen de hoy",
      value: formatCurrency(todayBusinessMoney),
      description: "Ventas menos gastos registrados hoy.",
      metrics: [
        { label: "Ventas", value: formatCurrency(todayIncome) },
        { label: "Gastos", value: formatCurrency(todayExpenses) },
      ],
    };
  }

  if (activeTab === "history") {
    return {
      title: "Desde el primer registro",
      value: formatCurrency(historicalProfit),
      description: "Lo que queda después de gastos y salario registrado.",
      metrics: [
        { label: "Ventas", value: formatCurrency(historicalIncome) },
        { label: "Gastos", value: formatCurrency(historicalExpenses) },
        { label: "Negocio", value: formatCurrency(historicalBusinessMoney) },
      ],
    };
  }

  return {
    title: "Resumen del mes",
    value: formatCurrency(netProfit),
    description: "Lo que quedó después de gastos y salario.",
    metrics: [
      { label: "Ventas", value: formatCurrency(monthlyIncome) },
      { label: "Gastos", value: formatCurrency(monthlyExpenses) },
      { label: "Salario", value: formatCurrency(monthlyWithdrawals) },
      { label: "Negocio", value: formatCurrency(estimatedProfit) },
    ],
  };
}

function getTotalByType(transactions: Transaction[], type: TransactionType) {
  return transactions
    .filter((transaction) => transaction.type === type)
    .reduce((total, transaction) => total + transaction.amount, 0);
}
