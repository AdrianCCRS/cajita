# Spa Control — Documento de Planeación del Producto

> App Web de Control Financiero para Spa Unipersonal en Colombia
> Versión 1.0 · Junio 2025

---

## 1. Resumen del Producto

**Spa Control** es una aplicación web privada de control financiero diseñada exclusivamente para una dueña de spa que trabaja sola en Colombia. No es un SaaS, no es un sistema contable empresarial y no es una app de facturación. Es una herramienta personal, simple y confiable que reemplaza el cuaderno físico de ingresos y gastos.

### ¿Qué se va a construir?

Una app web responsive (mobile-first) que permite a la dueña registrar ventas, gastos y retiros desde su celular en menos de 20 segundos, y que le muestra de forma clara cómo está yendo su negocio día a día y mes a mes.

### ¿Para quién?

Una mujer de 43 años, dueña y operadora de un spa unipersonal en Colombia. Presta servicios de manicura, pedicura, cabello, maquillaje y similares. Actualmente lleva sus cuentas en un cuaderno. No es muy tecnológica, pero usa el celular a diario. Toma todas las decisiones del negocio sola.

### ¿Cuál es el problema principal?

La dueña no tiene visibilidad clara de sus finanzas. No sabe con exactitud cuánto gana, cuánto gasta, si el negocio puede pagarle un salario, cuánto queda para reinvertir, ni cuándo llega al punto de equilibrio. El cuaderno es lento, poco confiable y no le permite analizar su negocio.

### ¿Cuál es la propuesta de valor?

- Reemplazar el cuaderno con una herramienta digital más rápida y confiable.
- Dar claridad financiera sin usar jerga contable.
- Separar con claridad el dinero del negocio, el salario de la dueña y la ganancia para reinversión.
- Ayudarle a responder preguntas clave: ¿cuánto vendí?, ¿cuánto gasté?, ¿cuánto me quedó?, ¿puedo pagarme mi salario?, ¿qué servicios me generan más dinero?
- Ser tan rápida y fácil que registrar una venta sea más sencillo que escribir en el cuaderno.

---

## 2. Principios de Diseño

Estos principios guían todas las decisiones de diseño, producto y desarrollo del MVP.

| Principio | Descripción | Aplicado al Spa |
|---|---|---|
| Menos campos, más claridad | Cada pantalla tiene solo los campos necesarios. Sin información decorativa. | Registrar venta: servicio + valor + método de pago. Nada más. |
| Lenguaje cotidiano | Nada de jerga contable. Términos que cualquier persona entiende. | "Cuánto te quedó este mes" en vez de "utilidad neta del período". |
| Mostrar decisiones, no solo números | Cada número debe responder una pregunta útil. | "Aún te faltan $800.000 para cubrir tus gastos fijos del mes." |
| Registrar es más fácil que el cuaderno | El flujo de registro debe ser más rápido que escribir a mano. | Máximo 4 toques para registrar una venta desde el dashboard. |
| Lo importante primero | Los indicadores más críticos están arriba y son grandes. | El dashboard empieza con ventas del día y avance al punto de equilibrio. |
| Sin métricas inútiles | No se muestra nada que la usuaria no pueda usar para decidir. | No se muestran métricas de análisis avanzado en el MVP. |
| Mobile-first siempre | La app se diseña primero para pantalla de celular. | Botones grandes, texto legible, scroll vertical natural. |
| Amigable ante el error | Los errores se explican en lenguaje simple con acción sugerida. | "Parece que olvidaste el valor. ¿Cuánto cobraste por este servicio?" |
| Estados vacíos útiles | Las pantallas vacías explican qué hacer, no solo que no hay datos. | "Aún no has registrado ventas hoy. ¡Toca el botón para empezar!" |
| Confirmaciones claras | Cada acción importante tiene confirmación simple y positiva. | "¡Listo! Tu venta de manicura por $35.000 quedó registrada." |

---

## 3. Alcance del MVP

### ✅ Qué entra en el MVP

- Login con Firebase Auth (correo + contraseña).
- Onboarding inicial guiado (configuración del negocio en el primer acceso).
- Configuración del negocio: nombre, moneda COP.
- Configuración de servicios y precios.
- Configuración de costos aproximados por servicio.
- Configuración de gastos fijos mensuales.
- Configuración de salario mensual deseado de la dueña.
- Configuración de categorías de gasto.
- Registro rápido de ventas (≤ 20 segundos).
- Registro rápido de gastos (≤ 20 segundos).
- Registro de retiros o pagos a la dueña.
- Dashboard diario: ventas del día, gastos del día.
- Dashboard mensual: ventas, gastos, ganancia estimada, punto de equilibrio, salario.
- Cálculo del punto de equilibrio mensual.
- Cálculo de ganancia estimada.
- Separación clara: dinero del negocio / salario de la dueña / ganancia para reinversión.
- Historial de movimientos con filtros básicos.
- Edición y eliminación de movimientos con confirmación.
- Tarjetas explicativas de conceptos financieros.
- Configuración básica (editar servicios, gastos fijos, salario).

### ❌ Qué queda fuera del MVP

| Fuera del MVP | Razón |
|---|---|
| Agenda de citas | Fase 3. Requiere integración con WhatsApp Business. |
| WhatsApp Business | Fase 3. Complejidad de integración no justificada en MVP. |
| Automatización de citas | Fase 3. Depende de agenda y WhatsApp. |
| Facturación electrónica | No es objetivo del MVP ni del negocio actual. |
| Reportes tributarios | Fase 4. Requiere contador y reglas fiscales. |
| Inventario avanzado de insumos | Fase 2. No bloquea el control financiero básico. |
| Gestión avanzada de clientes | Fase 2–3. No es necesario para el MVP. |
| Nómina | No aplica (negocio unipersonal). |
| Multiusuario | No aplica para el alcance actual. |
| Múltiples sedes | No aplica para el alcance actual. |
| Integraciones bancarias | Fase 4. Alta complejidad, bajo beneficio en MVP. |
| Contabilidad de partida doble | Fuera del alcance del producto. |
| App móvil nativa (iOS/Android) | Se considera PWA como mejora futura opcional. |
| Exportación a Excel/PDF | Fase 2. |
| Comparación mes a mes | Fase 2. |

