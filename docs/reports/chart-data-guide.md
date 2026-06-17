# Cajita — Guia de datos para graficas y reportes

Referencia tecnica para construir dashboards, graficas, reportes y visualizaciones dentro de Cajita. Este documento describe que datos existen, como se guardan, que calculos se pueden derivar y que tipos de graficas son utiles para cada necesidad.

---

## 1. Proposito del documento

Este archivo sirve como guia unica para cualquier desarrollador que necesite:

- Entender que datos estan disponibles en Firestore.
- Saber que campos usar para construir visualizaciones.
- Conocer los calculos financieros ya implementados.
- Decidir que tipo de grafica responde mejor a cada pregunta de negocio.
- Preparar datasets compatibles con Recharts (la libreria usada en Cajita).

No es un documento de producto ni de diseno. Es una referencia tecnica de datos.

---

## 2. Fuentes de datos disponibles

Todas las colecciones viven bajo la ruta base `users/{userId}/businesses/main/`.

### 2.1 Transactions

**Ruta:** `users/{userId}/businesses/main/transactions/{transactionId}`

**Que representa:** Cada movimiento financiero registrado en el spa. Es la coleccion mas importante para graficas.

**Tipos de transaccion:**

| Tipo | Significado | Destino en graficas |
|---|---|---|
| `income` | Venta de un servicio | Ingresos, ventas por servicio, tendencias |
| `expense` | Gasto operativo del negocio | Egresos, gastos por categoria |
| `withdrawal` | Pago/retiro de la duena | Salario pagado, seguimiento de meta |
| `personal_voucher` | Vale personal (adelanto de salario) | Vales tomados, total recibido por la duena |

**Campos universales (presentes en todos los tipos):**

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | `string` | ID del documento |
| `type` | `TransactionType` | Tipo de movimiento |
| `amount` | `number` | Monto en COP (siempre positivo) |
| `date` | `string` | Fecha del movimiento (ISO yyyy-MM-dd) |
| `paymentMethod` | `PaymentMethod` | `cash`, `transfer` u `other` |
| `notes` | `string?` | Notas opcionales |
| `createdAt` | `unknown` | Timestamp de creacion (Firestore o string) |
| `updatedAt` | `unknown` | Timestamp de ultima actualizacion |

**Campos solo para `income`:**

| Campo | Tipo | Descripcion |
|---|---|---|
| `serviceId` | `string?` | ID del servicio vendido |
| `serviceName` | `string?` | Snapshot del nombre del servicio al momento de la venta |
| `priceAtTime` | `number?` | Precio cobrado (puede diferir del `defaultPrice` actual) |
| `costAtTime` | `number?` | Costo estimado al momento de la venta |
| `materialsSnapshot` | `Array?` | Snapshot de insumos usados (rawMaterialId, rawMaterialName, quantityUsed, unitCostSnapshot, totalCost) |

**Campos solo para `expense`:**

| Campo | Tipo | Descripcion |
|---|---|---|
| `categoryId` | `string?` | ID de la categoria de gasto |
| `categoryName` | `string?` | Snapshot del nombre de la categoria |
| `expenseType` | `ExpenseType?` | `fixed`, `variable` o `extraordinary` |

**Campos solo para `personal_voucher`:**

| Campo | Tipo | Descripcion |
|---|---|---|
| `personalCategoryId` | `string?` | ID de la categoria personal |
| `personalCategoryName` | `string?` | Snapshot del nombre de la categoria personal |

**Precauciones importantes:**

- Las transacciones usan **snapshots historicos**: `serviceName`, `priceAtTime`, `costAtTime` y `categoryName` se guardan al momento del registro. Si un servicio cambia de precio manana, los reportes de hoy no se alteran.
- `amount` siempre es positivo. Nunca guardes montos negativos.
- Los `withdrawals` no tienen `categoryId` propio; el `categoryName` se hardcodea como `"Salario de la duena"`.
- `personal_voucher` no es un gasto del negocio. Nunca sumarlo con `expense`.

### 2.2 Services

**Ruta:** `users/{userId}/businesses/main/services/{serviceId}`

**Que representa:** Catalogo de servicios que ofrece el spa.

**Campos utiles para graficas:**

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | `string` | ID del documento |
| `name` | `string` | Nombre del servicio |
| `defaultPrice` | `number` | Precio base en COP |
| `estimatedCost` | `number` | Costo estimado (insumos + mano de obra directa) |
| `costCalculationMode` | `CostCalculationMode?` | `"automatic"` (suma de insumos) o `"manual"` |
| `isActive` | `boolean` | Si el servicio esta activo |

**Precauciones:**

- Los servicios eliminados deben marcarse `isActive: false`. Nunca borrarlos fisicamente porque el historial de ventas los referencia.
- Para calcular margen de un servicio usa `priceAtTime` y `costAtTime` de la transaccion, no `defaultPrice` ni `estimatedCost` del servicio actual.
- El `estimatedCost` en el servicio se recalcula automaticamente cuando `costCalculationMode === "automatic"` y cambian los insumos asociados.

**Subcoleccion: Materials**

`users/{userId}/businesses/main/services/{serviceId}/materials/{materialId}`

Asocia insumos (RawMaterials) a servicios. Campos utiles: `rawMaterialName`, `quantityUsed`, `unitCostSnapshot`, `totalCost`, `servicesCovered`.

### 2.3 RawMaterials (Insumos)

**Ruta:** `users/{userId}/businesses/main/rawMaterials/{rawMaterialId}`

