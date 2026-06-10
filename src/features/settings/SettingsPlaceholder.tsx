import { useState, type FormEvent } from "react";
import { useSpaData } from "../../shared/data/SpaDataContext";
import { formatCurrency } from "../../shared/utils/formatCurrency";
import { getTotalFixedExpenses } from "../../shared/utils/financials";

export function SettingsPlaceholder() {
  const { business, fixedExpenses, financialSettings, upsertFixedExpense, updateSalaryTarget } = useSpaData();
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [salaryTarget, setSalaryTarget] = useState(financialSettings.salaryTarget.toString());

  async function handleFixedExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await upsertFixedExpense({ name: expenseName.trim(), amount: Number(expenseAmount) });
    setExpenseName("");
    setExpenseAmount("");
  }

  async function handleSalary(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await updateSalaryTarget(Number(salaryTarget));
  }

  return (
    <section className="screen-stack" aria-labelledby="settings-title">
      <div className="hero-panel">
        <h2 id="settings-title">Configuración</h2>
        <p>{business.name} usa COP. Ajusta gastos fijos y cuánto quieres ganarte al mes.</p>
      </div>

      <article className="wide-card">
        <span>Total de gastos fijos</span>
        <strong>{formatCurrency(getTotalFixedExpenses(fixedExpenses))}</strong>
      </article>

      <form className="form-card" onSubmit={handleFixedExpense}>
        <h3>Gastos fijos mensuales</h3>
        <label>
          Nombre
          <input value={expenseName} onChange={(event) => setExpenseName(event.target.value)} required />
        </label>
        <label>
          Valor
          <input inputMode="numeric" min="1" type="number" value={expenseAmount} onChange={(event) => setExpenseAmount(event.target.value)} required />
        </label>
        <button className="primary-button" type="submit">Agregar gasto fijo</button>
      </form>

      <div className="list-stack">
        {fixedExpenses.map((expense) => (
          <article className="list-row" key={expense.id}>
            <div>
              <span>Mensual</span>
              <strong>{expense.name}</strong>
            </div>
            <b>{formatCurrency(expense.amount)}</b>
          </article>
        ))}
      </div>

      <form className="form-card" onSubmit={handleSalary}>
        <h3>Mi salario</h3>
        <label>
          ¿Cuánto quieres ganarte al mes?
          <input inputMode="numeric" min="0" type="number" value={salaryTarget} onChange={(event) => setSalaryTarget(event.target.value)} required />
        </label>
        <button className="primary-button" type="submit">Guardar salario</button>
      </form>
    </section>
  );
}