---

## 4. Roadmap Posterior al MVP

### Fase 2 · Control Avanzado

- Inventario simple de insumos básicos.
- Gestión básica de clientes (nombre, historial de servicios).
- Reportes más detallados por servicio y período.
- Exportación de datos a Excel y PDF.
- Comparación de ingresos y gastos mes a mes.
- Alertas automáticas de gastos altos.
- Alertas de bajo rendimiento vs. punto de equilibrio.
- Mejoras UX basadas en uso real del MVP.

### Fase 3 · Agenda y Automatización

- Agenda de citas integrada en la app.
- Integración con WhatsApp Business API para confirmación de citas.
- Agente conversacional para agendamiento automático.
- Recordatorios automáticos de citas a clientes.
- Confirmación de citas por WhatsApp.
- Historial completo de clientes con preferencias y estadísticas.

### Fase 4 · Formalización e Integraciones

- Reportes para contador (formato adaptado a normativa colombiana).
- Facturación formal si el negocio lo requiere (DIAN).
- Integraciones externas según necesidades reales.
- Posibles reglas fiscales avanzadas (retenciones, IVA, etc.).
- Posible PWA offline-first si hay problemas de conectividad.
- Integraciones con métodos de pago o bancos si se justifican.

---

## 5. Flujos Principales de Usuario

### A. Configuración Inicial (Onboarding)

1. Crear cuenta o iniciar sesión con correo y contraseña (Firebase Auth).
2. Bienvenida: pantalla amigable que explica para qué sirve la app.
3. Registrar nombre del negocio (ej: "Spa Bella").
4. Confirmar moneda: COP (predeterminado, no editable en MVP).
5. Configurar servicios iniciales: nombre, precio de venta, costo aproximado.
6. Configurar gastos fijos mensuales: arriendo, servicios, publicidad, etc.
7. Configurar salario mensual deseado de la dueña.
8. Configurar categorías de gasto adicionales (opcional).
9. Pantalla de resumen: confirmar configuración.
10. Llegar al dashboard inicial con estado vacío amigable.

> **Criterio de salida:** La usuaria puede acceder al dashboard y tiene al menos 1 servicio y los gastos fijos configurados.

### B. Registrar una Venta

1. Tocar botón flotante principal "+ Registrar" o acceso directo "Venta".
2. Seleccionar servicio del listado (ordenado por frecuencia de uso).
3. Ver precio sugerido del servicio.
4. Editar valor si fue diferente al precio estándar (campo numérico simple).
5. Elegir método de pago: efectivo, transferencia, otro.
6. Confirmar fecha (por defecto: hoy).
7. Agregar nota opcional (campo de texto corto).
8. Tocar "Guardar".
9. Ver confirmación: "¡Listo! Manicura por $35.000 registrada."
10. Dashboard se actualiza automáticamente.

> **Criterio de éxito:** Flujo completo en menos de 20 segundos desde el dashboard.

### C. Registrar un Gasto

1. Tocar botón "+ Registrar" → opción "Gasto".
2. Elegir categoría del gasto (lista de categorías configuradas).
3. Ingresar valor del gasto.
4. Elegir tipo: Fijo, Variable o Extraordinario.
5. Elegir método de pago.
6. Confirmar fecha (por defecto: hoy).
7. Agregar nota opcional.
8. Tocar "Guardar".
9. Ver confirmación: "Gasto de $15.000 en insumos registrado."
10. Dashboard se actualiza.

### D. Registrar Salario o Retiro de la Dueña

1. Tocar botón "+ Registrar" → opción "Pagarme".
2. Ingresar valor del retiro.
3. Confirmar fecha.
4. Agregar nota opcional (ej: "Salario semana 1").
5. Tocar "Guardar".
6. Si el retiro supera el dinero disponible: mostrar advertencia (no bloquear).
7. Ver confirmación con indicador: "Ya te has pagado $X de tu salario objetivo de $Y."
8. Dashboard actualiza: dinero del negocio, salario pagado, ganancia disponible.

### E. Revisar el Dashboard

1. Ver tarjeta de ventas del día y del mes.
2. Ver barra de avance: cuánto falta para el punto de equilibrio.
3. Ver dinero del negocio disponible.
4. Ver cuánto se ha pagado de salario vs. salario objetivo.
5. Ver ganancia estimada para reinversión.
6. Ver principales categorías de gasto.
7. Ver servicio más vendido y más rentable del mes.

### F. Consultar Historial

1. Acceder a sección "Historial" desde la navegación principal.
2. Ver lista de movimientos ordenados por fecha (más reciente primero).
3. Filtrar por tipo: ventas / gastos / retiros.
4. Filtrar por categoría o servicio.
5. Tocar un movimiento para ver detalle completo.
6. Editar un movimiento existente.
7. Eliminar con confirmación: "¿Segura que quieres eliminar esta venta de $35.000?"

### G. Ver Explicación de Concepto Financiero

1. Tocar ícono de información (ⓘ) junto a cualquier indicador del dashboard.
2. Aparece un drawer o modal desde abajo (mobile-friendly).
3. Leer definición simple del concepto.
4. Ver ejemplo aplicado al spa.
5. Ver qué decisión ayuda a tomar.
6. Cerrar con deslizamiento hacia abajo o toque en X.

---

## 6. Pantallas Necesarias

