# AGENTS.md — Spa Control

Guía de referencia para agentes de IA (Claude, Cursor, Copilot, etc.) que trabajen en este proyecto.
Lee este archivo completo antes de tocar cualquier código.

---

## Qué es este proyecto

**Spa Control** es una app web privada de control financiero para una dueña de spa unipersonal en Colombia.

- No es un SaaS. No es un sistema contable. No es una app de facturación.
- La usuaria es una sola persona, no técnica, de 43 años, que usa principalmente el celular.
- El objetivo es reemplazar un cuaderno físico con algo más rápido, más claro y más útil.
- El plan de desarrollo activo está en `docs/spa_control_plan_desarrollo.md`.
- La planeación de producto disponible en este workspace está en `docs/spa_control_planeacion.pdf`.

---

## Stack tecnológico

| Capa | Tecnología | Notas |
|---|---|---|
| Framework | Vite + React + TypeScript | SPA privada, sin SSR |
| Auth | Firebase Auth | Correo + contraseña |
| Base de datos | Firestore (NoSQL) | Tiempo real, sin backend propio |
| Hosting | Firebase Hosting | Deploy con `firebase deploy` |
| UI | HeroUI | Componentes accesibles, mobile-first |
| Formularios | React Hook Form + Zod | Sin excepciones |
| Gráficas | ApexCharts | Graficas simples, mobile-first, sin scroll horizontal |
| Fechas | date-fns | Locale `es`. No usar moment.js ni dayjs |
| Estado global | React Context + useState | Sin Redux ni Zustand en MVP |
| Cloud Functions | Solo si es estrictamente necesario | Ver regla abajo |

---

## Comandos del proyecto

El proyecto usa Bun como gestor de paquetes y runtime de scripts.

```text
bun run dev
bun run build
bun run test
bun run test:watch
```

No hay comando de lint configurado todavía.

---

## Estructura de carpetas

```
src/
├── app/                  # Rutas, providers globales (AuthProvider, BusinessProvider)
├── features/
│   ├── auth/             # Login, onboarding
│   ├── dashboard/        # Dashboard diario y mensual
│   ├── transactions/     # Registro y historial de ventas, gastos, retiros
│   ├── services/         # Catálogo de servicios
│   ├── expenses/         # Gastos fijos mensuales
│   ├── withdrawals/      # Retiros / pagos a la dueña
│   └── settings/         # Configuración general y financiera
├── shared/
│   ├── components/       # Componentes reutilizables (FAB, EducationalDrawer, etc.)
│   ├── hooks/            # useAuth, useBusiness, useTransactions, useDashboardStats
│   ├── lib/              # firebase.ts (instancias de app, auth, db)
│   ├── utils/
│   │   ├── financials.ts # TODOS los cálculos financieros. Ver sección de cálculos.
│   │   ├── currency.ts   # Formateo COP
│   │   └── dates.ts      # Helpers de date-fns con locale es
│   └── types/            # Un archivo por colección de Firestore
└── config/               # Variables de entorno, constantes de la app
```

Nunca pongas lógica de negocio dentro de un componente React. Va en `utils/` o en un hook.

---

## Modelo de datos (Firestore)

Ruta base de todos los datos: `users/{userId}/businesses/{businessId}/`

### Colecciones bajo `businesses/{businessId}/`

```
services/          → Catálogo de servicios
transactions/      → Ventas, gastos y retiros (type: 'income' | 'expense' | 'withdrawal')
fixedExpenses/     → Gastos fijos mensuales configurados
categories/        → Categorías de gasto
financialSettings/ → Salario objetivo de la dueña (documento único: 'main')
```

### Tipos TypeScript (resumen)