**Que representa:** Insumos comprados para prestar servicios (esmaltes, acetona, cremas, etc.).

**Campos utiles para graficas:**

| Campo | Tipo | Descripcion |
|---|---|---|
| `name` | `string` | Nombre del insumo |
| `purchasePrice` | `number` | Precio pagado por la cantidad comprada |
| `purchaseQuantity` | `number` | Cantidad comprada en `purchaseUnit` |
| `purchaseUnit` | `PurchaseUnit` | Unidad de compra (`ml`, `l`, `g`, `kg`, `unit`) |
| `unitCost` | `number` | Costo por unidad base (`purchasePrice / baseQuantity`) |
| `stockQuantity` | `number` | Stock actual en unidades base |
| `minimumStock` | `number?` | Stock minimo recomendado |
| `isActive` | `boolean` | Si el insumo esta activo |

**Subcoleccion: PriceHistory**

Registra cada cambio de precio de compra. Campos: `previousUnitCost`, `newUnitCost`, `changedAt`.

### 2.4 Categories (Categorias de gasto)

**Ruta:** `users/{userId}/businesses/main/categories/{categoryId}`

**Que representa:** Categorias para clasificar gastos del negocio.

9 categorias predefinidas: Insumos, Arriendo, Servicios publicos, Publicidad, Mantenimiento, Transporte, Capacitacion, Equipos y herramientas, Otros.

**Campos utiles:** `name`, `color`, `isActive`.

### 2.5 PersonalExpenseCategories (Categorias de vales personales)

**Ruta:** `users/{userId}/businesses/main/personalExpenseCategories/{categoryId}`

**Que representa:** Categorias para clasificar los vales personales (adelantos de salario).

7 categorias predefinidas: Alimentacion, Transporte personal, Familia, Salud, Compras personales, Hogar, Otros.

**Campos utiles:** `name`, `color`, `isActive`.

### 2.6 FixedExpenses (Gastos fijos)

**Ruta:** `users/{userId}/businesses/main/fixedExpenses/{fixedExpenseId}`

**Que representa:** Gastos fijos mensuales configurados por la duena (arriendo, internet, etc.).

**Campos utiles:** `name`, `amount`, `isActive`.

Estos alimentan el calculo del punto de equilibrio. Solo se suman los que tienen `isActive: true`.

### 2.7 FinancialSettings

**Ruta:** `users/{userId}/businesses/main/financialSettings/main` (documento unico)

**Que representa:** Configuracion financiera de la duena.

**Campo principal:** `salaryTarget` — el salario mensual que la duena quiere pagarse.

---

## 3. Datos disponibles en transactions

### 3.1 Income (ventas)

**Significado:** Dinero que entra al negocio por vender un servicio.

**Campos que suelen estar presentes:** `serviceId`, `serviceName`, `priceAtTime`, `costAtTime`, `materialsSnapshot`.

**Visualizaciones que permite:**
- Ventas totales por mes/semana/dia
- Servicios mas vendidos (por cantidad)
- Servicios con mayor ingreso (por monto)
- Tendencia diaria/semanal de ventas
- Ticket promedio
- Ganancia estimada por servicio (`priceAtTime - costAtTime`)
- Margen estimado porcentual

### 3.2 Expense (gastos del negocio)

**Significado:** Dinero que sale del negocio para cubrir costos operativos.

**Campos que suelen estar presentes:** `categoryId`, `categoryName`, `expenseType`.

**Visualizaciones que permite:**
- Gastos totales por mes/semana
- Gastos por categoria
- Comparacion ventas vs gastos
- Gastos por tipo (`fixed`, `variable`, `extraordinary`)
- Composicion de gastos del mes

### 3.3 Withdrawal (pagos a la duena)

**Significado:** Dinero que la duena se paga a si misma como salario. **No es un gasto del negocio.**

**Campos que suelen estar presentes:** `categoryName` (hardcodeado a `"Salario de la duena"`).

**Visualizaciones que permite:**
- Total pagado a la duena por mes
- Salario pendiente (meta - pagado - vales)
- Porcentaje de salario tomado
- Comparacion: ingresos vs gastos vs salario

### 3.4 Personal Voucher (vales personales)

**Significado:** Adelantos de salario que la duena toma durante el mes. **No son gastos del negocio.**

**Campos que suelen estar presentes:** `personalCategoryId`, `personalCategoryName`.

**Visualizaciones que permite:**
- Total en vales por mes
- Vales por categoria personal
- Total recibido por la duena (retiros + vales)

**Regla critica:** Los vales personales **nunca** deben sumarse a los gastos del negocio (`expense`). Se suman a los retiros (`withdrawal`) para calcular el total recibido por la duena.

---

## 4. Campos utiles para graficas