| Pantalla | Objetivo | Componentes Principales | Consideraciones Mobile |
|---|---|---|---|
| Login | Autenticar a la usuaria | Logo, campo email, campo contraseña, botón ingresar, enlace recuperar contraseña | Teclado no debe tapar el botón de ingreso. Fuente mínima 16px. |
| Onboarding | Configurar el negocio por primera vez | Pasos guiados (stepper), inputs de texto y número, lista editable de servicios y gastos | Un paso visible a la vez. Botones Anterior/Siguiente grandes. Barra de progreso simple. |
| Home / Dashboard | Ver estado general del negocio | Cards de indicadores, barra de progreso PE, gráfico simple ingresos vs gastos, accesos rápidos | Cards apiladas verticalmente. Números grandes. Scroll natural. FAB siempre visible. |
| Registrar Venta | Capturar un ingreso rápidamente | Selector de servicio, campo valor, selector método de pago, campo fecha, nota opcional | Selector de servicio como chips o lista. Campo numérico con teclado numérico directo. |
| Registrar Gasto | Capturar un gasto rápidamente | Selector categoría, campo valor, selector tipo (fijo/variable/extra), método de pago, fecha, nota | Misma estructura que venta. Categorías como chips o selector simple. |
| Registrar Retiro | Registrar pago a la dueña | Campo valor, fecha, nota opcional, indicador salario objetivo vs pagado | Mostrar advertencia visible si supera el disponible. |
| Historial | Ver todos los movimientos | Lista de movimientos, filtros (chips), buscador opcional, tarjetas de movimiento | Lista de scroll infinito o paginado. Swipe para eliminar (con confirmación). |
| Detalle Movimiento | Ver y editar un movimiento | Todos los campos del movimiento, botones editar y eliminar | Botones en la parte inferior de la pantalla. |
| Servicios | Gestionar catálogo de servicios | Lista de servicios, botón agregar, edición inline o modal | Lista simple con chips de precio. Edición en modal desde abajo. |
| Gastos Fijos | Gestionar gastos fijos mensuales | Lista de gastos fijos, botón agregar, total mensual visible | Misma estructura que servicios. |
| Salario de la Dueña | Configurar salario objetivo | Campo salario mensual deseado, historial de retiros del mes, indicador pagado vs pendiente | Card con número grande del salario objetivo. |
| Configuración Financiera | Ajustar parámetros del negocio | Secciones para servicios, gastos fijos, salario, categorías | Menú con secciones colapsables. |
| Ayuda / Conceptos | Educar sobre finanzas | Lista de conceptos con íconos, drawer de detalle al tocar cada uno | Drawer desde abajo con scroll interno. |
| Configuración General | Ajustes de la cuenta | Nombre del negocio, correo, cambiar contraseña, cerrar sesión | Sencilla, pocas opciones. |

---

## 7. Navegación Recomendada

Navegación tipo **bottom navigation** con 4 ítems principales y un botón flotante (FAB) para acciones rápidas.

| Ítem | Ícono sugerido | Secciones accesibles |
|---|---|---|
| Inicio | 🏠 Casa | Dashboard diario, Dashboard mensual |
| Historial | 📋 Lista | Todos los movimientos, filtros, detalle |
| Servicios | ✂️ Tijeras / Estrella | Catálogo de servicios, precios, costos |
| Configuración | ⚙️ Engranaje | Gastos fijos, salario, categorías, cuenta |

### Botón Flotante (FAB)

Siempre visible en la esquina inferior derecha. Al tocarlo, expande 3 opciones:

- 💰 Registrar venta
- 🧾 Registrar gasto
- 💳 Pagarme (retiro)

> El FAB debe estar siempre visible, incluso durante el scroll, para garantizar acceso rápido desde cualquier parte de la app.

---

## 8. Modelo de Datos en Firestore

Todas las colecciones se anidan bajo el documento del usuario en Firestore para garantizar aislamiento de datos por usuaria.

### Estructura General

```
users/{userId}/
  businesses/{businessId}/
    services/
    transactions/
    fixedExpenses/
    categories/
    financialSettings/
```

### Colección: `users`

| Campo | Tipo | Descripción | Ejemplo |
|---|---|---|---|
| uid | string | ID de Firebase Auth (igual al documento ID) | abc123xyz |
| email | string | Correo electrónico | duena@spa.com |
| displayName | string | Nombre de la usuaria | María González |
| createdAt | timestamp | Fecha de registro | 2025-06-01T10:00:00Z |
| onboardingCompleted | boolean | Si completó el onboarding | true |
| currentBusinessId | string | ID del negocio activo | spa_bella_001 |

### Colección: `businesses`

| Campo | Tipo | Descripción | Ejemplo |
|---|---|---|---|
| id | string | ID generado por Firestore | spa_bella_001 |
| name | string | Nombre del negocio | Spa Bella |
| currency | string | Moneda (fija COP en MVP) | COP |
| ownerId | string | UID de la usuaria | abc123xyz |
| createdAt | timestamp | Fecha de creación | 2025-06-01 |
| updatedAt | timestamp | Última modificación | 2025-06-10 |

### Colección: `services`

| Campo | Tipo | Descripción | Ejemplo |
|---|---|---|---|
| id | string | ID del servicio | svc_manicure_001 |
| name | string | Nombre del servicio | Manicura tradicional |
| defaultPrice | number | Precio de venta actual (COP) | 35000 |
| estimatedCost | number | Costo aproximado de insumos | 5000 |
| isActive | boolean | Si está disponible para registrar | true |
| createdAt | timestamp | Fecha de creación | 2025-06-01 |
| updatedAt | timestamp | Última modificación | 2025-06-01 |

> **IMPORTANTE:** Cuando se registra una venta, se guarda el precio cobrado en la transacción (`priceAtTime`). Si el precio del servicio cambia luego, los reportes históricos no se alteran.

### Colección: `transactions`

| Campo | Tipo | Descripción | Ejemplo |
|---|---|---|---|
| id | string | ID de la transacción | txn_20250601_001 |
| type | string | `'income'` \| `'expense'` \| `'withdrawal'` | income |
| amount | number | Valor en COP | 35000 |
| date | timestamp | Fecha de la transacción | 2025-06-01 |
| serviceId | string \| null | ID del servicio (solo ingresos) | svc_manicure_001 |
| serviceName | string \| null | Nombre del servicio al momento del registro | Manicura tradicional |
| priceAtTime | number \| null | Precio cobrado (puede diferir del estándar) | 35000 |
| costAtTime | number \| null | Costo estimado del servicio al momento | 5000 |
| categoryId | string \| null | ID de categoría (solo gastos) | cat_insumos |
| categoryName | string \| null | Nombre de categoría al momento | Insumos |
| expenseType | string \| null | `'fixed'` \| `'variable'` \| `'extraordinary'` | variable |
| paymentMethod | string | `'cash'` \| `'transfer'` \| `'other'` | cash |
| notes | string \| null | Nota opcional | Cliente habitual |
| createdAt | timestamp | Fecha de registro en el sistema | 2025-06-01T14:30:00Z |
| updatedAt | timestamp | Última edición | 2025-06-01T14:35:00Z |

