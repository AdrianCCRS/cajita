import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Button, Card, HelpDrawer, ProgressBar, ScreenHero, Tabs } from "../../shared/components/ui";
import { useSpaData } from "../../shared/data/SpaDataContext";
import type { Transaction, TransactionType } from "../../shared/types/domain";
import {
  getDailyIncomeChartData,
  getExpensesByCategoryChartData,
  getHistoricalMonthlyMetricSparklineData,
  getMonthlyMetricSparklineData,
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
  getMonthlyPersonalVouchers,
  getMonthlyWithdrawals,
  getNetProfit,
  getOwnerTotalReceived,
  getOwnerSalaryPending,
  getSalaryUsagePercentage,
  groupPersonalVouchersByCategory,
} from "../../shared/utils/financials";
import { DailyIncomeTrendChart } from "./DailyIncomeTrendChart";
import { DashboardChartCard } from "./DashboardChartCard";
import { ExpensesByCategoryChart } from "./ExpensesByCategoryChart";
import { TopServicesChart } from "./TopServicesChart";
import { MetricSparklineCard } from "../../shared/components/charts";
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
  const monthlyPersonalVouchers = getMonthlyPersonalVouchers(transactions, year, month);
  const ownerTotalReceived = getOwnerTotalReceived(monthlyWithdrawals, monthlyPersonalVouchers);
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
  const historicalPersonalVouchers = getTotalByType(transactions, "personal_voucher");
  const historicalBusinessMoney = historicalIncome - historicalExpenses;
  const historicalProfit = historicalBusinessMoney - historicalWithdrawals - historicalPersonalVouchers;
  const estimatedProfit = getEstimatedProfit(monthlyIncome, monthlyExpenses);
  const netProfit = getNetProfit(monthlyIncome, monthlyExpenses, monthlyWithdrawals, monthlyPersonalVouchers);
  const salaryPending = getOwnerSalaryPending(financialSettings.salaryTarget, monthlyWithdrawals, monthlyPersonalVouchers);
  const breakEven = getBreakEvenPoint(fixedExpenses, transactions);
  const breakEvenProgress = breakEven ? getBreakEvenProgress(monthlyIncome, breakEven) : 0;
  const salaryProgress = getSalaryUsagePercentage(financialSettings.salaryTarget, ownerTotalReceived);
  const topPersonalVoucherCategory = groupPersonalVouchersByCategory(
    transactions.filter((transaction) => transaction.type === "personal_voucher" && isInCurrentMonth(transaction.date, year, month)),
  )[0];
  const weeklyChartData = getWeeklyIncomeExpenseChartData(transactions, year, month);
  const dailyIncomeData = getDailyIncomeChartData(transactions, year, month);
  const monthlyIncomeSparklineData = getMonthlyMetricSparklineData(transactions, year, month, "income");
  const monthlyExpensesSparklineData = getMonthlyMetricSparklineData(transactions, year, month, "expense");
  const monthlyBusinessSparklineData = getMonthlyMetricSparklineData(transactions, year, month, "business");
  const monthlyOwnerSparklineData = getMonthlyMetricSparklineData(transactions, year, month, "ownerTotal");
  const monthlyProfitSparklineData = getMonthlyMetricSparklineData(transactions, year, month, "profit");
  const historicalIncomeSparklineData = getHistoricalMonthlyMetricSparklineData(transactions, "income");
  const historicalExpensesSparklineData = getHistoricalMonthlyMetricSparklineData(transactions, "expense");
  const historicalBusinessSparklineData = getHistoricalMonthlyMetricSparklineData(transactions, "business");
  const historicalProfitSparklineData = getHistoricalMonthlyMetricSparklineData(transactions, "profit");
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
    monthlyPersonalVouchers,
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
        <Button onPress={() => openRegister("income")} className="btn-income">
          Registrar venta
        </Button>
        <Button variant="secondary" className="btn-expense" onPress={() => openRegister("expense")}>
          Registrar gasto
        </Button>
      </div>

      <Tabs
        ariaLabel="Rango del dashboard"
        items={dashboardTabs}
        value={activeTab}
        onChange={setActiveTab}
      />

      <div className="dashboard-tab-panel" role="tabpanel">
        {activeTab === "today" ? (
          <>
            <div className="dashboard-kpi-grid">
              <MetricSparklineCard
                currency
                data={monthlyIncomeSparklineData}
                emptyMessage="Hoy todavía no hay ventas registradas. ¡Empieza cuando quieras!"
                title="Ventas de hoy"
                type="income"
                value={todayIncome}
                valueLabel="Ventas"
              />
              <MetricSparklineCard
                currency
                data={monthlyExpensesSparklineData}
                emptyMessage="No has registrado gastos hoy."
                title="Gastos de hoy"
                type="expense"
                value={todayExpenses}
                valueLabel="Gastos"
              />
              <MetricSparklineCard
                currency
                data={monthlyBusinessSparklineData}
                title="Dinero de hoy"
                type="business"
                value={todayBusinessMoney}
                valueLabel="Dinero del negocio"
              />
            </div>
            <DailyIncomeTrendChart data={dailyIncomeData} />
          </>
        ) : null}

        {activeTab === "month" ? (
          <>
            <div className="dashboard-kpi-grid">
              <MetricSparklineCard
                currency
                data={monthlyIncomeSparklineData}
                emptyMessage="¡Bienvenida a un nuevo mes! Empieza registrando tu primera venta."
                title="Ventas del mes"
                type="income"
                value={monthlyIncome}
                valueLabel="Ventas"
              />
              <MetricSparklineCard
                currency
                data={monthlyExpensesSparklineData}
                emptyMessage="No has registrado gastos este mes. ¡Eso es buena señal!"
                title="Gastos del mes"
                type="expense"
                value={monthlyExpenses}
                valueLabel="Gastos"
              />
              <MetricSparklineCard
                currency
                data={monthlyOwnerSparklineData}
                title="Mi salario"
                type="withdrawal"
                value={ownerTotalReceived}
                valueLabel="Salario tomado"
              />
              <MetricSparklineCard
                currency
                data={monthlyProfitSparklineData}
                title="Ganancia"
                type="profit"
                value={netProfit}
                valueLabel="Después de salario"
              />
            </div>
            <DashboardChartCard
              data={weeklyChartData}
              onRegisterIncome={() => openRegister("income")}
            />
            <Card className="ui-card wide-card">
              <Card.Content>
                <div className="section-heading">
                  <div className="section-subheading">
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
                  <div className="section-subheading">
                    <span>Salario de la dueña</span>
                    <strong>
                      {formatCurrency(ownerTotalReceived)} de {formatCurrency(financialSettings.salaryTarget)}
                    </strong>
                  </div>
                  <b>{Math.round(salaryProgress)}%</b>
                </div>
                <ProgressBar aria-label="Avance de salario" color={salaryPending < 0 ? "warning" : "success"} value={Math.min(salaryProgress, 100)} />
                <div className="summary-metrics salary-metrics">
                  <div>
                    <span>Pagos que ya te hiciste</span>
                    <b>{formatCurrency(monthlyWithdrawals)}</b>
                  </div>
                  <div>
                    <span>Vales personales</span>
                    <b>{formatCurrency(monthlyPersonalVouchers)}</b>
                  </div>
                  <div>
                    <span>Total tomado del salario</span>
                    <b>{formatCurrency(ownerTotalReceived)}</b>
                  </div>
                  <div>
                    <span>{salaryPending < 0 ? "Excedente sobre tu salario" : "Pendiente por pagarte"}</span>
                    <b>{formatCurrency(Math.abs(salaryPending))}</b>
                  </div>
                </div>
                <p>
                  {salaryPending < 0
                    ? `Te pasaste de tu salario objetivo por ${formatCurrency(Math.abs(salaryPending))}.`
                    : `Te faltan ${formatCurrency(salaryPending)} para completar tu salario objetivo.`}
                </p>
                <div className="flex gap-2">
                  <Button className="btn-business" variant="secondary" onPress={() => openRegister("withdrawal")}>
                    Registrar pago
                  </Button>
                  <Button className="btn-business" variant="secondary" onPress={() => openRegister("personal_voucher")}>
                    Registrar vale
                  </Button>
                </div>
              </Card.Content>
            </Card>
            <Card className="ui-card wide-card">
              <Card.Content>
                <div className="section-heading">
                  <div className="section-subheading">
                    <span>Vales personales</span>
                    <strong>{formatCurrency(monthlyPersonalVouchers)}</strong>
                  </div>
                </div>
                <p>
                  Este mes llevas {formatCurrency(monthlyPersonalVouchers)} en vales personales.
                  {financialSettings.salaryTarget
                    ? ` Eso equivale al ${Math.round(getSalaryUsagePercentage(financialSettings.salaryTarget, monthlyPersonalVouchers))}% de tu salario objetivo.`
                    : ""}
                </p>
                <p>
                  {topPersonalVoucherCategory
                    ? `Categoría con más vales: ${topPersonalVoucherCategory.personalCategoryName}.`
                    : "Registra un vale para ver tus gastos personales por categoría."}
                </p>
              </Card.Content>
            </Card>
            <ExpensesByCategoryChart data={categoryExpenseData} />
          </>
        ) : null}

        {activeTab === "history" ? (
          <>
            <div className="dashboard-kpi-grid">
              <MetricSparklineCard
                currency
                data={historicalIncomeSparklineData}
                title="Ventas históricas"
                type="income"
                value={historicalIncome}
                valueLabel="Ventas"
              />
              <MetricSparklineCard
                currency
                data={historicalExpensesSparklineData}
                title="Gastos históricos"
                type="expense"
                value={historicalExpenses}
                valueLabel="Gastos"
              />
              <MetricSparklineCard
                currency
                data={historicalBusinessSparklineData}
                title="Dinero del negocio"
                type="business"
                value={historicalBusinessMoney}
                valueLabel="Negocio"
              />
              <MetricSparklineCard
                currency
                data={historicalProfitSparklineData}
                title="Ganancia histórica"
                type="profit"
                value={historicalProfit}
                valueLabel="Después de salario"
              />
            </div>
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
  monthlyPersonalVouchers,
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
  monthlyPersonalVouchers: number;
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
        { label: "Salario", value: formatCurrency(monthlyWithdrawals + monthlyPersonalVouchers) },
        { label: "Negocio", value: formatCurrency(estimatedProfit) },
    ],
  };
}

function getTotalByType(transactions: Transaction[], type: TransactionType) {
  return transactions
    .filter((transaction) => transaction.type === type)
    .reduce((total, transaction) => total + transaction.amount, 0);
}

function isInCurrentMonth(date: string, year: number, month: number) {
  const parsed = new Date(date);
  return parsed.getFullYear() === year && parsed.getMonth() + 1 === month;
}