| Campo | Coleccion | Tipo | Significado | Uso en graficas | Observaciones |
|---|---|---|---|---|---|
| `amount` | transactions | `number` | Monto en COP (positivo) | Eje Y de cualquier grafica de totales | Siempre positivo |
| `date` | transactions | `string` (ISO) | Fecha del movimiento | Eje X temporal, agrupacion por dia/semana/mes | Formato `yyyy-MM-dd` |
| `type` | transactions | `TransactionType` | Tipo de movimiento | Filtro principal para segregar datos | `income` / `expense` / `withdrawal` / `personal_voucher` |
| `serviceId` | transactions | `string?` | ID del servicio vendido | Agrupacion por servicio | Solo en income |
| `serviceName` | transactions | `string?` | Nombre del servicio al momento de la venta | Etiquetas en graficas de servicios | Es snapshot, no cambia si el servicio se renombra |
| `priceAtTime` | transactions | `number?` | Precio cobrado en la venta | Calcular ingreso real por servicio | Puede diferir de `defaultPrice` |
| `costAtTime` | transactions | `number?` | Costo estimado al momento de la venta | Calcular ganancia estimada por transaccion | `priceAtTime - costAtTime` |
| `categoryId` | transactions | `string?` | ID de la categoria de gasto | Agrupacion por categoria | Solo en expense |
| `categoryName` | transactions | `string?` | Nombre de la categoria al momento del gasto | Etiquetas en graficas de gastos | Es snapshot |
| `personalCategoryId` | transactions | `string?` | ID de la categoria personal | Agrupacion por categoria de vale | Solo en personal_voucher |
| `personalCategoryName` | transactions | `string?` | Nombre de la categoria personal | Etiquetas en graficas de vales | Es snapshot |
| `paymentMethod` | transactions | `PaymentMethod` | Medio de pago | Distribucion de metodos de pago | `cash` / `transfer` / `other` |
| `expenseType` | transactions | `ExpenseType?` | Tipo de gasto | Separar fijos de variables | `fixed` / `variable` / `extraordinary` |
| `isActive` | services, categories, rawMaterials, fixedExpenses | `boolean` | Si el registro esta activo | Filtrar elementos activos solamente | Los inactivos se conservan para historial |
| `defaultPrice` | services | `number` | Precio base del servicio | Referencia, no usar en reportes historicos | Usar `priceAtTime` para calculos sobre ventas reales |
| `estimatedCost` | services | `number` | Costo estimado del servicio | Referencia para margen actual | Se recalcula si `costCalculationMode === "automatic"` |
| `costCalculationMode` | services | `"automatic" \| "manual"` | Modo de calculo de costo | Saber si el costo es automatico o manual | Afecta como se recalcula `estimatedCost` |
| `salaryTarget` | financialSettings | `number` | Meta de salario mensual | Barra de progreso de salario | Unico documento: `financialSettings/main` |
| `amount` (fixedExpense) | fixedExpenses | `number` | Valor del gasto fijo mensual | Punto de equilibrio, gastos fijos totales | Solo se suman los `isActive` |
| `stockQuantity` | rawMaterials | `number` | Stock actual en unidades base | Alertas de stock bajo | Comparar con `minimumStock` |
| `unitCost` | rawMaterials | `number` | Costo por unidad base | Analisis de costos de insumos | `purchasePrice / baseQuantity` |
| `materialsSnapshot` | transactions | `Array?` | Insumos usados en la venta | Desglose de costo por insumo | Solo en income. Cada elemento tiene `rawMaterialName`, `totalCost`, `quantityUsed` |
| `notes` | transactions | `string?` | Notas del movimiento | No se grafica directamente | Util para tooltips o detalles |

---

## 5. Metricas derivadas

Todas las funciones de calculo existen en `src/shared/utils/financials.ts` y son puras (sin side effects). Usarlas directamente. No recalcular en componentes.

### 5.1 Totales por periodo

| Metrica | Funcion | Descripcion |
|---|---|---|
| Total vendido | `getMonthlyIncome(trx, year, month)` | Suma de `income` en el mes |
| Total gastado | `getMonthlyExpenses(trx, year, month)` | Suma de `expense` en el mes |
| Total pagado a la duena | `getMonthlyWithdrawals(trx, year, month)` | Suma de `withdrawal` en el mes |
| Total en vales | `getMonthlyPersonalVouchers(trx, year, month)` | Suma de `personal_voucher` en el mes |
| Gastos fijos totales | `getTotalFixedExpenses(fixedExpenses)` | Suma de `amount` de gastos fijos activos |

### 5.2 Flujo y ganancia

| Metrica | Funcion | Formula |
|---|---|---|
| Ganancia estimada (antes de salario) | `getEstimatedProfit(income, expenses)` | `income - expenses` |
| Ganancia neta (despues de salario y vales) | `getNetProfit(income, expenses, withdrawals, vouchers)` | `income - expenses - withdrawals - vouchers` |
| Dinero disponible estimado | Calculo simple | `income - expenses` del mes |
| Ganancia estimada por venta | Por transaccion | `priceAtTime - costAtTime` |
| Margen porcentual estimado | Por transaccion | `((priceAtTime - costAtTime) / priceAtTime) * 100` |
| Margen actual del servicio | `getServiceMargin(service)` | `((defaultPrice - estimatedCost) / defaultPrice) * 100` |

**Importante:** La ganancia calculada como `priceAtTime - costAtTime` no debe llamarse "ganancia neta". Usar terminos como "ganancia estimada", "margen bruto estimado" o "lo que deja el servicio". La ganancia neta requiere restar tambien gastos fijos y salario.

### 5.3 Salario de la duena

| Metrica | Funcion | Formula |
|---|---|---|
| Salario pendiente | `getOwnerSalaryPending(target, withdrawals, vouchers)` | `salaryTarget - withdrawals - vouchers` |
| Total recibido | `getOwnerTotalReceived(withdrawals, vouchers)` | `withdrawals + vouchers` |
| Porcentaje de salario tomado | `getSalaryUsagePercentage(target, totalReceived)` | `(totalReceived / salaryTarget) * 100` |

El salario pendiente puede ser negativo si la duena ya se pago mas de su meta.

### 5.4 Punto de equilibrio