### Colección: `fixedExpenses`

| Campo | Tipo | Descripción | Ejemplo |
|---|---|---|---|
| id | string | ID del gasto fijo | fe_arriendo |
| name | string | Nombre del gasto | Arriendo local |
| amount | number | Valor mensual en COP | 800000 |
| categoryId | string | Categoría asignada | cat_arriendo |
| isActive | boolean | Si aplica para el mes actual | true |
| createdAt | timestamp | Fecha de configuración | 2025-06-01 |

### Colección: `financialSettings` (documento único: `main`)

| Campo | Tipo | Descripción | Ejemplo |
|---|---|---|---|
| ownerSalaryTarget | number | Salario mensual deseado de la dueña (COP) | 1500000 |
| updatedAt | timestamp | Última modificación | 2025-06-01 |

### Colección: `categories`

| Campo | Tipo | Descripción | Ejemplo |
|---|---|---|---|
| id | string | ID de categoría | cat_insumos |
| name | string | Nombre de la categoría | Insumos |
| color | string | Color hex para UI | #E91E63 |
| isActive | boolean | Si está disponible | true |

---

## 9. Reglas Financieras y Cálculos

Cada fórmula se presenta en lenguaje técnico (para el desarrollador) y en lenguaje simple (para la usuaria).

| Concepto | Fórmula técnica | Lenguaje simple | Ejemplo |
|---|---|---|---|
| Ingresos del día | `SUM(transactions WHERE type='income' AND date=hoy)` | Todo lo que vendiste hoy | $35.000 + $70.000 = $105.000 |
| Ingresos del mes | `SUM(transactions WHERE type='income' AND month=mesActual)` | Todo lo que vendiste este mes | $1.200.000 en junio |
| Gastos del día | `SUM(transactions WHERE type='expense' AND date=hoy)` | Todo lo que gastaste hoy | $15.000 en insumos |
| Gastos del mes | `SUM(transactions WHERE type='expense' AND month=mesActual)` | Todo lo que gastaste este mes | $850.000 en junio |
| Costos variables | `SUM(transactions WHERE expenseType='variable')` | Gastos que cambian cada mes | $200.000 |
| Costos fijos | `SUM(fixedExpenses WHERE isActive=true)` | Gastos que pagas siempre | $1.100.000 |
| Gastos extraordinarios | `SUM(transactions WHERE expenseType='extraordinary')` | Gastos inesperados o únicos | $150.000 en reparación |
| Salario pagado | `SUM(transactions WHERE type='withdrawal' AND month=mes)` | Cuánto te has pagado este mes | $750.000 |
| Salario pendiente | `ownerSalaryTarget - salarioPagado` | Cuánto te falta por pagarte | $750.000 |
| Ganancia antes de salario | `ingresosMes - gastosMes` | Lo que queda tras pagar gastos del negocio | $350.000 |
| Ganancia después de salario | `gananciaAntesSalario - salarioPagado` | Lo que queda para reinvertir | −$400.000 (no alcanzó) |
| Dinero del negocio | `ingresosMes - gastosMes` | El dinero que hay en la caja del negocio | $350.000 |
| Punto de equilibrio | `gastosFijos / (1 - (costosVariablesPromedio / precioPromedioServicio))` | Cuánto necesitas vender para no perder plata | $1.800.000 (~52 servicios) |
| Avance al PE | `(ingresosMes / puntoEquilibrio) * 100` | Qué % del mes ya cubriste | 67% |
| Margen por servicio | `((precio - costo) / precio) * 100` | Qué % de cada servicio es ganancia real | Manicura: 85.7% |
| Servicio más vendido | `serviceId con mayor COUNT(transactions WHERE type='income')` | El servicio que más veces realizaste | Manicura (15 veces) |
| Servicio más rentable | `serviceId con mayor SUM(priceAtTime - costAtTime)` | El servicio que más dinero te dejó | Cabello ($420.000) |
| Dinero disponible | `ingresosMes - gastosMes - salarioPagado` | Cuánto hay disponible ahora mismo | −$50.000 (cuidado) |
| Meta diaria sugerida | `puntoEquilibrio / diasHabilesDelMes` | Cuánto vender cada día para cubrir gastos | $85.000/día |

---

## 10. Los Tres Conceptos Financieros Clave

El sistema debe separar con total claridad estos tres conceptos en la UI y en los datos.

### A. Dinero del Negocio

- **Qué es:** El dinero disponible para operar el spa. Sirve para pagar arriendo, insumos, servicios y demás gastos del negocio.
- **Cómo se calcula:** Ingresos del mes − Gastos del negocio del mes (excluyendo retiros de la dueña).
- **Cómo se muestra:** Card con número grande, color verde si positivo, rojo si negativo.
- **Mensaje UI:** "Este es el dinero del negocio. No todo está disponible para uso personal."

### B. Salario / Retiro de la Dueña

- **Qué es:** El dinero que la dueña se paga a sí misma. Se registra separado de los gastos del negocio.
- **Cómo se calcula:** Suma de todas las transacciones de tipo `withdrawal` del mes.
- **Cómo se muestra:** Barra de progreso: salario pagado vs. salario objetivo. "Ya te has pagado $750.000 de tu salario objetivo de $1.500.000."
- **Mensaje UI:** "Tu salario viene del negocio, pero se registra por separado para ver si el negocio puede sostenerte."

### C. Ganancia / Reinversión

- **Qué es:** Lo que queda después de pagar todos los gastos Y el salario de la dueña. Es el dinero para reinvertir, ahorrar o fortalecer el negocio.
- **Cómo se calcula:** Ingresos del mes − Gastos del negocio − Salario pagado a la dueña.
- **Cómo se muestra:** Card con número. Si positivo: "¡Tienes $X disponible para reinvertir o ahorrar!" Si negativo: "Este mes el negocio trabajó en rojo. Revisemos los gastos."

