import { Pencil, Plus, ReceiptText, Settings, Wallet } from "lucide-react";
import { useState, type FormEvent } from "react";
import { BottomSheet, Button, Card, EmptyState, Input, Label, MoneyField, ScreenHero, TextField } from "../../shared/components/ui";
import { useSpaData } from "../../shared/data/SpaDataContext";
import type { FixedExpense } from "../../shared/types/domain";
import { formatCurrency } from "../../shared/utils/formatCurrency";
import { getTotalFixedExpenses } from "../../shared/utils/financials";
import { fixedExpenseSchema, salarySchema } from "../../shared/validation/schemas";

type FixedExpenseSheetMode = "create" | "edit";

export function SettingsPlaceholder() {
  const { business, fixedExpenses, financialSettings, upsertFixedExpense, updateSalaryTarget } = useSpaData();
  const [expenseSheetMode, setExpenseSheetMode] = useState<FixedExpenseSheetMode>("create");
  const [isExpenseSheetOpen, setIsExpenseSheetOpen] = useState(false);
  const [isSalarySheetOpen, setIsSalarySheetOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | undefined>();
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState<number | undefined>();
  const [salaryTarget, setSalaryTarget] = useState<number | undefined>(financialSettings.salaryTarget);
  const [error, setError] = useState("");
  const [salaryError, setSalaryError] = useState("");
  const activeFixedExpenses = fixedExpenses.filter((expense) => expense.isActive);
  const totalFixedExpenses = getTotalFixedExpenses(fixedExpenses);

  async function handleFixedExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = fixedExpenseSchema.safeParse({ name: expenseName, amount: expenseAmount });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Revisa el gasto fijo.");
      return;
    }

    await upsertFixedExpense({ id: editingExpenseId, name: parsed.data.name, amount: parsed.data.amount });
    resetExpenseForm();
  }

  async function handleSalary(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = salarySchema.safeParse({ salaryTarget });
    if (!parsed.success) {
      setSalaryError(parsed.error.issues[0]?.message ?? "Revisa tu salario objetivo.");
      return;
    }

    await updateSalaryTarget(parsed.data.salaryTarget);
    setSalaryError("");
    setIsSalarySheetOpen(false);
  }

  function openCreateExpenseSheet() {
    setExpenseSheetMode("create");
    setEditingExpenseId(undefined);
    setExpenseName("");
    setExpenseAmount(undefined);
    setError("");
    setIsExpenseSheetOpen(true);
  }

  function openEditExpenseSheet(expense: FixedExpense) {
    setExpenseSheetMode("edit");
    setEditingExpenseId(expense.id);
    setExpenseName(expense.name);
    setExpenseAmount(expense.amount);
    setError("");
    setIsExpenseSheetOpen(true);
  }

  function openSalarySheet() {
    setSalaryTarget(financialSettings.salaryTarget);
    setSalaryError("");
    setIsSalarySheetOpen(true);
  }

  function resetExpenseForm() {
    setEditingExpenseId(undefined);
    setExpenseName("");
    setExpenseAmount(undefined);
    setError("");
    setIsExpenseSheetOpen(false);
  }

  return (
    <section className="screen-stack" aria-labelledby="settings-title">
      <ScreenHero title="Configuración">{business.name} usa COP. Ajusta gastos fijos y cuánto quieres ganarte al mes.</ScreenHero>

      <Card className="ui-card settings-overview">
        <Card.Content>
          <div className="settings-overview__copy">
            <Settings aria-hidden="true" size={22} />
            <div>
              <span>Ajustes principales</span>
              <strong>{business.currency}</strong>
            </div>
          </div>
          <div className="settings-overview__metrics">
            <div>
              <ReceiptText aria-hidden="true" size={18} />
              <div>
                <span>Gastos fijos</span>
                <strong>{formatCurrency(totalFixedExpenses)}</strong>
                <small>{activeFixedExpenses.length} activos de {fixedExpenses.length}</small>
              </div>
            </div>
            <div>
              <Wallet aria-hidden="true" size={18} />
              <div>
                <span>Mi salario</span>
                <strong>{formatCurrency(financialSettings.salaryTarget)}</strong>
                <small>Objetivo mensual</small>
              </div>
            </div>
          </div>
          <div className="settings-overview__actions">
            <Button onPress={openCreateExpenseSheet}>
              <Plus aria-hidden="true" size={18} />
              Gasto fijo
            </Button>
            <Button variant="outline" onPress={openSalarySheet}>
              <Pencil aria-hidden="true" size={16} />
              Salario
            </Button>
          </div>
        </Card.Content>
      </Card>

      {fixedExpenses.length ? (
        <Card className="ui-card service-table-card">
          <Card.Content>
            <div className="service-table-scroll">
              <table className="service-table settings-table">
                <caption>Gastos fijos configurados</caption>
                <thead>
                  <tr>
                    <th scope="col">Gasto</th>
                    <th scope="col">Valor</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {fixedExpenses.map((expense) => (
                    <tr className={expense.isActive ? "" : "muted"} key={expense.id}>
                      <th scope="row">
                        <span>{expense.name}</span>
                        <small>Mensual</small>
                      </th>
                      <td>
                        <b>{formatCurrency(expense.amount)}</b>
                      </td>
                      <td>
                        <span className={`status-pill ${expense.isActive ? "status-pill--active" : "status-pill--inactive"}`}>
                          {expense.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <Button isIconOnly aria-label={`Editar ${expense.name}`} size="sm" variant="outline" onPress={() => openEditExpenseSheet(expense)}>
                            <Pencil aria-hidden="true" size={16} />
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
        <EmptyState
          actionLabel="Agregar gasto fijo"
          message="Configura tus gastos fijos para ver cuánto necesitas vender cada mes."
          title="Aún no hay gastos fijos configurados."
          onAction={openCreateExpenseSheet}
        />
      )}

      {isExpenseSheetOpen ? (
        <BottomSheet
          isOpen
          eyebrow="Gastos fijos"
          title={expenseSheetMode === "edit" ? "Editar gasto fijo" : "Nuevo gasto fijo"}
          onClose={resetExpenseForm}
        >
          <form className="form-stack" onSubmit={handleFixedExpense}>
            <TextField className="form-control" isRequired name="fixed-expense-name">
              <Label>Nombre</Label>
              <Input
                autoComplete="off"
                value={expenseName}
                variant="secondary"
                onChange={(e) => setExpenseName(e.target.value)}
              />
            </TextField>
            <MoneyField isRequired label="Valor" minValue={1} value={expenseAmount} onChange={setExpenseAmount} />
            {error ? <p className="error-text">{error}</p> : null}
            <div className="button-row">
              <Button type="submit">
                {expenseSheetMode === "edit" ? "Guardar gasto" : "Agregar gasto fijo"}
              </Button>
              <Button variant="ghost" onPress={resetExpenseForm}>
                Cancelar
              </Button>
            </div>
          </form>
        </BottomSheet>
      ) : null}

      {isSalarySheetOpen ? (
        <BottomSheet
          isOpen
          eyebrow="Mi salario"
          title="Objetivo mensual"
          onClose={() => setIsSalarySheetOpen(false)}
        >
          <form className="form-stack" onSubmit={handleSalary}>
            <MoneyField isRequired label="¿Cuánto quieres ganarte al mes?" value={salaryTarget} onChange={setSalaryTarget} />
            {salaryError ? <p className="error-text">{salaryError}</p> : null}
            <div className="button-row">
              <Button type="submit">
                Guardar salario
              </Button>
              <Button variant="ghost" onPress={() => setIsSalarySheetOpen(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </BottomSheet>
      ) : null}
    </section>
  );
}
