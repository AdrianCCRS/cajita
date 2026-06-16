import { Calendar } from "@heroui/react";
import { CalendarDays, ChevronLeft, ReceiptText } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getLocalTimeZone, parseDate, type DateValue } from "@internationalized/date";
import { BottomSheet, Button, Card, EmptyState, ScreenHero, Tabs } from "../../shared/components/ui";
import { useSpaData } from "../../shared/data/SpaDataContext";
import {
  calendarTransactionTypes,
  formatDisplayDate,
  getCalendarTypeMeta,
  getDayDetailTitle,
  getDayDetailTotalLabel,
  getDayKey,
  getMonthlyCalendarSummary,
  getMonthlyCountLabel,
  getMonthlyTotalLabel,
  getMonthKey,
  groupDayTransactionsForDetail,
  groupTransactionsByDay,
  groupTransactionsByMonth,
  type CalendarTransactionType,
  type DayTransactionGroup,
  type DayTransactionSummaryGroup,
} from "../../shared/utils/calendarTransactions";
import { formatCurrency } from "../../shared/utils/formatCurrency";
import { formatInputDate } from "../../shared/utils/dates";

export function TransactionCalendarPage() {
  const navigate = useNavigate();
  const { transactions, isLoading, error } = useSpaData();
  const [selectedType, setSelectedType] = useState<CalendarTransactionType>("income");
  const [selectedDate, setSelectedDate] = useState<DateValue | null>(() => parseDate(formatInputDate()));
  const [focusedDate, setFocusedDate] = useState<DateValue>(() => parseDate(formatInputDate()));
  const [selectedDay, setSelectedDay] = useState<DayTransactionGroup | null>(null);

  const typeMeta = getCalendarTypeMeta(selectedType);
  const groupedByDay = useMemo(() => groupTransactionsByDay(transactions, selectedType), [selectedType, transactions]);
  const groupedByMonth = useMemo(() => groupTransactionsByMonth(transactions, selectedType), [selectedType, transactions]);
  const daysByKey = useMemo(() => new Map(groupedByDay.map((day) => [day.dayKey, day])), [groupedByDay]);
  const focusedMonthKey = getMonthKey(dateValueToDate(focusedDate));
  const monthlySummary = useMemo(
    () => getMonthlyCalendarSummary(transactions, selectedType, focusedMonthKey),
    [focusedMonthKey, selectedType, transactions],
  );
  const hasAnyTypeMovements = groupedByDay.length > 0;
  const hasMonthMovements = monthlySummary.monthlyCount > 0;

  function handleTypeChange(nextType: CalendarTransactionType) {
    setSelectedType(nextType);
    setSelectedDay(null);
  }

  function handleDateChange(nextDate: DateValue) {
    setSelectedDate(nextDate);
    setFocusedDate(nextDate);

    const day = daysByKey.get(getDayKey(dateValueToDate(nextDate)));
    setSelectedDay(day ?? null);
  }

  return (
    <section className="screen-stack calendar-screen" aria-labelledby="calendar-title">
      <div className="calendar-back-row">
        <Button variant="tertiary" onPress={() => navigate("/historial")}>
          <ChevronLeft aria-hidden="true" size={18} />
          Volver a Historial
        </Button>
      </div>

      <ScreenHero title="Calendario">Revisa tus movimientos por día.</ScreenHero>

      {isLoading ? (
        <Card className="ui-card">
          <Card.Content>
            <p>Cargando calendario...</p>
          </Card.Content>
        </Card>
      ) : null}

      {error ? (
        <Card className="ui-card error-panel">
          <Card.Content>
            <strong>No pudimos cargar los movimientos.</strong>
            <p>Intenta nuevamente.</p>
          </Card.Content>
        </Card>
      ) : null}

      <div className="calendar-type-shell">
        <Tabs
          ariaLabel="Tipo de movimiento"
          items={calendarTransactionTypes.map((item) => ({ id: item.id, label: item.label, className: item.colorClass }))}
          value={selectedType}
          onChange={handleTypeChange}
        />
      </div>

      {!hasAnyTypeMovements ? (
        <EmptyState
          title="Sin movimientos"
          message="Todavía no hay movimientos para mostrar."
        />
      ) : null}

      <Card className={`ui-card calendar-card ${typeMeta.colorClass}`}>
        <Card.Content>
          <div className="section-heading">
            <div className="section-subheading">
              <span>{typeMeta.label}</span>
              <strong>Movimientos por día</strong>
            </div>
            <CalendarDays aria-hidden="true" size={22} />
          </div>

          <Calendar
            aria-label="Calendario de movimientos"
            className="transaction-calendar"
            firstDayOfWeek="mon"
            focusedValue={focusedDate}
            value={selectedDate}
            visibleDuration={{ months: 1 }}
            onChange={handleDateChange}
            onFocusChange={setFocusedDate}
          >
            <Calendar.Header>
              <Calendar.NavButton slot="previous" />
              <Calendar.Heading />
              <Calendar.NavButton slot="next" />
            </Calendar.Header>
            <Calendar.Grid>
              <Calendar.GridHeader>
                {(day) => <Calendar.HeaderCell>{String(day)}</Calendar.HeaderCell>}
              </Calendar.GridHeader>
              <Calendar.GridBody>
                {(date) => {
                  const group = daysByKey.get(getDayKey(dateValueToDate(date)));

                  return (
                    <Calendar.Cell date={date}>
                      {({ formattedDate, isOutsideMonth }) => (
                        <>
                          <span>{formattedDate}</span>
                          {group && !isOutsideMonth ? (
                            <Calendar.CellIndicator
                              aria-label={`${group.count} movimientos`}
                              className="calendar-day-count"
                              data-testid={`calendar-day-count-${group.dayKey}`}
                              style={{ backgroundColor: typeMeta.colorVar }}
                            >
                              {group.count}
                            </Calendar.CellIndicator>
                          ) : null}
                        </>
                      )}
                    </Calendar.Cell>
                  );
                }}
              </Calendar.GridBody>
            </Calendar.Grid>
          </Calendar>

          {!hasMonthMovements ? (
            <p className="hint-text">No hay movimientos de este tipo en este mes.</p>
          ) : null}
        </Card.Content>
      </Card>

      <CalendarSummaryCards selectedType={selectedType} summary={monthlySummary} />
      <MonthlyTransactionBarChart data={groupedByMonth} selectedType={selectedType} />

      {selectedDay ? (
        <DayTransactionsSheet
          day={selectedDay}
          selectedType={selectedType}
          onClose={() => setSelectedDay(null)}
        />
      ) : null}
    </section>
  );
}