| Concepto | Color sugerido | Ícono | Mensaje si es negativo |
|---|---|---|---|
| Dinero del negocio | Verde / Rojo | 🏦 | "El negocio gastó más de lo que ingresó. Atención." |
| Salario de la dueña | Azul | 👤 | "Aún no te has pagado tu salario este mes." |
| Ganancia para reinvertir | Morado / Naranja | 🌱 | "Este mes no quedó dinero para reinversión." |

> **Regla crítica:** El sistema NUNCA debe mezclar retiros de la dueña con gastos del negocio. Si se mezclan, el punto de equilibrio y la ganancia se distorsionan completamente.

---

## 11. Dashboard Recomendado

El dashboard debe responder en menos de 5 segundos las preguntas más importantes de la dueña. Todo en una sola pantalla scrollable desde el celular.

| Indicador | Qué muestra | Cómo se calcula | Presentación visual | Mensaje simple |
|---|---|---|---|---|
| Ventas de hoy | Total vendido en el día | SUM ingresos del día | Número grande, color verde | "Hoy llevas $105.000" |
| Ventas del mes | Total vendido en el mes | SUM ingresos del mes | Número grande con tendencia | "Este mes llevas $1.200.000" |
| Gastos del mes | Total gastado en el mes | SUM gastos del mes | Número con color naranja/rojo | "Has gastado $850.000" |
| Punto de equilibrio | Avance vs. meta mínima | (ingresos/PE)*100% | Barra de progreso con % | "Ya cubriste el 67% de tus gastos" |
| Dinero del negocio | Disponible para operar | Ingresos − Gastos | Card verde o roja | "Hay $350.000 en el negocio" |
| Salario pagado | Cuánto se ha pagado | SUM retiros del mes | Barra salario pagado/objetivo | "Te has pagado $750K de $1.5M" |
| Ganancia/Reinversión | Lo que queda después de todo | Ingresos − Gastos − Retiros | Card morada o naranja | "Queda $X para reinvertir" |
| Servicio top | El más vendido del mes | COUNT por servicio | Chip o badge destacado | "Manicura es tu servicio estrella" |
| Meta diaria | Cuánto vender por día | PE / días hábiles | Número pequeño en card | "Meta de hoy: $85.000" |
| Gasto más alto | Categoría con más gasto | MAX por categoría | Lista top 3 categorías | "Insumos: $200.000 este mes" |

### Gráficas Sugeridas

- **Barra de progreso horizontal:** avance al punto de equilibrio. Limpia y directa.
- **Barras simples:** ingresos vs. gastos por semana del mes (Recharts `BarChart`).
- **Donut o lista:** distribución de gastos por categoría (solo si cabe en pantalla).

> **Principio:** Si una gráfica no cabe cómodamente en pantalla de celular sin hacer scroll horizontal, no va en el MVP.

---

## 12. Sistema de Tarjetas Explicativas

Cada tarjeta se activa tocando el ícono ⓘ junto al indicador. Aparece como drawer desde abajo. Lenguaje cálido y práctico.

| Concepto | Definición simple | Ejemplo en el spa | Decisión que ayuda a tomar |
|---|---|---|---|
| Ingresos | Todo el dinero que entra al negocio por los servicios que prestaste. | 3 manicuras a $35.000 + cabello a $80.000 = $185.000 en el día. | ¿Estoy vendiendo lo suficiente para cubrir mis gastos? |
| Gastos | Todo el dinero que sale del negocio para mantenerlo funcionando. | Esmaltes $40.000 + arriendo $800.000. | ¿En qué se me está yendo la plata? |
| Costos fijos | Los gastos que pagas siempre, vendes mucho o poco. | Arriendo, internet, servicios públicos. Siempre los mismos. | ¿Cuánto necesito vender mínimo para cubrir lo que siempre pago? |
| Costos variables | Los gastos que cambian según cuánto trabajas. | Más servicios = más insumos. | ¿Cuánto me cuesta prestar cada servicio adicional? |
| Gastos extraordinarios | Gastos inesperados o que no se repiten cada mes. | Una silla dañada, un equipo a reparar. | ¿Tuve gastos especiales este mes que no debo contar como normales? |
| Punto de equilibrio | La cantidad mínima que necesitas vender para no perder plata. | Gastos fijos $1.100.000 y ganancia neta por servicio $30.000 → necesitas 37 servicios. | ¿Ya cubrí mis gastos del mes o aún estoy en rojo? |
| Ganancia estimada | Lo que te queda después de pagar todos los gastos del negocio. | Ventas $1.500.000 − Gastos $1.100.000 = $400.000 antes de tu salario. | ¿El negocio genera dinero real o solo pago gastos? |
| Dinero del negocio | El dinero disponible para que el negocio funcione. No es todo tuyo todavía. | Hay $400.000 pero aún falta pagar $50.000 de insumos pendientes. | ¿El negocio tiene dinero suficiente para sus próximos gastos? |
| Salario de la dueña | El dinero que te pagas a ti misma por tu trabajo. | Tu salario mensual objetivo es $1.500.000. | ¿El negocio puede pagarme un salario digno de forma consistente? |
| Retiro de la dueña | El dinero que ya te sacaste del negocio para uso personal. | Te pagaste $500.000 la primera semana del mes. | ¿Cuánto me he pagado ya y cuánto me falta? |
| Ganancia para reinversión | Lo que queda después de pagar todo: gastos y tu salario. | Ventas $1.5M − Gastos $1.1M − Salario $1.5M = −$1.1M (aún no hay excedente). | ¿Puedo reinvertir en el negocio o todavía está muy justo? |
| Flujo de caja | El movimiento de dinero que entra y sale del negocio cada mes. | Esta semana entraron $300.000 y salieron $180.000. Flujo positivo. | ¿En qué momento del mes tengo más y menos dinero? |
| Servicio más rentable | El servicio que más ganancia neta te deja después de descontar su costo. | Cabello cuesta $30.000 en insumos, se cobra $150.000 → deja $120.000 netos. | ¿En qué servicios debería enfocarme para ganar más? |
| Servicio más vendido | El servicio que más veces realizaste en el mes. | Manicura: 18 veces en junio. | ¿Qué servicio prefieren mis clientas? |
| Meta mensual | La cantidad que necesitas vender para cubrir gastos y tu salario. | Gastos fijos $1.1M + Salario $1.5M = Meta mínima $2.6M/mes. | ¿Voy por buen camino para llegar a mi meta este mes? |
| Dinero disponible | Lo que hay ahora mismo para usar, después de descontar compromisos. | Ingresos $1.2M − Gastos $850K − Retiro $500K = −$150K (hay déficit). | ¿Puedo hacer un gasto extra este mes o debo esperar? |
| Reinversión | Usar parte de la ganancia para mejorar o hacer crecer el negocio. | Comprar una lámpara UV nueva o pagar un curso de uñas en gel. | ¿Tengo excedente para mejorar mi spa este mes? |
| Ahorro del negocio | Guardar parte de la ganancia como reserva para el futuro. | Si sobran $200.000, guardarlos para un mes flojo o una emergencia. | ¿Estoy construyendo un colchón financiero para el negocio? |

