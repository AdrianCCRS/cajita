import { useState, type FormEvent } from "react";
import { Button, Card, CardBody, Input, MetricCard, MoneyField, ScreenHero } from "../../shared/components/ui";
import { useSpaData } from "../../shared/data/SpaDataContext";
import { formatCurrency } from "../../shared/utils/formatCurrency";
import { getTotalFixedExpenses } from "../../shared/utils/financials";
import { fixedExpenseSchema, salarySchema } from "../../shared/validation/schemas";

export function SettingsPlaceholder() {
  const { business, fixedExpenses, financialSettings, upsertFixedExpense, updateSalaryTarget } = useSpaData();
  const [editingExpenseId, setEditingExpenseId] = useState<string | undefined>();
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [salaryTarget, setSalaryTarget] = useState(financialSettings.salaryTarget.toString());
  const [error, setError] = useState("");
  const [salaryMessage, setSalaryMessage] = useState("");

  async function handleFixedExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = fixedExpenseSchema.safeParse({ name: expenseName, amount: expenseAmount });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Revisa el gasto fijo.");
      return;
    }

    await upsertFixedExpense({ id: editingExpenseId, name: parsed.data.name, amount: parsed.data.amount });
    setEditingExpenseId(undefined);
    setExpenseName("");
    setExpenseAmount("");
    setError("");
  }

  async function handleSalary(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = salarySchema.safeParse({ salaryTarget });
    if (!parsed.success) {
      setSalaryMessage(parsed.error.issues[0]?.message ?? "Revisa tu salario objetivo.");
      return;
    }

    await updateSalaryTarget(parsed.data.salaryTarget);
    setSalaryMessage("Cambios guardados correctamente.");
  }

  function editExpense(id: string) {
    const expense = fixedExpenses.find((item) => item.id === id);
    if (!expense) {
      return;
    }

    setEditingExpenseId(expense.id);
    setExpenseName(expense.name);
    setExpenseAmount(String(expense.amount));
    setError("");
  }

  return (
    <section className="screen-stack" aria-labelledby="settings-title">
      <ScreenHero title="Configuración">{business.name} usa COP. Ajusta gastos fijos y cuánto quieres ganarte al mes.</ScreenHero>

      <div className="placeholder-grid">
        <MetricCard title="Total de gastos fijos" tone="expense" value={formatCurrency(getTotalFixedExpenses(fixedExpenses))} />
        <MetricCard title="Mi salario objetivo" tone="salary" value={formatCurrency(financialSettings.salaryTarget)} />
      </div>

      <Card className="ui-card form-card" shadow="none">
        <CardBody>
          <form className="form-stack" onSubmit={handleFixedExpense}>
            <h3>{editingExpenseId ? "Editar gasto fijo" : "Gastos fijos mensuales"}</h3>
            <Input
              autoComplete="off"
              className="form-control"
              isRequired
              label="Nombre"
              name="fixed-expense-name"
              radius="sm"
              value={expenseName}
              variant="bordered"
              onValueChange={setExpenseName}
            />
            <MoneyField isRequired label="Valor" min={0} value={expenseAmount} onValueChange={setExpenseAmount} />
            {error ? <p className="error-text">{error}</p> : null}
            <div className="button-row">
              <Button color="primary" radius="sm" type="submit">
                {editingExpenseId ? "Guardar gasto" : "Agregar gasto fijo"}
              </Button>
              {editingExpenseId ? (
                <Button
                  radius="sm"
                  variant="light"
                  onPress={() => {
                    setEditingExpenseId(undefined);
                    setExpenseName("");
                    setExpenseAmount("");
                    setError("");
                  }}
                >
                  Cancelar
                </Button>
              ) : null}
            </div>
          </form>
        </CardBody>
      </Card>

      <div className="list-stack">
        {fixedExpenses.map((expense) => (
          <Card className="ui-card list-row" key={expense.id} shadow="none">
            <CardBody>
              <div>
                <span>Mensual</span>
                <strong>{expense.name}</strong>
              </div>
              <div className="row-actions">
                <b>{formatCurrency(expense.amount)}</b>
                <Button radius="sm" size="sm" variant="bordered" onPress={() => editExpense(expense.id)}>
                  Editar
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card className="ui-card form-card" shadow="none">
        <CardBody>
          <form className="form-stack" onSubmit={handleSalary}>
            <h3>Mi salario</h3>
            <MoneyField isRequired label="¿Cuánto quieres ganarte al mes?" value={salaryTarget} onValueChange={setSalaryTarget} />
            {salaryMessage ? <p className={salaryMessage.includes("guardados") ? "success-text" : "error-text"}>{salaryMessage}</p> : null}
            <Button color="primary" radius="sm" type="submit">
              Guardar salario
            </Button>
          </form>
        </CardBody>
      </Card>
    </section>
  );
}