function CalendarSummaryCards({
  selectedType,
  summary,
}: {
  selectedType: CalendarTransactionType;
  summary: ReturnType<typeof getMonthlyCalendarSummary>;
}) {
  return (
    <div className="calendar-summary-grid">
      <SummaryMiniCard label={getMonthlyTotalLabel(selectedType)} value={formatCurrency(summary.monthlyTotal)} />
      <SummaryMiniCard label={getMonthlyCountLabel(selectedType)} value={`${summary.monthlyCount}`} />
      <SummaryMiniCard
        label="Día con más movimientos"
        value={summary.highestCountDay ? `${summary.highestCountDay.date.getDate()} · ${summary.highestCountDay.count}` : "Sin datos"}
      />
      <SummaryMiniCard
        label="Día con mayor valor"
        value={summary.highestAmountDay ? `${summary.highestAmountDay.date.getDate()} · ${formatCurrency(summary.highestAmountDay.totalAmount)}` : "Sin datos"}
      />
    </div>
  );
}

function SummaryMiniCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="ui-card calendar-summary-card">
      <Card.Content>
        <span>{label}</span>
        <strong>{value}</strong>
      </Card.Content>
    </Card>
  );
}

function MonthlyTransactionBarChart({
  data,
  selectedType,
}: {
  data: Array<{ monthKey: string; monthLabel: string; totalAmount: number; count: number }>;
  selectedType: CalendarTransactionType;
}) {
  const typeMeta = getCalendarTypeMeta(selectedType);

  return (
    <Card className="ui-card wide-card calendar-chart-card">
      <Card.Content>
        <div className="section-heading">
          <div>
            <span>{typeMeta.label}</span>
            <strong>Resumen por meses</strong>
          </div>
          <ReceiptText aria-hidden="true" size={22} />
        </div>

        {data.length ? (
          <div className="calendar-chart" data-testid="calendar-month-chart">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={data} margin={{ top: 8, right: 10, bottom: 0, left: 0 }}>
                <XAxis dataKey="monthLabel" tickLine={false} />
                <YAxis tickFormatter={formatShortCurrency} tickLine={false} width={54} />
                <Tooltip
                  formatter={(value, _name, item) => [
                    formatCurrency(Number(value)),
                    `${item.payload?.count ?? 0} movimientos`,
                  ]}
                  labelFormatter={(label) => String(label)}
                />
                <Bar dataKey="totalAmount" fill={typeMeta.colorVar} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="chart-empty-state">
            <p>Cuando registres movimientos, aquí verás un resumen por meses.</p>
          </div>
        )}
      </Card.Content>
    </Card>
  );
}

function DayTransactionsSheet({
  day,
  selectedType,
  onClose,
}: {
  day: DayTransactionGroup;
  selectedType: CalendarTransactionType;
  onClose: () => void;
}) {
  return (
    <BottomSheet
      isOpen
      eyebrow={formatDisplayDate(day.date)}
      title={getDayDetailTitle(selectedType)}
      onClose={onClose}
    >
      <div className="detail-list calendar-day-detail">
        <SummaryMiniCard label={getDayDetailTotalLabel(selectedType)} value={formatCurrency(day.totalAmount)} />
        <SummaryMiniCard label="Movimientos" value={`${day.count}`} />

        <div className="calendar-day-movements">
          {groupDayTransactionsForDetail(day.transactions).map((group) => (
            <DayTransactionRow key={group.key} group={group} selectedType={selectedType} />
          ))}
        </div>
      </div>
    </BottomSheet>
  );
}

function DayTransactionRow({
  group,
  selectedType,
}: {
  group: DayTransactionSummaryGroup;
  selectedType: CalendarTransactionType;
}) {
  return (
    <Card className={`ui-card list-row movement-row row--${selectedType}`}>
      <Card.Content>
        <div>
          <span>{group.count} {group.count === 1 ? "movimiento" : "movimientos"} · {group.paymentMethods.join(", ")}</span>
          <strong>{group.title}</strong>
          {group.times.length ? <p>Horas: {group.times.join(", ")}</p> : null}
          {group.notes.length ? <p>{group.notes.join(" · ")}</p> : null}
        </div>
        <div className="row-actions">
          <b>{formatCurrency(group.totalAmount)}</b>
        </div>
      </Card.Content>
    </Card>
  );
}

function dateValueToDate(value: DateValue) {
  return value.toDate(getLocalTimeZone());
}

function formatShortCurrency(value: number) {
  if (Math.abs(value) >= 1000000) {
    return `${Math.round(value / 1000000)}M`;
  }

  if (Math.abs(value) >= 1000) {
    return `${Math.round(value / 1000)}K`;
  }

  return String(Math.round(value));
}