| Metrica | Funcion | Formula |
|---|---|---|
| Punto de equilibrio | `getBreakEvenPoint(fixedExpenses, transactions)` | `gastosFijos / (1 - costoVarPromedio / precioPromedio)` |
| Progreso hacia PE | `getBreakEvenProgress(income, breakEven)` | `(income / breakEven) * 100` |
| Meta diaria sugerida | `getDailySuggestedGoal(breakEven, workingDays)` | `breakEven / workingDays` |

Si no hay datos suficientes, `getBreakEvenPoint` retorna `null`. Mostrar mensaje: "Configura tus gastos fijos para ver esta metrica."

### 5.5 Servicios

| Metrica | Funcion | Descripcion |
|---|---|---|
| Servicio mas vendido (cantidad) | `getTopServiceBySales(trx)` | Mayor `count` de transacciones income |
| Servicio con mayor ingreso | `getTopServiceByRevenue(trx)` | Mayor suma de `amount` en income |
| Servicios por cantidad | `getServicesByCountChartData(trx)` | Labels + series para bar chart |
| Servicios por ingreso | `getServicesByRevenueChartData(trx)` | Labels + series para bar chart |
| Margen del servicio | `getServiceMargin(service)` | `((defaultPrice - estimatedCost) / defaultPrice) * 100` |

### 5.6 Categorias

| Metrica | Funcion | Descripcion |
|---|---|---|
| Gastos por categoria | `getExpensesByCategory(trx)` | Arreglo de `{categoryId, categoryName, total}` |
| Vales por categoria personal | `groupPersonalVouchersByCategory(trx)` | Arreglo de `{personalCategoryId, personalCategoryName, total}` |

### 5.7 Tendencias temporales

| Metrica | Funcion | Descripcion |
|---|---|---|
| Ventas y gastos por semana | `getWeeklyIncomeExpenseChartData(trx, year, month)` | Barras agrupadas por semana |
| Ventas diarias | `getDailyIncomeChartData(trx, year, month)` | Un punto por dia del mes |
| Transacciones por dia | `groupTransactionsByDay(trx, type)` | Agrupacion para calendario |
| Transacciones por mes | `groupTransactionsByMonth(trx, type)` | Agrupacion para grafico de barras mensual |
| Resumen mensual | `getMonthlyCalendarSummary(trx, type, monthKey)` | Total, dia con mas movimientos, dia con mayor valor |

### 5.8 Otras metricas utiles

| Metrica | Calculo |
|---|---|
| Ticket promedio | `totalIncome / cantidadDeVentas` |
| Ticket promedio por servicio | `sum(priceAtTime) / count` agrupado por `serviceName` |
| Transacciones por metodo de pago | `count` agrupado por `paymentMethod` |
| Servicios necesarios para cubrir gastos fijos | `totalFixedExpenses / ticketPromedio` |
| Dias con mas ventas | `groupTransactionsByDay(trx, "income")` ordenado por `count` desc |
| Dia de mayor ingreso | `groupTransactionsByDay(trx, "income")` ordenado por `totalAmount` desc |

---

## 6. Recomendaciones de graficas por necesidad

| Pregunta que responde | Datos necesarios | Calculo | Tipo de grafica | Por que sirve | Prioridad |
|---|---|---|---|---|---|
| Cuanto vendi por mes? | `income` del periodo | `groupTransactionsByMonth` | Bar chart | Comparacion visual rapida entre meses | Alta |
| Cuanto gaste por mes? | `expense` del periodo | `groupTransactionsByMonth` | Bar chart | Identificar meses de alto gasto | Alta |
| Cuanto me pague como duena? | `withdrawal` del periodo | `groupTransactionsByMonth` | Bar chart | Seguimiento de salario mensual | Alta |
| Cuanto tome en vales? | `personal_voucher` del periodo | `groupTransactionsByMonth` | Bar chart | Control de adelantos | Alta |
| Que servicios generan mas ventas? | `income` agrupado por `serviceName` | `getServicesByCountChartData` | Bar horizontal | Identificar servicios mas populares | Alta |
| Que servicios dejan mas ganancia estimada? | `income` con `priceAtTime - costAtTime` agrupado por `serviceName` | Suma de margen por servicio | Bar horizontal | Priorizar servicios rentables | Alta |
| En que categorias se va mas dinero? | `expense` agrupado por `categoryName` | `getExpensesByCategoryChartData` | Donut (si <=6) o bar horizontal | Detectar fugas de dinero | Alta |
| Que dias hay mas ventas? | `income` agrupado por `date` | `getDailyIncomeChartData` | Area chart | Identificar dias fuertes y flojos | Alta |
| Como van ventas vs gastos este mes? | `income` y `expense` por semana | `getWeeklyIncomeExpenseChartData` | Bar agrupado | Ver salud financiera semanal | Alta |
| Cuanto falta para cubrir gastos fijos? | `income`, `fixedExpenses` | Break-even progress | Barra de progreso | Saber si el mes ya es rentable | Alta |
| Cuanto falta para completar el salario? | `withdrawal`, `voucher`, `salaryTarget` | `getOwnerSalaryPending` | Barra de progreso | Tracking de meta personal | Alta |
| Como se distribuyen los gastos? | `expense` por `categoryName` y `month` | `groupTransactionsByMonth` + agrupacion | Stacked bar | Ver composicion de gastos por mes | Media |
| Que metodo de pago se usa mas? | `paymentMethod` en `income` | Count por `paymentMethod` | Donut | Entender preferencias de clientes | Media |
| Cual es el ticket promedio? | `income` total / count | Division simple | KPI card | Valor de referencia | Media |
| Que margen tiene cada servicio? | `priceAtTime`, `costAtTime` por `serviceName` | `(price - cost) / price * 100` | Bar horizontal | Comparar rentabilidad | Media |
| En que uso los vales personales? | `personal_voucher` agrupado por `personalCategoryName` | `groupPersonalVouchersByCategory` | Donut o bar | Autoconocimiento financiero | Media |
| Como evolucionan ventas vs gastos vs salario? | `income`, `expense`, `withdrawal` mensual | `groupTransactionsByMonth` para cada tipo | Line chart multilinea | Ver tendencias de largo plazo | Baja |
| Como va el stock de insumos? | `rawMaterials` con `stockQuantity` y `minimumStock` | Filtro de bajo stock | Lista con alertas o bar | Prevenir quedarse sin insumos | Baja |
| Como cambian los costos de insumos? | `rawMaterialPriceHistory` | `unitCost` en el tiempo | Line chart | Detectar inflacion de insumos | Baja |
| Comparativa anual | `income` y `expense` agrupado por `year` y `month` | Sumas mensuales | Line chart | Ver crecimiento ano a ano | Baja (Fase 2) |