```ts
// src/shared/types/transaction.ts
interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'withdrawal';
  amount: number;                        // Siempre positivo, en COP
  date: Timestamp;
  paymentMethod: 'cash' | 'transfer' | 'other';
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Solo para type === 'income'
  serviceId?: string;
  serviceName?: string;                  // Snapshot del nombre al momento del registro
  priceAtTime?: number;                  // Precio cobrado (puede diferir del defaultPrice)
  costAtTime?: number;                   // Costo estimado al momento del registro

  // Solo para type === 'expense'
  categoryId?: string;
  categoryName?: string;                 // Snapshot del nombre al momento del registro
  expenseType?: 'fixed' | 'variable' | 'extraordinary';
}

// src/shared/types/service.ts
interface Service {
  id: string;
  name: string;
  defaultPrice: number;
  estimatedCost: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Regla crítica de snapshots:** Cuando se registra una transacción, siempre guarda `serviceName`, `priceAtTime`, `costAtTime`, `categoryName` directamente en el documento. Nunca hagas joins en tiempo de lectura para reconstruir datos históricos. Si el servicio cambia de precio mañana, el reporte de hoy no debe cambiar.

---

## Cálculos financieros (`src/shared/utils/financials.ts`)

Todos los cálculos viven aquí. Este archivo debe ser puro (sin side effects, sin Firebase).
Cada función debe ser testeable de forma aislada.

```ts
// Firmas esperadas (implementar con esta interfaz)

getMonthlyIncome(transactions: Transaction[], year: number, month: number): number
getMonthlyExpenses(transactions: Transaction[], year: number, month: number): number
getMonthlyWithdrawals(transactions: Transaction[], year: number, month: number): number

getTotalFixedExpenses(fixedExpenses: FixedExpense[]): number

getBreakEvenPoint(fixedExpenses: FixedExpense[], transactions: Transaction[]): number
// Fórmula: gastosFijos / (1 - (costoVariablePromedio / precioPromedioServicio))
// Si no hay transacciones suficientes para calcular el promedio, retorna null.

getBreakEvenProgress(monthlyIncome: number, breakEven: number): number
// Retorna porcentaje (0-100+). Puede superar 100 si se superó el PE.

getEstimatedProfit(monthlyIncome: number, monthlyExpenses: number): number
// Ganancia antes de salario de la dueña

getNetProfit(monthlyIncome: number, monthlyExpenses: number, monthlyWithdrawals: number): number
// Ganancia después de salario (puede ser negativa)

getOwnerSalaryPending(salaryTarget: number, monthlyWithdrawals: number): number
// Cuánto le falta por pagarse. Puede ser negativo si se pagó más del objetivo.

getDailySuggestedGoal(breakEven: number, workingDaysInMonth: number): number

getTopServiceBySales(transactions: Transaction[]): { serviceId: string; serviceName: string; count: number } | null
getTopServiceByRevenue(transactions: Transaction[]): { serviceId: string; serviceName: string; total: number } | null

getServiceMargin(service: Service): number
// ((defaultPrice - estimatedCost) / defaultPrice) * 100