---

## 13. Recomendaciones UI con HeroUI

### Componentes y Patrones

| Componente | Uso principal | Patrón recomendado |
|---|---|---|
| Card | Indicadores del dashboard | Full-width en móvil. Número grande + label + mensaje contextual. |
| Modal / Drawer | Tarjetas educativas y confirmaciones | Drawer desde abajo para educación. Modal centrado para confirmaciones. |
| Bottom Navigation | Navegación principal | 4 ítems: Inicio, Historial, Servicios, Configuración. |
| FAB | Acciones principales de registro | Siempre visible. Expande 3 opciones al tocar. |
| Input | Campos de formulario | Label visible siempre. `inputMode="numeric"` para valores. |
| Select / Chips | Selección de categoría, tipo, método de pago | Chips horizontales scrollables. Selección visible con color de fondo. |
| DatePicker | Fecha de la transacción | Por defecto: hoy. Input de fecha nativo del dispositivo. |
| Progress Bar | Avance al PE, salario | Con porcentaje visible. Verde >100%, amarillo 50–99%, rojo <50%. |
| Toast | Confirmaciones de acciones | Toast corto (3 seg) desde arriba. |
| Skeleton Loading | Carga de datos del dashboard | Esqueletos con forma de las cards mientras cargan. |
| Empty State | Pantallas sin datos | Ilustración simple + texto amigable + botón de acción primaria. |
| Confirmation Dialog | Eliminar movimientos | Dos botones: Cancelar (ghost) y Eliminar (rojo). |
| Form validation | Errores en formularios | Mensaje debajo del campo en rojo. Sin alerts del browser. |
| Tabs | Historial (Ventas / Gastos / Retiros) | Tabs horizontales con chips contadores. |

### Patrón: Registro Rápido de Venta (≤ 20 segundos)

1. FAB → opción Venta.
2. Lista de servicios (chips grandes, ordenados por frecuencia). 1 toque.
3. Campo valor precargado con precio sugerido. Teclado numérico automático.
4. Chips de método de pago. 1 toque.
5. Botón grande "Guardar". 1 toque.
6. Toast de confirmación.

**Total: 5 interacciones, < 20 segundos.**

---

## 14. Arquitectura Técnica Inicial

### Stack Tecnológico

| Capa | Tecnología | Razón |
|---|---|---|
| Framework | Vite + React + TypeScript | SPA privada, sin necesidad de SSR. Build rápido. |
| Autenticación | Firebase Auth | Solución lista, segura y gratuita en el tier inicial. |
| Base de datos | Firestore (NoSQL) | Tiempo real, sin servidor, escalable gradualmente. |
| Hosting | Firebase Hosting | CDN global, HTTPS, despliegue simple con CLI. |
| UI Components | HeroUI (ex-NextUI) | Componentes accesibles, mobile-friendly, bien mantenidos. |
| Formularios | React Hook Form + Zod | Validación performante y tipada. Sin re-renders excesivos. |
| Gráficas | Recharts | Ligero, basado en SVG, fácil de integrar con React. |
| Fechas | date-fns | Ligero, funcional. Locale `es`. Sin moment.js ni dayjs. |
| Estado global | React Context + useState | Suficiente para una usuaria. Sin Redux ni Zustand en MVP. |
| Cloud Functions | Solo si es estrictamente necesario | Ver regla: no usar en MVP si puede evitarse. |

### Estructura de Carpetas

```
src/
├── app/                  # Rutas y providers globales
├── features/
│   ├── auth/             # Login, onboarding
│   ├── dashboard/        # Dashboard diario y mensual
│   ├── transactions/     # Registro y historial de movimientos
│   ├── services/         # Catálogo de servicios
│   ├── expenses/         # Gastos fijos
│   ├── withdrawals/      # Retiros de la dueña
│   └── settings/         # Configuración general
├── shared/
│   ├── components/       # Componentes reutilizables
│   ├── hooks/            # useAuth, useBusiness, useTransactions, useDashboardStats
│   ├── lib/              # firebase.ts (instancias de app, auth, db)
│   ├── utils/
│   │   ├── financials.ts # Todos los cálculos financieros (puro, testeable)
│   │   ├── currency.ts   # Formateo COP
│   │   └── dates.ts      # Helpers de date-fns con locale es
│   └── types/            # Un archivo por colección de Firestore
└── config/               # Variables de entorno, constantes
```

### Recomendaciones de Implementación

- Separar todos los cálculos financieros en `utils/financials.ts` para poder testearlos de forma aislada.
- Formatear moneda COP con `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' })`.
- Usar `date-fns/locale/es` para fechas en español.
- Mantener el estado de autenticación en un `AuthContext` global.
- Hooks personalizados (`useTransactions`, `useServices`, `useDashboard`) para encapsular la lógica de Firestore.
- Tipos TypeScript en archivos separados por colección.
- No usar Cloud Functions en el MVP a menos que sea estrictamente necesario.

---

## 15. Seguridad y Reglas de Firebase

### Reglas de Firestore

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