---

## 7. Tipos de graficas recomendadas

### 7.1 Bar chart (barras verticales)

**Cuando usar:**
- Comparar valores entre categorias independientes (servicios, meses, categorias).
- Mostrar rankings (servicio mas vendido, categoria con mas gasto).
- Comparar dos metricas lado a lado (ventas vs gastos por semana).

**Cuando NO usar:**
- Tendencias en el tiempo con muchos puntos (preferir line).
- Proporciones de un todo (preferir donut).

**Ejemplo en Cajita:** `getWeeklyIncomeExpenseChartData` produce datos para un bar chart agrupado (income y expense por semana).

### 7.2 Bar horizontal

**Cuando usar:**
- Misma funcion que bar vertical pero con etiquetas largas (nombres de servicios, categorias).
- Rankings donde el texto es mas importante que la posicion temporal.
- Funciona mejor en movil que el bar vertical con etiquetas largas.

**Ejemplo en Cajita:** `getServicesByCountChartData` y `getServicesByRevenueChartData` usan bar horizontal para el Top Services.

### 7.3 Line chart (lineas)

**Cuando usar:**
- Tendencias continuas en el tiempo (ventas diarias, evolucion mensual).
- Mostrar multiples series para comparar (ventas, gastos, salario en el tiempo).
- Datos con muchos puntos donde las barras se verian saturadas.

**Cuando NO usar:**
- Datos categoricos sin orden natural (servicios, categorias).
- Pocos puntos (< 4). Preferir barras.

**Ejemplo en Cajita:** Tendencia de ingresos vs gastos mensuales a lo largo de un ano.

### 7.4 Area chart

**Cuando usar:**
- Tendencia de una sola metrica con enfasis en el volumen (ventas diarias del mes).
- Comparar magnitud entre dos series (ingresos vs gastos con relleno).
- Version "suavizada" del line chart.

**Cuando NO usar:**
- Mas de 2-3 series (se vuelve ilegible).
- Datos categoricos.

**Ejemplo en Cajita:** `getDailyIncomeChartData` produce datos para un area chart de ventas diarias.

### 7.5 Donut chart

**Cuando usar:**
- Mostrar proporcion de un todo con pocas categorias (maximo 6-7).
- Distribucion de gastos por categoria.
- Distribucion de metodos de pago.

**Cuando NO usar:**
- Mas de 7 categorias (ilegible, usar bar horizontal).
- Comparar valores absolutos entre graficas (el ojo humano es malo comparando angulos).
- Tendencias temporales.

**Ejemplo en Cajita:** `getExpensesByCategoryChartData` produce datos para un donut de gastos por categoria.

### 7.6 Stacked bar chart

**Cuando usar:**
- Ver composicion por periodo (gastos por categoria cada mes).
- Comparar totales Y composicion simultaneamente.

**Cuando NO usar:**
- Muchas categorias (> 5) porque las capas se vuelven ilegibles.
- Datos con diferencias de magnitud muy grandes entre categorias.

**Ejemplo en Cajita:** Gastos del negocio desglosados por categoria, mes a mes.

### 7.7 KPI Cards (tarjetas de metrica)

**Cuando usar:**
- Totales principales que la duena necesita ver de un vistazo.
- No son graficas, son indicadores numericos con etiqueta.

**Ejemplos en Cajita:**
- Total vendido hoy / este mes
- Total gastado este mes
- Dinero del negocio (ventas - gastos)
- Salario pendiente
- Meta diaria sugerida

### 7.8 Calendario con indicadores

**Cuando usar:**
- Visualizar movimientos por dia en contexto de calendario mensual.
- La duena quiere ver "que dias trabaje" y "cuanto vendi cada dia".

**Ejemplo en Cajita:** `TransactionCalendarPage` — calendario con badges de cantidad y color por tipo de transaccion.

---

## 8. Graficas prioritarias para Cajita

### Prioridad alta (esenciales para el MVP)

