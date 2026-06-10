import { Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useSpaData } from "../../shared/data/SpaDataContext";
import type { TransactionType } from "../../shared/types/domain";
import { formatDateShort } from "../../shared/utils/dates";
import { formatCurrency } from "../../shared/utils/formatCurrency";

export function HistoryPlaceholder() {
  const { transactions, deleteTransaction } = useSpaData();
  const [filter, setFilter] = useState<TransactionType | "all">("all");
  const visibleTransactions = useMemo(
    () =>
      transactions
        .filter((transaction) => filter === "all" || transaction.type === filter)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [filter, transactions],
  );

  return (
    <section className="screen-stack" aria-labelledby="history-title">
      <div className="hero-panel">
        <h2 id="history-title">Historial</h2>
        <p>Movimientos ordenados del más reciente al más antiguo.</p>
      </div>

      <div className="segmented inline">
        <button type="button" className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>
          Todos
        </button>
        <button type="button" className={filter === "income" ? "active" : ""} onClick={() => setFilter("income")}>
          Ventas
        </button>
        <button type="button" className={filter === "expense" ? "active" : ""} onClick={() => setFilter("expense")}>
          Gastos
        </button>
        <button
          type="button"
          className={filter === "withdrawal" ? "active" : ""}
          onClick={() => setFilter("withdrawal")}
        >
          Salario
        </button>
      </div>

      {visibleTransactions.length ? (
        <div className="list-stack">
          {visibleTransactions.map((transaction) => (
            <article className="list-row" key={transaction.id}>
              <div>
                <span>{transaction.type === "income" ? "Venta" : transaction.type === "expense" ? "Gasto" : "Pagarme"}</span>
                <strong>{transaction.serviceName ?? transaction.categoryName ?? transaction.notes ?? "Movimiento"}</strong>
                <p>{formatDateShort(transaction.date)}</p>
              </div>
              <div className="row-actions">
                <b>{formatCurrency(transaction.amount)}</b>
                <button
                  className="icon-button danger"
                  type="button"
                  aria-label="Eliminar movimiento"
                  onClick={() => {
                    if (window.confirm(`¿Segura que quieres eliminar este movimiento de ${formatCurrency(transaction.amount)}?`)) {
                      void deleteTransaction(transaction.id);
                    }
                  }}
                >
                  <Trash2 aria-hidden="true" size={18} />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <article className="task-card">
          <span>Sin movimientos</span>
          <strong>¡Bienvenida a un nuevo mes!</strong>
          <p>Empieza registrando tu primera venta.</p>
        </article>
      )}
    </section>
  );
}
