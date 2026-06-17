import { CalendarDays, Pencil, Plus, ReceiptText, Settings, Wallet } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { BottomSheet, Button, Card, EmptyState, Input, Label, MoneyField, ScreenHero, TextField } from "../../shared/components/ui";
import { TablePagination } from "../../shared/components/TablePagination";
import { useSpaData } from "../../shared/data/SpaDataContext";
import { useTableSortPagination } from "../../shared/hooks/useTableSortPagination";
import type { FixedExpense, RegisterPrefill, TransactionType } from "../../shared/types/domain";
import { formatCurrency } from "../../shared/utils/formatCurrency";
import { getMonthlyFixedExpensePayments, getPendingFixedExpensesForMonth, getTotalFixedExpenses } from "../../shared/utils/financials";
import { fixedExpenseSchema, salarySchema } from "../../shared/validation/schemas";
import { AppThemeSettingsCard } from "./AppThemeSettingsCard";

type FixedExpenseSheetMode = "create" | "edit";
type FixedExpenseSortColumn = "name" | "amount" | "dueDay" | "category" | "status";

export function SettingsPlaceholder() {
  const outletContext = useOutletContext<{ openRegister: (type: TransactionType, prefill?: RegisterPrefill) => void } | null>();
  const openRegister = outletContext?.openRegister ?? (() => undefined);
  const { business, categories, fixedExpenses, financialSettings, transactions, upsertFixedExpense, updateSalaryTarget } = useSpaData();
  const [expenseSheetMode, setExpenseSheetMode] = useState<FixedExpenseSheetMode>("create");
  const [isExpenseSheetOpen, setIsExpenseSheetOpen] = useState(false);
  const [isSalarySheetOpen, setIsSalarySheetOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | undefined>();
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState<number | undefined>();
  const [expenseCategoryId, setExpenseCategoryId] = useState("");
  const [expenseDueDay, setExpenseDueDay] = useState<number | undefined>(1);
  const [salaryTarget, setSalaryTarget] = useState<number | undefined>(financialSettings.salaryTarget);
  const [error, setError] = useState("");
  const [salaryError, setSalaryError] = useState("");
  const activeFixedExpenses = fixedExpenses.filter((expense) => expense.isActive);
  const activeCategories = categories.filter((category) => category.isActive);
  const totalFixedExpenses = getTotalFixedExpenses(fixedExpenses);
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const fixedPaymentsThisMonth = getMonthlyFixedExpensePayments(transactions, year, month);
  const pendingFixedExpenses = getPendingFixedExpensesForMonth(fixedExpenses, transactions, year, month);

  const fixedExpenseSortFns: Record<FixedExpenseSortColumn, (a: FixedExpense, b: FixedExpense) => number> = {
    name: (a, b) => a.name.localeCompare(b.name, "es-CO"),
    amount: (a, b) => a.amount - b.amount,
    dueDay: (a, b) => (a.dueDay ?? 1) - (b.dueDay ?? 1),
    category: (a, b) => (a.categoryName ?? "").localeCompare(b.categoryName ?? "", "es-CO"),
    status: (a, b) => Number(a.isActive) - Number(b.isActive),
  };

  const fixedExpensesTable = useTableSortPagination({
    data: fixedExpenses,
    defaultSort: { column: "name", direction: "asc" },
    defaultPageSize: 10,
    sortFns: fixedExpenseSortFns,
  });

  async function handleFixedExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = fixedExpenseSchema.safeParse({ name: expenseName, amount: expenseAmount, categoryId: expenseCategoryId, dueDay: expenseDueDay });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Revisa el gasto fijo.");
      return;
    }

    const selectedCategory = activeCategories.find((category) => category.id === parsed.data.categoryId);
    await upsertFixedExpense({
      id: editingExpenseId,
      name: parsed.data.name,
      amount: parsed.data.amount,
      categoryId: selectedCategory?.id ?? null,
      categoryName: selectedCategory?.name ?? null,
      dueDay: parsed.data.dueDay ?? 1,
    });
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
    setExpenseCategoryId(activeCategories[0]?.id ?? "");
    setExpenseDueDay(1);
    setError("");
    setIsExpenseSheetOpen(true);
  }

  function openEditExpenseSheet(expense: FixedExpense) {
    setExpenseSheetMode("edit");
    setEditingExpenseId(expense.id);
    setExpenseName(expense.name);
    setExpenseAmount(expense.amount);
    setExpenseCategoryId(expense.categoryId ?? activeCategories[0]?.id ?? "");
    setExpenseDueDay(expense.dueDay ?? 1);
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
    setExpenseCategoryId("");
    setExpenseDueDay(1);
    setError("");
    setIsExpenseSheetOpen(false);
  }

  function registerFixedExpensePayment(expense: FixedExpense) {
    const fallbackCategory = activeCategories[0];
    const categoryId = expense.categoryId ?? fallbackCategory?.id;

    if (!categoryId) {
      setError("Crea una categoría de gasto antes de registrar este pago fijo.");
      return;
    }

    openRegister("expense", {
      expense: {
        amount: expense.amount,
        categoryId,
        expenseType: "fixed",
        fixedExpenseId: expense.id,
        fixedExpenseName: expense.name,
        notes: `Pago fijo: ${expense.name}`,
      },
    });
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
                <small>{formatCurrency(pendingFixedExpenses)} pendiente por registrar</small>
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

      <AppThemeSettingsCard />

      <Card className="ui-card wide-card">
        <Card.Content>
          <div className="section-heading">
            <div className="section-subheading">
              <span>Compromisos fijos del mes</span>
              <strong>{formatCurrency(totalFixedExpenses)}</strong>
            </div>
          </div>
          <div className="summary-metrics">
            <div>
              <span>Pagos fijos registrados</span>
              <b>{formatCurrency(fixedPaymentsThisMonth)}</b>
            </div>
            <div>
              <span>Falta registrar</span>
              <b>{formatCurrency(pendingFixedExpenses)}</b>
            </div>
          </div>
          <p className="hint-text">
            Estos compromisos ayudan a calcular la meta mínima. Solo afectan los gastos reales cuando registras el pago.
          </p>
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
                    <th aria-sort={fixedExpensesTable.sort.column === "name" ? (fixedExpensesTable.sort.direction === "asc" ? "ascending" : "descending") : "none"} scope="col" onClick={() => fixedExpensesTable.toggleSort("name")}>
                      Gasto <span className="sort-indicator">{fixedExpensesTable.sort.column === "name" ? (fixedExpensesTable.sort.direction === "asc" ? "▲" : "▼") : "▸"}</span>
                    </th>
                    <th aria-sort={fixedExpensesTable.sort.column === "amount" ? (fixedExpensesTable.sort.direction === "asc" ? "ascending" : "descending") : "none"} scope="col" onClick={() => fixedExpensesTable.toggleSort("amount")}>
                      Valor <span className="sort-indicator">{fixedExpensesTable.sort.column === "amount" ? (fixedExpensesTable.sort.direction === "asc" ? "▲" : "▼") : "▸"}</span>
                    </th>
                    <th aria-sort={fixedExpensesTable.sort.column === "dueDay" ? (fixedExpensesTable.sort.direction === "asc" ? "ascending" : "descending") : "none"} scope="col" onClick={() => fixedExpensesTable.toggleSort("dueDay")}>
                      Día <span className="sort-indicator">{fixedExpensesTable.sort.column === "dueDay" ? (fixedExpensesTable.sort.direction === "asc" ? "▲" : "▼") : "▸"}</span>
                    </th>
                    <th aria-sort={fixedExpensesTable.sort.column === "category" ? (fixedExpensesTable.sort.direction === "asc" ? "ascending" : "descending") : "none"} scope="col" onClick={() => fixedExpensesTable.toggleSort("category")}>
                      Categoría <span className="sort-indicator">{fixedExpensesTable.sort.column === "category" ? (fixedExpensesTable.sort.direction === "asc" ? "▲" : "▼") : "▸"}</span>
                    </th>
                    <th aria-sort={fixedExpensesTable.sort.column === "status" ? (fixedExpensesTable.sort.direction === "asc" ? "ascending" : "descending") : "none"} scope="col" onClick={() => fixedExpensesTable.toggleSort("status")}>
                      Estado <span className="sort-indicator">{fixedExpensesTable.sort.column === "status" ? (fixedExpensesTable.sort.direction === "asc" ? "▲" : "▼") : "▸"}</span>
                    </th>
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {fixedExpensesTable.paginatedData.map((expense) => (
                    <tr className={expense.isActive ? "" : "muted"} key={expense.id}>
                      <th scope="row">
                        <span>{expense.name}</span>
                        <small>Mensual</small>
                      </th>
                      <td>
                        <b>{formatCurrency(expense.amount)}</b>
                      </td>
                      <td>
                        <span className="status-pill status-pill--active">Día {expense.dueDay ?? 1}</span>
                      </td>
                      <td>
                        <span>{expense.categoryName ?? "Sin categoría"}</span>
                      </td>
                      <td>
                        <span className={`status-pill ${expense.isActive ? "status-pill--active" : "status-pill--inactive"}`}>
                          {expense.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <Button isIconOnly aria-label={`Registrar pago de ${expense.name}`} size="sm" variant="secondary" onPress={() => registerFixedExpensePayment(expense)}>
                            <CalendarDays aria-hidden="true" size={16} />
                          </Button>
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
            <TablePagination
              pagination={fixedExpensesTable.pagination}
              onPageChange={fixedExpensesTable.setCurrentPage}
              onPageSizeChange={fixedExpensesTable.changePageSize}
            />
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
            <TextField className="form-control" isRequired name="fixed-expense-day">
              <Label>Día estimado de pago</Label>
              <Input
                inputMode="numeric"
                min={1}
                max={31}
                type="number"
                value={String(expenseDueDay ?? "")}
                variant="secondary"
                onChange={(event) => setExpenseDueDay(event.target.value ? Number(event.target.value) : undefined)}
              />
            </TextField>
            <label className="form-control">
              <span>Categoría</span>
              <select
                className="native-date"
                value={expenseCategoryId}
                onChange={(event) => setExpenseCategoryId(event.target.value)}
              >
                <option value="">Sin categoría</option>
                {activeCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
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