| # | Grafica | Estado actual | Tipo |
|---|---|---|---|
| 1 | Ventas por mes | Ya existen funciones, no implementada como chart independiente | Bar chart |
| 2 | Gastos por mes | Ya existen funciones | Bar chart |
| 3 | Ventas vs gastos (semanal) | Implementada en `DashboardChartCard` | Bar agrupado |
| 4 | Servicios mas vendidos (cantidad) | Implementada en `TopServicesChart` | Bar horizontal |
| 5 | Servicios con mayor ingreso | Implementada en `TopServicesChart` (tab secundaria) | Bar horizontal |
| 6 | Gastos por categoria | Implementada en `ExpensesByCategoryChart` | Donut |
| 7 | Salario: pagado vs meta vs pendiente | MetricCard existente, sin grafica dedicada | Barra de progreso |
| 8 | Tendencia diaria de ventas | Implementada en `DailyIncomeTrendChart` | Area chart |
| 9 | Calendario de movimientos por dia | Implementada en `TransactionCalendarPage` | Calendar heatmap |

### Prioridad media (valor anadido post-MVP)

| # | Grafica | Tipo |
|---|---|---|
| 1 | Metodos de pago mas usados | Donut |
| 2 | Ticket promedio mensual | KPI card con mini tendencia |
| 3 | Margen estimado por servicio | Bar horizontal |
| 4 | Vales por categoria personal | Donut o bar horizontal |
| 5 | Gastos fijos vs ingresos mensuales | Line chart |
| 6 | Servicios con mayor ganancia estimada (margen total) | Bar horizontal |

### Prioridad baja o futura (Fase 2+)

| # | Grafica | Tipo |
|---|---|---|
| 1 | Simulador de precios ("si subo X, cuanto ganaria?") | Interactivo |
| 2 | Punto de equilibrio avanzado con proyeccion | Indicador + linea |
| 3 | Proyeccion de salario basado en tendencia | Line chart |
| 4 | Historial de costos de insumos | Line chart |
| 5 | Comparativas anuales (2025 vs 2026) | Bar agrupado |
| 6 | Dias y horas de mayor venta | Heatmap |
| 7 | Estacionalidad mensual | Line chart |

---

## 9. Reglas importantes de interpretacion financiera

### 9.1 No mezclar gastos del negocio con vales personales

- `expense` = dinero que sale del negocio (insumos, arriendo, servicios publicos).
- `personal_voucher` = adelanto del salario de la duena.
- En cualquier grafica o calculo, estos dos tipos deben estar **separados**. Si aparecen juntos en una misma metrica, el codigo esta mal.

### 9.2 No llamar "ganancia neta" a la ganancia por servicio

- `priceAtTime - costAtTime` = **ganancia estimada** o **margen bruto estimado** del servicio.
- La ganancia neta real requiere descontar gastos fijos, gastos variables y salario.
- Si la UI dice "ganancia neta" basada solo en `priceAtTime - costAtTime`, esta mal.

### 9.3 Usar snapshots historicos para reportes

- Las transacciones guardan `priceAtTime`, `costAtTime`, `serviceName` y `categoryName` al momento del registro.
- **Nunca** hacer join con la coleccion `services` para obtener el precio actual y recalcular reportes viejos.
- Si un servicio cambia de precio manana, el reporte de hoy **no debe cambiar**.

### 9.4 Los insumos desactivados no rompen calculos historicos

- `RawMaterial.isActive = false` solo afecta la UI de configuracion.
- Las transacciones `income` guardan `materialsSnapshot` con los costos al momento de la venta.
- Desactivar un insumo no debe alterar reportes pasados.

### 9.5 Consistencia de colores financieros

Usar siempre las variables CSS definidas para cada concepto:

| Concepto | Variable CSS | Uso |
|---|---|---|
| Ventas | `var(--income)` | Barras, lineas, badges de income |
| Gastos | `var(--expense)` | Barras, lineas, badges de expense |
| Pagos a la duena / Salario | `var(--salary)` | Barras, badges de withdrawal |
| Vales personales | `var(--vales)` | Barras, badges de personal_voucher |
| Ganancia / Dinero del negocio | `var(--business)` | Indicadores de flujo neto |
| Advertencia | `var(--warning)` | Alertas, salario pendiente |

Nunca usar colores arbitrarios. Si se necesita un color nuevo, agregarlo como variable CSS y documentarlo.

### 9.6 Los tres conceptos que no se pueden mezclar

| Concepto | Que es | Tipo en Firestore |
|---|---|---|
| Dinero del negocio | Ingresos - gastos operativos | Calculado |
| Salario de la duena | Lo que se paga a si misma | `type: "withdrawal"` |
| Ganancia / Reinversion | Lo que queda despues de gastos Y salario | Calculado |

Cada uno debe tener su propio espacio visual en el dashboard. Nunca agrupar `withdrawal` con `expense`.

---

## 10. Ejemplos de datasets para Recharts

Los ejemplos usan la estructura que Recharts espera. La clave es que cada elemento del array sea un objeto plano con propiedades numericas o string.

Las funciones en `src/shared/utils/dashboardCharts.ts` y `src/shared/utils/financials.ts` ya transforman los datos de Firestore a estos formatos.

### 10.1 Ventas por mes (BarChart)

```ts
// Datos que espera Recharts para un <BarChart> con una sola serie
const ventasPorMes = [
  { month: "Ene 2026", totalIncome: 1200000 },
  { month: "Feb 2026", totalIncome: 1450000 },
  { month: "Mar 2026", totalIncome: 1380000 },
  { month: "Abr 2026", totalIncome: 1600000 },
];

// Uso en Recharts:
// <BarChart data={ventasPorMes}>
//   <XAxis dataKey="month" />
//   <Bar dataKey="totalIncome" fill="var(--income)" />
// </BarChart>
```