Validaciones adicionales en las rules:
- `amount` debe ser un número mayor a 0.
- `type` debe ser `'income'`, `'expense'` o `'withdrawal'`.
- `expenseType` (si presente) debe ser `'fixed'`, `'variable'` o `'extraordinary'`.
- `paymentMethod` debe ser `'cash'`, `'transfer'` o `'other'`.

### Dónde va cada validación

| Capa | Validación |
|---|---|
| Frontend (Zod) | Campos requeridos, valores positivos, formato de fechas, longitud de strings |
| Firestore Rules | El usuario solo accede a sus propios documentos, tipos válidos, montos > 0 |
| Cloud Functions | Solo lógica que no puede vivir en cliente ni en Rules (no necesario en MVP) |

---

## 16. Validaciones y Casos Borde

| Caso borde | Comportamiento esperado de la UI |
|---|---|
| Valor en cero o negativo | Error inline: "El valor debe ser mayor a $0." |
| Fecha futura (> hoy) | Advertencia: "Estás registrando una transacción futura. ¿Es correcto?" |
| Servicio sin precio configurado | Bloquear registro. Mostrar enlace a configuración. |
| Servicio eliminado con ventas históricas | Marcar como `isActive: false`. El historial conserva `serviceName` guardado. |
| Gasto sin categoría | Usar categoría "Sin categoría" por defecto. Permitir guardar. |
| Retiro mayor al dinero disponible | Advertencia (no bloqueo): "Este retiro dejaría el negocio con menos de $0. ¿Continuar?" |
| Eliminación accidental | Dialog de confirmación + opción de deshacer en toast (5 segundos). |
| Posibles duplicados (mismo monto, mismo día) | Advertencia: "Ya registraste un movimiento similar hoy. ¿Es una venta diferente?" |
| Mes sin ningún dato | Dashboard con estado vacío amigable. No mostrar $0 como si fuera un error. |
| Cambio de precio a mitad de mes | Las transacciones ya registradas conservan `priceAtTime`. No se recalculan. |
| Datos incompletos del onboarding | No dejar acceder al dashboard sin mínimo 1 servicio configurado. |
| Sin conexión a internet | Banner: "Sin conexión. Tus cambios se guardarán cuando vuelva la red." |
| Error al cargar datos | Skeleton loading → mensaje de error → botón "Reintentar". |
| Categoría eliminada con gastos históricos | Marcar como inactiva. Los gastos históricos conservan `categoryName` guardado. |

---

## 17. Estados Vacíos y Mensajes Amigables

| Situación | Mensaje sugerido | Acción disponible |
|---|---|---|
| Sin ventas hoy | "Hoy todavía no hay ventas registradas. ¡Empieza cuando quieras!" | Botón "Registrar venta" |
| Sin gastos registrados | "No has registrado gastos este mes. ¡Eso es buena señal!" | Botón "Registrar gasto" |
| Sin servicios configurados | "Aún no has configurado tus servicios. Es el primer paso." | Botón "Ir a configuración" |
| Sin datos para calcular PE | "Configura tus gastos fijos para ver cuánto necesitas vender cada mes." | Botón "Configurar gastos" |
| Sin salario objetivo | "¿Cuánto quieres ganarte al mes? Configúralo y te ayudamos a lograrlo." | Botón "Configurar salario" |
| Mes nuevo sin movimientos | "¡Bienvenida a un nuevo mes! Empieza registrando tu primera venta." | FAB visible |
| Error al cargar datos | "Algo salió mal. Intenta de nuevo en un momento." | Botón "Reintentar" |
| Venta registrada | "¡Listo! {serviceName} por {monto} quedó registrada." | Toast 3 segundos |
| Gasto registrado | "Gasto de {monto} en {categoría} registrado." | Toast 3 segundos |
| Retiro registrado | "¡Te pagaste {monto}! Ya llevas {total} de tu meta mensual." | Toast 3 segundos |
| Eliminación exitosa | "Movimiento eliminado. ¿Fue un error? Puedes volver a registrarlo." | Toast con opción deshacer |

---

## 18. Métricas de Éxito del MVP

| Métrica | Cómo medirla | Umbral de éxito |
|---|---|---|
| Tiempo para registrar venta | Cronometrar desde dashboard hasta confirmación | < 20 segundos en celular |
| Tiempo para registrar gasto | Cronometrar desde dashboard hasta confirmación | < 20 segundos en celular |
| Comprensión financiera | Entrevista: ¿cuánto ganó el mes pasado? | Puede responder sin ayuda |
| Uso de tarjetas educativas | ¿Lee al menos 3 tarjetas en la primera semana? | Sí |
| Reemplazo del cuaderno | ¿Dejó de usar el cuaderno para el registro diario? | Sí, después de 2 semanas |
| Frecuencia de uso | Veces que abre el dashboard por semana | > 3 veces por semana |
| Diferenciación financiera | ¿Puede distinguir dinero del negocio, salario y ganancia? | Sí, sin ayuda |
| Cobertura de registros | ¿Registra la mayoría de sus ventas y gastos? | > 80% de las transacciones |
| Satisfacción general | Escala 1–5: ¿Es más fácil que el cuaderno? | ≥ 4 / 5 |
| Implementabilidad | ¿Puede el desarrollador implementar sin ambigüedad? | Sí, sin preguntas bloqueantes |

---

## 19. Backlog Priorizado

### Must Have (Bloqueantes para el MVP)

- Firebase Auth: login y protección de rutas.
- Onboarding guiado con configuración mínima.
- CRUD de servicios con precio y costo estimado.
- CRUD de gastos fijos.
- Configuración de salario objetivo.
- Registro de ventas (< 20 seg).
- Registro de gastos (< 20 seg).
- Registro de retiros / pagos a la dueña.
- Dashboard mensual con indicadores clave.
- Cálculo de punto de equilibrio.
- Separación: dinero del negocio / salario / ganancia.
- Historial de movimientos con filtros básicos.
- Tarjetas educativas para conceptos principales.
- Validaciones básicas y mensajes de error amigables.
- Estados vacíos en todas las pantallas.

### Should Have (Importantes pero no Bloqueantes)

