import { Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { BottomSheet, Button, Card, ConfirmDialog, EmptyState, Input, Label, ScreenHero, TextField } from "../../shared/components/ui";
import { useSpaData } from "../../shared/data/SpaDataContext";
import type { Transaction, TransactionType } from "../../shared/types/domain";
import { formatDateShort, formatInputDate, isInMonth, isToday, toDate } from "../../shared/utils/dates";
import { formatCurrency } from "../../shared/utils/formatCurrency";

const filters: Array<{ id: TransactionType | "all"; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "income", label: "Ventas" },
  { id: "expense", label: "Gastos" },
  { id: "withdrawal", label: "Pagarme" },
];

type DateFilter = "today" | "month" | "lastMonth" | "all";
type SortMode = "recent" | "highest" | "lowest";

const dateFilters: Array<{ id: DateFilter; label: string }> = [
  { id: "today", label: "Hoy" },
  { id: "month", label: "Mes" },
  { id: "lastMonth", label: "Mes pasado" },
  { id: "all", label: "Todo" },
];

const sortModes: Array<{ id: SortMode; label: string }> = [
  { id: "recent", label: "Más recientes" },
  { id: "highest", label: "Mayor valor" },
  { id: "lowest", label: "Menor valor" },
];

export function HistoryPlaceholder() {
  const { openRegister, showToast } = useOutletContext<{
    openRegister: (type: TransactionType) => void;
    showToast: (toast: { kind?: "success" | "warning" | "error"; message: string; actionLabel?: string; onAction?: () => void }) => void;
  }>();
  const { transactions, deleteTransaction, restoreTransaction } = useSpaData();
  const [filter, setFilter] = useState<TransactionType | "all">("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("month");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [search, setSearch] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);
  const groupedTransactions = useMemo(
    () => groupTransactions(
      transactions
        .filter((transaction) => filter === "all" || transaction.type === filter)
        .filter((transaction) => matchesDateFilter(transaction, dateFilter))
        .filter((transaction) => matchesSearch(transaction, search))
        .sort((a, b) => sortTransactions(a, b, sortMode)),
    ),
    [dateFilter, filter, search, sortMode, transactions],
  );
  const visibleCount = groupedTransactions.reduce((total, group) => total + group.transactions.length, 0);

  async function confirmDelete() {
    if (!pendingDelete) {
      return;
    }

    const deleted = pendingDelete;
    setPendingDelete(null);
    setSelectedTransaction(null);
    await deleteTransaction(deleted.id);
    showToast({
      kind: "success",
      message: "Movimiento eliminado. ¿Fue un error? Puedes volver a registrarlo.",
      actionLabel: "Deshacer",
      onAction: () => void restoreTransaction(deleted),
    });
  }

  return (
    <section className="screen-stack" aria-labelledby="history-title">
      <ScreenHero title="Historial">Movimientos ordenados del más reciente al más antiguo.</ScreenHero>

      <Card className="ui-card history-controls">
        <Card.Content>
          <TextField className="form-control" name="history-search">
            <Label>Buscar movimiento</Label>
            <div className="search-field">
              <Search aria-hidden="true" size={18} />
              <Input
                autoComplete="off"
                placeholder="Servicio, categoría, nota o valor"
                value={search}
                variant="secondary"
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </TextField>

          <FilterGroup
            ariaLabel="Filtrar por fecha"
            items={dateFilters}
            selectedId={dateFilter}
            onSelect={(value) => setDateFilter(value as DateFilter)}
          />

          <FilterGroup
            ariaLabel="Filtrar movimientos"
            items={filters}
            selectedId={filter}
            onSelect={(value) => setFilter(value as TransactionType | "all")}
          />

          <FilterGroup
            ariaLabel="Ordenar movimientos"
            items={sortModes}
            selectedId={sortMode}
            onSelect={(value) => setSortMode(value as SortMode)}
          />
        </Card.Content>
      </Card>

      {visibleCount ? (
        <div className="history-groups">
          {groupedTransactions.map((group) => (
            <section className="history-day" key={group.dateKey} aria-labelledby={`history-${group.dateKey}`}>
              <div className="history-day__header">
                <div>
                  <span>{group.transactions.length} movimientos</span>
                  <h2 id={`history-${group.dateKey}`}>{group.title}</h2>
                </div>
                <div className="history-day__totals" aria-label={`Resumen de ${group.title}`}>
                  <span>Ventas {formatCurrency(group.income)}</span>
                  <span>Gastos {formatCurrency(group.expenses)}</span>
                </div>
              </div>

              <div className="list-stack history-list">
                {group.transactions.map((transaction) => {
                  const saleProfit = getSaleProfit(transaction);

                  return (
                    <Card className={`ui-card list-row movement-row row--${transaction.type}`} key={transaction.id} onClick={() => setSelectedTransaction(transaction)} role="button" tabIndex={0}>
                      <Card.Content>
                        <div>
                          <span>{getTransactionLabel(transaction.type)} · {getPaymentLabel(transaction.paymentMethod)}</span>
                          <strong>{getTransactionTitle(transaction)}</strong>
                          <p>{transaction.notes || getTransactionDetail(transaction)}</p>
                        </div>
                        <div className="row-actions">
                          <b>{formatCurrency(transaction.amount)}</b>
                          {saleProfit !== null ? (
                            <span className="movement-profit">Ganancia {formatCurrency(saleProfit)}</span>
                          ) : null}
                        </div>
                      </Card.Content>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <HistoryEmptyState
          dateFilter={dateFilter}
          filter={filter}
          hasAnyTransactions={transactions.length > 0}
          search={search}
          onRegister={() => openRegister("income")}
          onClear={() => { setSearch(""); setFilter("all"); setDateFilter("all"); }}
        />
      )}

      {selectedTransaction ? (
        <BottomSheet isOpen title="Detalle del movimiento" eyebrow={getTransactionLabel(selectedTransaction.type)} onClose={() => setSelectedTransaction(null)}>
          <div className="detail-list">
            <DetailItem label="Valor" value={formatCurrency(selectedTransaction.amount)} />
            <DetailItem label="Fecha" value={formatDateShort(selectedTransaction.date)} />
            <DetailItem label="Método" value={getPaymentLabel(selectedTransaction.paymentMethod)} />
            {selectedTransaction.serviceName ? <DetailItem label="Servicio" value={selectedTransaction.serviceName} /> : null}
            {selectedTransaction.categoryName ? <DetailItem label="Categoría" value={selectedTransaction.categoryName} /> : null}
            {selectedTransaction.notes ? <DetailItem label="Nota" value={selectedTransaction.notes} /> : null}
            <Button variant="danger" onPress={() => setPendingDelete(selectedTransaction)}>
              <Trash2 aria-hidden="true" size={18} />
              Eliminar movimiento
            </Button>
          </div>
        </BottomSheet>
      ) : null}

      {pendingDelete ? (
        <ConfirmDialog
          isOpen
          message={`¿Segura que quieres eliminar este movimiento de ${formatCurrency(pendingDelete.amount)}?`}
          title="Eliminar movimiento"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => void confirmDelete()}
        />
      ) : null}
    </section>
  );
}

function FilterGroup({
  ariaLabel,
  items,
  selectedId,
  onSelect,
}: {
  ariaLabel: string;
  items: Array<{ id: string; label: string }>;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="chip-list history-filter" aria-label={ariaLabel}>
      {items.map((item) => (
        <Button
          key={item.id}
          className={selectedId === item.id && item.id === "expense" ? "segmented--expense" : selectedId === item.id && item.id === "withdrawal" ? "segmented--withdrawal" : ""}
          size="sm"
          variant={selectedId === item.id ? "primary" : "tertiary"}
          onPress={() => onSelect(item.id)}
        >
          {item.label}
        </Button>
      ))}
    </div>
  );
}

function HistoryEmptyState({
  dateFilter,
  filter,
  hasAnyTransactions,
  search,
  onRegister,
  onClear,
}: {
  dateFilter: DateFilter;
  filter: TransactionType | "all";
  hasAnyTransactions: boolean;
  search: string;
  onRegister: () => void;
  onClear: () => void;
}) {
  const hasActiveFilters = search || filter !== "all" || dateFilter !== "month";

  if (!hasAnyTransactions && !hasActiveFilters) {
    return (
      <EmptyState
        actionLabel="Registrar venta"
        message="Empieza registrando tu primera venta."
        title="¡Bienvenida a un nuevo mes!"
        onAction={onRegister}
      />
    );
  }

  if (search) {
    return (
      <EmptyState
        actionLabel="Limpiar búsqueda"
        message={`Ningún movimiento coincide con "${search}".`}
        title="Sin resultados"
        onAction={onClear}
      />
    );
  }

  if (filter !== "all") {
    const typeLabel = filter === "income" ? "ventas" : filter === "expense" ? "gastos" : "pagos";
    return (
      <EmptyState
        actionLabel="Ver todos"
        message={`No hay ${typeLabel} en ${getDateFilterLabel(dateFilter).toLowerCase()}.`}
        title={`Sin ${getTypeSingular(filter)} registrados`}
        onAction={onClear}
      />
    );
  }

  if (dateFilter !== "month") {
    return (
      <EmptyState
        actionLabel="Ver todos"
        message={`No se encontraron movimientos en ${getDateFilterLabel(dateFilter).toLowerCase()}.`}
        title={dateFilter === "today" ? "Hoy no hay movimientos" : "Sin movimientos en este período"}
        onAction={onClear}
      />
    );
  }

  return (
    <EmptyState
      actionLabel="Registrar venta"
      message="Empieza registrando tu primera venta."
      title="¡Bienvenida a un nuevo mes!"
      onAction={onRegister}
    />
  );
}

function getDateFilterLabel(dateFilter: DateFilter) {
  if (dateFilter === "today") return "Hoy";
  if (dateFilter === "lastMonth") return "el mes pasado";
  return "este período";
}

function getTypeSingular(type: TransactionType) {
  if (type === "income") return "ventas";
  if (type === "expense") return "gastos";
  return "pagos";
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <Card className="ui-card">
      <Card.Content>
        <span>{label}</span>
        <strong>{value}</strong>
      </Card.Content>
    </Card>
  );
}

function groupTransactions(transactions: Transaction[]) {
  const groups = new Map<string, Transaction[]>();

  transactions.forEach((transaction) => {
    const key = formatInputDate(toDate(transaction.date));
    groups.set(key, [...(groups.get(key) ?? []), transaction]);
  });

  return [...groups.entries()].map(([dateKey, groupTransactions]) => ({
    dateKey,
    title: getDateGroupTitle(dateKey),
    income: totalByType(groupTransactions, "income"),
    expenses: totalByType(groupTransactions, "expense"),
    withdrawals: totalByType(groupTransactions, "withdrawal"),
    transactions: groupTransactions,
  }));
}

function matchesDateFilter(transaction: Transaction, filter: DateFilter) {
  if (filter === "all") {
    return true;
  }

  if (filter === "today") {
    return isToday(transaction.date);
  }

  const today = new Date();
  if (filter === "month") {
    return isInMonth(transaction.date, today.getFullYear(), today.getMonth() + 1);
  }

  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  return isInMonth(transaction.date, lastMonth.getFullYear(), lastMonth.getMonth() + 1);
}

function matchesSearch(transaction: Transaction, search: string) {
  const query = normalizeSearch(search);
  if (!query) {
    return true;
  }

  return normalizeSearch([
    transaction.amount,
    transaction.notes,
    transaction.serviceName,
    transaction.categoryName,
    getTransactionLabel(transaction.type),
    getPaymentLabel(transaction.paymentMethod),
    formatDateShort(transaction.date),
  ].filter(Boolean).join(" ")).includes(query);
}

function normalizeSearch(value: string | number) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function sortTransactions(a: Transaction, b: Transaction, sortMode: SortMode) {
  if (sortMode === "highest") {
    return b.amount - a.amount;
  }

  if (sortMode === "lowest") {
    return a.amount - b.amount;
  }

  return new Date(b.date).getTime() - new Date(a.date).getTime();
}

function getSaleProfit(transaction: Transaction) {
  if (transaction.type !== "income" || typeof transaction.costAtTime !== "number") {
    return null;
  }

  return transaction.amount - transaction.costAtTime;
}

function totalByType(transactions: Transaction[], type: TransactionType) {
  return transactions
    .filter((transaction) => transaction.type === type)
    .reduce((total, transaction) => total + transaction.amount, 0);
}

function getDateGroupTitle(dateKey: string) {
  if (isToday(dateKey)) {
    return "Hoy";
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (formatInputDate(yesterday) === dateKey) {
    return "Ayer";
  }

  return formatDateShort(dateKey);
}

function getTransactionTitle(transaction: Transaction) {
  return transaction.serviceName ?? transaction.categoryName ?? transaction.notes ?? "Movimiento";
}

function getTransactionDetail(transaction: Transaction) {
  if (transaction.type === "withdrawal") {
    return "Pago a la dueña";
  }

  return formatDateShort(transaction.date);
}

function getTransactionLabel(type: TransactionType) {
  if (type === "income") {
    return "Venta";
  }
  if (type === "expense") {
    return "Gasto";
  }
  return "Pagarme";
}

function getPaymentLabel(paymentMethod: string) {
  if (paymentMethod === "cash") {
    return "Efectivo";
  }
  if (paymentMethod === "transfer") {
    return "Transferencia";
  }
  return "Otro";
}