### 10.2 Ventas vs gastos por mes (BarChart agrupado)

```ts
const ventasVsGastos = [
  { month: "Ene 2026", income: 1200000, expense: 700000 },
  { month: "Feb 2026", income: 1450000, expense: 820000 },
  { month: "Mar 2026", income: 1380000, expense: 750000 },
];

// Uso en Recharts:
// <BarChart data={ventasVsGastos}>
//   <XAxis dataKey="month" />
//   <Bar dataKey="income" fill="var(--income)" name="Ventas" />
//   <Bar dataKey="expense" fill="var(--expense)" name="Gastos" />
// </BarChart>
```

### 10.3 Servicios mas vendidos (BarChart horizontal)

```ts
const serviciosMasVendidos = [
  { serviceName: "Manicura tradicional", quantity: 18, totalIncome: 540000 },
  { serviceName: "Cepillado",             quantity: 12, totalIncome: 600000 },
  { serviceName: "Pedicura tradicional",  quantity: 10, totalIncome: 450000 },
  { serviceName: "Maquillaje social",     quantity: 5,  totalIncome: 450000 },
];

// Uso en Recharts:
// <BarChart layout="vertical" data={serviciosMasVendidos}>
//   <XAxis type="number" />
//   <YAxis type="category" dataKey="serviceName" />
//   <Bar dataKey="quantity" fill="var(--income)" name="Cantidad" />
// </BarChart>
```

### 10.4 Gastos por categoria (Donut o PieChart)

```ts
const gastosPorCategoria = [
  { categoryName: "Arriendo",            totalExpense: 800000 },
  { categoryName: "Servicios publicos",  totalExpense: 230000 },
  { categoryName: "Insumos",             totalExpense: 450000 },
  { categoryName: "Publicidad",          totalExpense: 120000 },
  { categoryName: "Transporte",          totalExpense: 80000 },
  { categoryName: "Otros",               totalExpense: 60000 },
];

// Uso en Recharts (PieChart):
// <PieChart>
//   <Pie
//     data={gastosPorCategoria}
//     dataKey="totalExpense"
//     nameKey="categoryName"
//     cx="50%"
//     cy="50%"
//     innerRadius={60}
//     outerRadius={80}
//   />
// </PieChart>
```

### 10.5 Salario: pagos directos, vales y pendiente (BarChart stacked o RadialBar)

```ts
const resumenSalario = [
  { label: "Pagado directo",   amount: 500000 },
  { label: "Vales personales", amount: 120000 },
  { label: "Pendiente",        amount: 880000 },
];

// Total: 1500000 (salaryTarget)
// Recibido: 620000 (41%)
// Pendiente: 880000 (59%)
```

### 10.6 Tendencia diaria de ventas (AreaChart)

```ts
const ventasDiarias = [
  { day: "1",  income: 0 },
  { day: "2",  income: 85000 },
  { day: "3",  income: 120000 },
  { day: "4",  income: 0 },
  { day: "5",  income: 200000 },
  // ... uno por cada dia del mes
  { day: "30", income: 0 },
];

// Uso en Recharts:
// <AreaChart data={ventasDiarias}>
//   <XAxis dataKey="day" />
//   <Area dataKey="income" fill="var(--income)" stroke="var(--income)" />
// </AreaChart>
```

### 10.7 Evolucion mensual multicategoria (LineChart)

```ts
const evolucionMensual = [
  { month: "Ene 2026", ventas: 1200000, gastos: 700000, salario: 500000 },
  { month: "Feb 2026", ventas: 1450000, gastos: 820000, salario: 600000 },
  { month: "Mar 2026", ventas: 1380000, gastos: 750000, salario: 450000 },
];

// <LineChart data={evolucionMensual}>
//   <XAxis dataKey="month" />
//   <Line dataKey="ventas" stroke="var(--income)" />
//   <Line dataKey="gastos" stroke="var(--expense)" />
//   <Line dataKey="salario" stroke="var(--salary)" />
// </LineChart>
```

### 10.8 Metodos de pago (PieChart)

```ts
const metodosPago = [
  { method: "Efectivo",      count: 45 },
  { method: "Transferencia", count: 12 },
  { method: "Otro",          count: 3 },
];
```

---

## 11. Helpers recomendados

### 11.1 Funciones existentes (usar directamente)

Todas estan en `src/shared/utils/`. No reimplementarlas.

**`financials.ts`:**
- `getMonthlyIncome`, `getMonthlyExpenses`, `getMonthlyWithdrawals`, `getMonthlyPersonalVouchers` — Totales por mes
- `getTotalFixedExpenses` — Suma de gastos fijos activos
- `getBreakEvenPoint`, `getBreakEvenProgress` — Punto de equilibrio
- `getEstimatedProfit`, `getNetProfit` — Ganancia
- `getOwnerSalaryPending`, `getOwnerTotalReceived`, `getSalaryUsagePercentage` — Salario
- `getDailySuggestedGoal` — Meta diaria
- `getTopServiceBySales`, `getTopServiceByRevenue` — Top servicios
- `getServiceMargin` — Margen de un servicio
- `getExpensesByCategory`, `groupPersonalVouchersByCategory` — Agrupacion por categoria

**`dashboardCharts.ts`:**
- `getWeeklyIncomeExpenseChartData` — Datos para bar chart semanal
- `getExpensesByCategoryChartData` — Datos para donut de gastos
- `getServicesByCountChartData` — Datos para bar de servicios por cantidad
- `getServicesByRevenueChartData` — Datos para bar de servicios por ingreso
- `getDailyIncomeChartData` — Datos para area chart diario