getExpensesByCategory(transactions: Transaction[]): { categoryId: string; categoryName: string; total: number }[]
```

---

## Reglas de UI que nunca se rompen

1. **Flujo de registro ≤ 20 segundos.** Si un formulario tiene más de 5 campos visibles en móvil, está mal diseñado.
2. **FAB siempre visible.** El botón flotante de acciones rápidas nunca se oculta durante el scroll.
3. **Teclado numérico automático.** Todo campo de monto usa `inputMode="numeric"` o `type="number"`.
4. **Sin jerga contable.** Si el texto dice "egresos", "causación", "margen bruto" o "flujo operativo" sin explicación, está mal. Ver glosario abajo.
5. **Drawer desde abajo para educación.** Las tarjetas explicativas de conceptos financieros se muestran en un bottom sheet, nunca en una página nueva.
6. **Toast para confirmaciones.** Las acciones exitosas se confirman con un toast de 3 segundos, no con un modal.
7. **Dialog para eliminar.** Cualquier eliminación requiere un dialog de confirmación con opción de cancelar.
8. **Estado vacío en toda pantalla.** Ninguna pantalla puede quedar con una lista vacía sin texto explicativo y botón de acción.
9. **Mobile-first estricto.** Diseñar primero para 390px de ancho. Desktop es mejora progresiva.
10. **Skeleton loading.** Mientras Firestore carga, mostrar skeletons con la forma de las cards. Nunca un spinner genérico.

---

## Los tres conceptos financieros que no se pueden mezclar

El error más grave que puede cometer este sistema es mezclar estos tres conceptos:

| Concepto | Qué es | Tipo en Firestore |
|---|---|---|
| **Dinero del negocio** | Ingresos menos gastos operativos del spa | Calculado: `income - expense` |
| **Salario de la dueña** | Lo que se paga a sí misma | `type: 'withdrawal'` |
| **Ganancia / Reinversión** | Lo que queda después de gastos Y salario | Calculado: `income - expense - withdrawal` |

Los retiros (`withdrawal`) **nunca** deben sumarse a los gastos del negocio (`expense`) en ningún cálculo. Son categorías separadas con propósitos distintos.

El dashboard debe mostrar los tres en cards visuales distintas y con colores distintos. Si el agente genera código que agrupa `withdrawal` con `expense` en cualquier cálculo, ese código está incorrecto.

---

## Glosario (lenguaje permitido en la UI)

| ❌ No usar | ✅ Usar en su lugar |
|---|---|
| Egresos | Gastos |
| Ingresos operacionales | Ventas / Lo que vendiste |
| Margen bruto | Lo que te deja el servicio |
| Punto de equilibrio | Meta mínima para no perder plata |
| Utilidad neta | Lo que te quedó / Ganancia |
| Flujo de caja | Cómo va el dinero en el mes |
| Causación | No aplica en el MVP |
| Retiro del socio | Pagarme / Mi salario |
| Estado de resultados | Cómo vas este mes |
| Período contable | Mes |

---

## Seguridad (Firestore Rules)

La regla base es: un usuario solo puede leer y escribir documentos bajo su propio `userId`.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Validaciones adicionales que van en las rules:
- `amount` debe ser un número mayor a 0.
- `type` debe ser uno de `['income', 'expense', 'withdrawal']`.
- `expenseType` (si presente) debe ser uno de `['fixed', 'variable', 'extraordinary']`.
- `paymentMethod` debe ser uno de `['cash', 'transfer', 'other']`.

Validaciones que van en el frontend (Zod):
- Todos los campos requeridos presentes.
- Fechas no en el futuro lejano (advertencia, no bloqueo).
- Montos con máximo 2 decimales.
- Nombres de servicio y categoría no vacíos ni solo espacios.

**Cloud Functions:** No usar en MVP a menos que se necesite lógica que no puede vivir en el cliente ni en Firestore Rules. Si estás a punto de crear una Cloud Function, pregunta primero si puede resolverse de otra forma.

---

## Validaciones y casos borde conocidos

| Caso | Comportamiento correcto |
|---|---|
| Monto = 0 o negativo | Error inline: "El valor debe ser mayor a $0" |
| Servicio sin precio | Bloquear registro. Link a configuración. |
| Servicio eliminado con ventas históricas | Marcar `isActive: false`. Nunca borrar. El historial usa `serviceName` snapshot. |
| Retiro > dinero disponible | Advertencia visible, no bloqueo. La usuaria decide. |
| Eliminar transacción | Dialog de confirmación + toast con opción deshacer (5 seg). |
| Posible duplicado (mismo monto, mismo día) | Advertencia, no bloqueo. |
| Sin datos para calcular PE | No mostrar el indicador. Mostrar: "Configura tus gastos fijos para ver esta métrica." |
| Sin conexión | Banner de conexión perdida. Reintentar automáticamente. |
| Error de carga de Firestore | Skeleton → mensaje de error → botón "Reintentar". |
| Precio de servicio cambia a mitad de mes | Las transacciones ya registradas conservan `priceAtTime`. No recalcular. |

---

## Formateo de moneda y fechas

```ts
// src/shared/utils/currency.ts
export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
// Resultado: $1.500.000