- Dashboard diario (ventas y gastos del día).
- Edición de transacciones registradas.
- Eliminación con confirmación y opción deshacer.
- Advertencia al hacer retiro mayor al disponible.
- Indicador de servicio más vendido y más rentable.
- Meta diaria sugerida.
- Gráfico simple de ingresos vs. gastos del mes.
- Categorías de gasto configurables.

### Could Have (Si Queda Tiempo)

- Buscador en historial.
- Notas en transacciones.
- Exportación básica a CSV.
- Gráfico de distribución de gastos por categoría.
- Mensaje de felicitación al superar el punto de equilibrio.
- Onboarding con datos de ejemplo.

### Won't Have (Fuera del MVP)

- Agenda de citas, WhatsApp, automatización.
- Facturación electrónica.
- Inventario de insumos.
- Gestión avanzada de clientes.
- Multiusuario, múltiples sedes.
- Integraciones bancarias.
- App nativa iOS/Android.
- Contabilidad de partida doble.

---

## 20. Orden Recomendado de Implementación

| # | Etapa | Criterio para pasar a la siguiente |
|---|---|---|
| 1 | Setup del proyecto | App vacía corre en local sin errores. |
| 2 | Firebase Auth | La usuaria puede ingresar y la app recuerda su sesión. |
| 3 | Modelo de datos base | Se puede escribir y leer un documento en Firestore. |
| 4 | Onboarding | Flujo completo guarda datos en Firestore. |
| 5 | Servicios | Se pueden crear, editar y desactivar servicios. |
| 6 | Categorías y Gastos Fijos | Se pueden configurar los gastos fijos del negocio. |
| 7 | Configuración Financiera | El salario objetivo queda guardado y visible. |
| 8 | Registro de Ventas | Una venta se registra en < 20 segundos. |
| 9 | Registro de Gastos | Un gasto se registra en < 20 segundos. |
| 10 | Registro de Retiros | Un retiro se registra con indicador de salario. |
| 11 | Cálculos Financieros | Las funciones de `financials.ts` producen resultados correctos. |
| 12 | Dashboard | El dashboard muestra datos reales correctamente. |
| 13 | Historial | La usuaria puede ver, editar y eliminar movimientos. |
| 14 | Tarjetas Educativas | Cada indicador tiene su drawer de ayuda. |
| 15 | Validaciones y Pulido | Flujos funcionan correctamente en celular real. |
| 16 | Pruebas con Usuaria | La usuaria registra ventas y lee el dashboard sin ayuda externa. |

---

## 21. Riesgos del Producto

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| La usuaria no registra todos los movimientos | Alta | Alto | Flujo ultra-rápido (< 20 seg). FAB siempre visible. Recordatorio amigable si no hay registros en el día. |
| Los conceptos financieros son confusos | Media | Alto | Tarjetas educativas en todos los indicadores. Lenguaje cotidiano. Beta testing con la usuaria antes de lanzar. |
| El flujo es más lento que el cuaderno | Media | Alto | Priorizar formularios cortos. Valores precargados. Medir tiempo real en pruebas. |
| Demasiadas pantallas o navegación confusa | Media | Medio | Máximo 5 secciones en bottom nav. FAB para las 3 acciones más frecuentes. |
| Datos incompletos distorsionan los cálculos | Alta | Alto | Advertencias cuando faltan datos. No mostrar indicadores sin información suficiente. |
| Mezcla de finanzas personales y del negocio | Alta | Alto | Interfaz que separa claramente los 3 conceptos. Advertencias explícitas. Educación permanente. |
| Dashboard sobrecargado de información | Media | Medio | Máximo 6–8 indicadores en el dashboard MVP. |
| Se quiere agregar citas antes de tiempo | Media | Medio | Roadmap claro y comunicado. El scope del MVP está definido y escrito. |
| Sobrediseño técnico | Media | Medio | Revisar cada decisión técnica: ¿lo necesita el MVP? Si no es obvio, la respuesta es no. |
| Pérdida de datos por error del usuario | Baja | Alto | Confirmación antes de eliminar. Opción deshacer en toast. Firestore conserva historial por defecto. |

---

## 22. Preguntas Abiertas

Estas preguntas deben resolverse antes de iniciar el diseño técnico detallado o la implementación.

| Pregunta | Por qué importa | Urgencia |
|---|---|---|
| ¿Cuáles son los servicios iniciales del spa? | Se necesitan para precargar el catálogo en el onboarding. | Alta |
| ¿Cuáles son los precios actuales de cada servicio? | Necesarios para el MVP desde el día 1. | Alta |
| ¿Cuál es el costo aproximado de insumos por servicio? | Indispensable para el margen y el punto de equilibrio. | Alta |
| ¿Cuáles son los gastos fijos mensuales reales? | Sin esto, el punto de equilibrio no se puede calcular. | Alta |
| ¿Cuál es el salario mensual deseado por la dueña? | Define la meta financiera central del sistema. | Alta |
| ¿Qué métodos de pago recibe actualmente? | Efectivo, Nequi, transferencia, datáfono, otro. | Alta |
| ¿Qué categorías de gasto usa actualmente? | Para precargar categorías y acelerar el onboarding. | Media |
| ¿Quiere registrar el nombre del cliente en cada venta? | Define si se necesita un campo de cliente en el MVP. | Media |
| ¿Necesita exportar información desde el MVP? | Define si exportación a Excel/PDF entra o va a fase 2. | Media |
| ¿Tiene conexión estable a internet en el local? | Si hay problemas frecuentes, puede requerir soporte offline antes. | Media |
| ¿Usará la app solo en celular o también en computador? | Define si hay que optimizar también para pantallas grandes. | Baja |
| ¿Tiene un segundo dispositivo o tableta en el local? | Podría usarse para mostrar el dashboard en el mostrador. | Baja |
| ¿Hay alguien más que eventualmente use la app? | Define si multiusuario debe anticiparse en el modelo de datos. | Baja |
| ¿Qué pasa con gastos personales mezclados con el negocio? | Necesario para educación financiera y diseño de advertencias. | Media |

---

*Versión 1.0 · Junio 2025*