**`calendarTransactions.ts`:**
- `groupTransactionsByDay` — Transacciones agrupadas por dia
- `groupTransactionsByMonth` — Transacciones agrupadas por mes
- `getMonthlyCalendarSummary` — Resumen mensual con dias destacados
- `groupDayTransactionsForDetail` — Detalle de un dia (por servicio/categoria)
- `formatTransactionTime` — Hora formateada de una transaccion
- `getPaymentLabel` — Etiqueta legible de metodo de pago

**`formatCurrency.ts`:**
- `formatCurrency(value)` — Formato `$1.500.000`

**`dates.ts`:**
- `formatDateShort(date)` — `"09 jun 2025"`
- `formatInputDate(date)` — `"2025-06-09"`
- `isInMonth(date, year, month)` — Pertece al mes
- `isToday(date)` — Es hoy

**`rawMaterials.ts`:**
- `calculateServiceEstimatedCost(materials)` — Suma de `totalCost` de insumos

### 11.2 Funciones propuestas para futuras implementaciones

Si se necesitan nuevas transformaciones de datos para graficas, agregarlas como funciones puras en los archivos existentes, no en componentes:

```ts
// Propuesta: groupTransactionsByPaymentMethod
// Retorna: [{ method: "Efectivo", count: 45 }, ...]
// Usar en: Donut de metodos de pago

// Propuesta: getAverageTicket
// Retorna: number
// Usar en: KPI card de ticket promedio

// Propuesta: getMonthlySalarySummary
// Retorna: { paid: number, vouchers: number, pending: number }
// Usar en: Barra de progreso de salario

// Propuesta: groupIncomeByServiceWithMargin
// Retorna: [{ serviceName, count, totalIncome, totalEstimatedProfit, avgMargin }]
// Usar en: Bar horizontal de rentabilidad por servicio
```

---

## 12. Criterios de calidad para futuras graficas

### 12.1 Reglas de diseno

1. **Cada grafica debe responder una pregunta clara.** Si no sabes que pregunta responde, no la implementes.
2. **No agregar graficas decorativas.** Si no ayuda a tomar decisiones, sobra.
3. **Lenguaje simple.** Nada de "margen bruto operativo", "egresos", "flujo de caja". Ver glosario en `AGENTS.md`.
4. **Mobile-first estricto.** Disenar para 390px de ancho. Sin scroll horizontal. Maximo 4-6 puntos visibles.
5. **Pesos colombianos.** Usar `formatCurrency` de `src/shared/utils/formatCurrency.ts`. Nunca hardcodear formato.
6. **Fechas con `date-fns`.** Usar helpers de `src/shared/utils/dates.ts`. Nunca `moment.js` ni `dayjs`.
7. **Etiquetas cortas.** `"Sem 1"`, `"Ene"`, `"Manicura"`. Nada de `"Semana del 1 al 7 de junio de 2026"`.
8. **Sin jerga en tooltips.** Si aparece "margen bruto", reemplazar por "lo que te deja el servicio".

### 12.2 Estados y casos borde

9. **Empty state con mensaje y accion.** Si no hay datos, mostrar texto explicativo y boton para registrar.
10. **Skeleton loading.** Mientras carga, mostrar skeleton con la forma de la grafica. No un spinner.
11. **Manejar `null`.** Si una funcion retorna `null` (ej. `getBreakEvenPoint`), mostrar mensaje educativo.
12. **Sin datos parciales.** No mostrar una grafica con un solo punto o una sola categoria.

### 12.3 Colores y consistencia

13. **Usar variables CSS de tono financiero.** `var(--income)`, `var(--expense)`, `var(--salary)`, `var(--vales)`, `var(--business)`, `var(--warning)`.
14. **No hardcodear colores** en componentes de grafica. Usar las variables definidas en el tema.
15. **Consistencia entre graficas.** El color de "ventas" es el mismo en el bar chart, el line chart y el calendario.

### 12.4 Performance y datos

16. **Una sola responsabilidad.** Cada funcion de transformacion hace una cosa. No mezclar filtrado, agrupacion y formateo.
17. **Funciones puras.** Las transformaciones de datos no deben tener side effects ni depender de Firebase.
18. **No recalcular en el render.** Usar `useMemo` para datos derivados. Las funciones de `financials.ts` ya son puras.
19. **Testear las transformaciones.** Cada funcion nueva en `financials.ts` o `dashboardCharts.ts` debe tener tests unitarios.

---

## Referencias

- `AGENTS.md` — Reglas de negocio, glosario, estandar de UI.
- `src/shared/utils/financials.ts` — Todos los calculos financieros.
- `src/shared/utils/dashboardCharts.ts` — Transformaciones de datos para Recharts.
- `src/shared/utils/calendarTransactions.ts` — Agrupacion de transacciones por dia/mes.
- `src/shared/utils/formatCurrency.ts` — Formateo de moneda COP.
- `src/shared/utils/dates.ts` — Helpers de fecha con locale es-CO.
- `src/shared/utils/rawMaterials.ts` — Calculos de insumos y costos.
- `src/shared/types/domain.ts` — Tipos TypeScript de todas las entidades.
- `src/shared/data/SpaDataContext.tsx` — Estado global y operaciones CRUD.
- `docs/reports/dashboard-chart-suggestions.md` — Sugerencias originales de graficas para el dashboard.
