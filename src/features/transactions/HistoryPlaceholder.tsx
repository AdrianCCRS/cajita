import { Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { BottomSheet, Button, Card, CardContent, ConfirmDialog, EmptyState, ScreenHero } from "../../shared/components/ui";
import { useSpaData } from "../../shared/data/SpaDataContext";
import type { Transaction, TransactionType } from "../../shared/types/domain";
import { formatDateShort } from "../../shared/utils/dates";
import { formatCurrency } from "../../shared/utils/formatCurrency";

const filters: Array<{ id: TransactionType | "all"; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "income", label: "Ventas" },
  { id: "expense", label: "Gastos" },
  { id: "withdrawal", label: "Pagarme" },
];

export function HistoryPlaceholder() {
  const { openRegister, showToast } = useOutletContext<{
    openRegister: (type: TransactionType) => void;
    showToast: (toast: { kind?: "success" | "warning" | "error"; message: string; actionLabel?: string; onAction?: () => void }) => void;
  }>();
  const { transactions, deleteTransaction, restoreTransaction } = useSpaData();
  const [filter, setFilter] = useState<TransactionType | "all">("all");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);
  const visibleTransactions = useMemo(
    () =>
      transactions
        .filter((transaction) => filter === "all" || transaction.type === filter)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [filter, transactions],
  );

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

      <div className="segmented inline" aria-label="Filtrar movimientos">
        {filters.map((item) => (
          <Button
            key={item.id}
           
            size="sm"
            variant={filter === item.id ? "primary" : "tertiary"}
            onPress={() => setFilter(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {visibleTransactions.length ? (
        <div className="list-stack">
          {visibleTransactions.map((transaction) => (
            <Card className="ui-card list-row movement-row" key={transaction.id} onClick={() => setSelectedTransaction(transaction)} role="button" tabIndex={0}>
              <CardContent>
                <div>
                  <span>{getTransactionLabel(transaction.type)}</span>
                  <strong>{transaction.serviceName ?? transaction.categoryName ?? transaction.notes ?? "Movimiento"}</strong>
                  <p>{formatDateShort(transaction.date)}</p>
                </div>
                <div className="row-actions">
                  <b>{formatCurrency(transaction.amount)}</b>
                  <Button
                    isIconOnly
                    aria-label="Eliminar movimiento"
                   
                    size="sm"
                    variant="danger"
                    onPress={() => setPendingDelete(transaction)}
                  >
                    <Trash2 aria-hidden="true" size={18} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          actionLabel="Registrar venta"
          message="Empieza registrando tu primera venta."
          title="¡Bienvenida a un nuevo mes!"
          onAction={() => openRegister("income")}
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
              Eliminar movimiento
            </Button>
          </div>
        </BottomSheet>
      ) : null}

      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        message={
          pendingDelete
            ? `¿Segura que quieres eliminar este movimiento de ${formatCurrency(pendingDelete.amount)}?`
            : "¿Segura que quieres eliminar este movimiento?"
        }
        title="Eliminar movimiento"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
      />
    </section>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <Card className="ui-card">
      <CardContent>
        <span>{label}</span>
        <strong>{value}</strong>
      </CardContent>
    </Card>
  );
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