// src/shared/utils/dates.ts
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatDateShort(date: Date): string {
  return format(date, 'dd MMM yyyy', { locale: es });
}
// Resultado: "09 jun. 2025"
```

Nunca hardcodear strings de formato de fecha en componentes. Usar siempre las funciones de `dates.ts`.

---

## Estados vacíos requeridos

Cada pantalla con lista o datos cargados debe tener un empty state. Textos oficiales:

| Pantalla / situación | Texto del empty state |
|---|---|
| Sin ventas hoy | "Hoy todavía no hay ventas registradas. ¡Empieza cuando quieras!" |
| Sin gastos este mes | "No has registrado gastos este mes. ¡Eso es buena señal!" |
| Sin servicios configurados | "Aún no has configurado tus servicios. Es el primer paso." |
| Sin salario objetivo | "¿Cuánto quieres ganarte al mes? Configúralo y te ayudamos a lograrlo." |
| Sin datos para punto de equilibrio | "Configura tus gastos fijos para ver cuánto necesitas vender cada mes." |
| Mes nuevo sin movimientos | "¡Bienvenida a un nuevo mes! Empieza registrando tu primera venta." |
| Error al cargar datos | "Algo salió mal. Intenta de nuevo en un momento." |

---

## Mensajes de confirmación (toasts)

| Acción | Mensaje del toast |
|---|---|
| Venta registrada | "¡Listo! {serviceName} por {amount} quedó registrada." |
| Gasto registrado | "Gasto de {amount} en {categoryName} registrado." |
| Retiro registrado | "¡Te pagaste {amount}! Ya llevas {totalWithdrawals} de tu meta mensual." |
| Movimiento eliminado | "Movimiento eliminado. ¿Fue un error? Puedes volver a registrarlo." |
| Configuración guardada | "Cambios guardados correctamente." |

---

## Orden de implementación

Seguir este orden estrictamente. No empezar una etapa si la anterior no tiene el criterio de salida cumplido.

| # | Etapa | Criterio de salida |
|---|---|---|
| 1 | Setup del proyecto | App corre en local sin errores. Estructura de carpetas creada. |
| 2 | Firebase Auth | Login funciona. Rutas protegidas. Sesión persiste. |
| 3 | Tipos y modelo de datos | Tipos TS definidos. Funciones CRUD base de Firestore escritas. |
| 4 | Onboarding | Flujo completo guarda datos en Firestore. |
| 5 | Servicios | CRUD de servicios funciona. Se pueden crear, editar y desactivar. |
| 6 | Categorías y gastos fijos | CRUD completo. Total mensual de fijos es visible. |
| 7 | Configuración financiera | Salario objetivo guardado y legible. |
| 8 | Registro de ventas | Flujo completo en ≤ 20 segundos. |
| 9 | Registro de gastos | Flujo completo en ≤ 20 segundos. |
| 10 | Registro de retiros | Formulario funciona. Advertencia si supera disponible. |
| 11 | Cálculos financieros | `financials.ts` con todas las funciones. Tests unitarios pasando. |
| 12 | Dashboard | Todos los indicadores muestran datos reales correctamente. |
| 13 | Historial | Lista con filtros. Edición y eliminación con confirmación. |
| 14 | Tarjetas educativas | Cada indicador tiene su drawer de ayuda. |
| 15 | Validaciones y pulido | Edge cases cubiertos. Flujos probados en celular real. |
| 16 | Prueba con usuaria | La dueña registra ventas y lee el dashboard sin ayuda externa. |

---

## Lo que está explícitamente fuera del MVP

No implementar. No preguntar si "podría entrar". No agregar ni sugerir:

- Agenda de citas
- Integración con WhatsApp
- Facturación electrónica (DIAN)
- Reportes tributarios
- Inventario de insumos
- Gestión de clientes
- Multiusuario
- Múltiples sedes
- Integraciones bancarias
- App nativa iOS/Android
- Contabilidad de partida doble
- Exportación a Excel/PDF (va en Fase 2)

Si el usuario solicita alguna de estas funcionalidades, recordarle que está en el roadmap de fases posteriores y redirigir al MVP.

---

## Métricas de éxito

El MVP está terminado cuando:

- [ ] Registrar una venta toma menos de 20 segundos desde el dashboard.
- [ ] Registrar un gasto toma menos de 20 segundos desde el dashboard.
- [ ] La dueña puede responder "¿cuánto gané este mes?" sin ayuda.
- [ ] La dueña distingue dinero del negocio, salario y ganancia para reinversión.
- [ ] La dueña dejó de usar el cuaderno para el registro diario.
- [ ] El dashboard se consulta más de 3 veces por semana.
- [ ] Todos los estados vacíos tienen mensaje y acción.
- [ ] No hay texto con jerga contable sin explicación en la UI.
- [ ] Las Firestore Rules impiden que un usuario lea datos de otro.
- [ ] Los cálculos en `financials.ts` tienen tests unitarios.

---

*Este archivo debe mantenerse actualizado si cambia el stack, el modelo de datos o las reglas de negocio.*
*Versión: 1.0 · Junio 2025*
