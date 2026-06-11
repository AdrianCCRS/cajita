# Spa Control - Plan de Desarrollo del MVP

Version 1.0 - 2026-06-09  
Fuente base: `spa_control_planeacion.md`

## Project: Spa Control MVP

**Goal**: Construir y lanzar una app web privada, mobile-first, para que una dueña de spa unipersonal en Colombia registre ventas, gastos y retiros en menos de 20 segundos, entienda su estado financiero mensual y reemplace el cuaderno fisico con una herramienta confiable.

**Timeline**: 8 semanas para 1 desarrollador full-stack trabajando casi tiempo completo. Si el trabajo es part-time, planear 10-12 semanas.

**Team**:

| Role | Owner | Responsibilities |
|------|-------|------------------|
| Product Owner | Dueña del spa / solicitante | Resolver datos reales, validar lenguaje, probar flujos en celular |
| Full-stack Developer | Agente/desarrollador | Implementar app React, Firebase, Firestore, UI, pruebas y despliegue |
| QA/User Tester | Dueña del spa + desarrollador | Validar flujos reales, tiempos de registro y claridad financiera |

**Constraints**:

- MVP privado, no SaaS, no multiusuario, no multiples sedes.
- Mobile-first: la experiencia principal es celular.
- Stack base: Vite, React, TypeScript, Firebase Auth, Firestore, Firebase Hosting, HeroUI, React Hook Form, Zod, ApexCharts y date-fns.
- Sin facturacion electronica, agenda, WhatsApp, inventario avanzado, integraciones bancarias ni contabilidad de partida doble.
- Los comandos reales de desarrollo se definen cuando se inicialice el proyecto React.

---

## Milestones

| # | Milestone | Target | Owner | Success Criteria |
|---|-----------|--------|-------|------------------|
| 1 | Datos base y app scaffolded | Fin Semana 1 | Developer + PO | Vite React TS corre localmente y existen datos iniciales confirmados |
| 2 | Auth y modelo Firestore | Fin Semana 2 | Developer | Login funciona, rutas protegidas activas y lectura/escritura base validada |
| 3 | Onboarding y configuracion inicial | Fin Semana 3 | Developer + PO | La usuaria configura negocio, servicios, gastos fijos, categorias y salario |
| 4 | Registro rapido de movimientos | Fin Semana 4 | Developer | Ventas, gastos y retiros se guardan con validacion y confirmacion |
| 5 | Calculos financieros y dashboard | Fin Semana 5 | Developer | Dashboard muestra datos reales y formulas probadas |
| 6 | Historial, edicion y educacion | Fin Semana 6 | Developer | La usuaria consulta, filtra, edita, elimina y entiende conceptos clave |
| 7 | Pulido, edge cases y QA mobile | Fin Semana 7 | Developer + QA | Flujos criticos pasan en celular y no hay bloqueantes conocidos |
| 8 | Beta con usuaria y despliegue MVP | Fin Semana 8 | Developer + PO | La dueña registra movimientos y lee el dashboard sin ayuda |

---

## Phase 1: Datos Base y Setup del Proyecto (Semana 1)

| Task | Effort | Owner | Depends On | Done Criteria |
|------|--------|-------|------------|---------------|
| Confirmar servicios, precios y costos aproximados | 4h | PO + Developer | - | Lista inicial de servicios con precio y costo por servicio |
| Confirmar gastos fijos, salario, categorias y metodos de pago | 4h | PO + Developer | - | Datos minimos listos para onboarding y pruebas |
| Inicializar Vite + React + TypeScript | 4h | Developer | - | App vacia corre localmente sin errores |
| Instalar stack MVP y configurar HeroUI | 4h | Developer | App inicial | Dependencias base instaladas y proveedor UI configurado |
| Crear estructura `src/app`, `src/features`, `src/shared`, `src/config` | 2h | Developer | App inicial | Carpetas base creadas segun arquitectura |
| Configurar Firebase project checklist y variables de entorno | 4h | Developer | App inicial | `.env.example` documenta variables requeridas |
| Crear shell responsive con rutas iniciales | 6h | Developer | HeroUI | Layout base mobile-first visible |

**Deliverable**: Base tecnica lista para desarrollar features sin decisiones pendientes de estructura.

---

## Phase 2: Autenticacion, Tipos y Firestore (Semanas 1-2)

| Task | Effort | Owner | Depends On | Done Criteria |
|------|--------|-------|------------|---------------|
| Implementar Firebase Auth email/password | 6h | Developer | Firebase config | Login, registro, logout y recuperacion basica disponibles |
| Crear `AuthContext` y rutas protegidas | 4h | Developer | Auth | App distingue loading, autenticado y no autenticado |
| Definir tipos TypeScript del dominio | 6h | Developer | Datos base | Tipos para user, business, service, transaction, fixedExpense, category y financialSettings |
| Crear schemas Zod para formularios principales | 6h | Developer | Tipos dominio | Validaciones reutilizables para montos, fechas, tipos y campos requeridos |
| Implementar helpers de rutas Firestore bajo `users/{userId}` | 4h | Developer | Tipos dominio | Paths centralizados y tipados |
| Crear hooks/repositorios base de Firestore | 8h | Developer | Firestore paths | CRUD base reusable con loading/error states |
| Redactar Firestore Rules iniciales | 6h | Developer | Modelo de datos | Reglas limitan acceso a `request.auth.uid == userId` |
| Probar lectura/escritura base | 4h | Developer | Hooks Firestore | Documento de prueba se crea y lee en entorno dev |

**Deliverable**: La app puede autenticar a la usuaria y persistir datos con estructura segura.

---

## Phase 3: Onboarding y Configuracion (Semanas 2-3)

| Task | Effort | Owner | Depends On | Done Criteria |
|------|--------|-------|------------|---------------|
| Crear guard de onboarding | 4h | Developer | Auth + user doc | Usuaria incompleta va a onboarding, usuaria completa va al dashboard |
| Construir stepper mobile-first | 4h | Developer | Shell | Un paso visible por pantalla con progreso claro |
| Implementar paso de negocio y moneda COP | 3h | Developer | Stepper | Nombre de negocio se valida y COP queda fijo |
| Implementar paso de servicios iniciales | 6h | Developer | Schemas servicios | Al menos 1 servicio con precio y costo validado |
| Implementar paso de gastos fijos y categorias | 6h | Developer | Schemas gastos | Gastos fijos y categorias se crean o editan |
| Implementar paso de salario objetivo | 4h | Developer | Financial settings schema | Salario mensual queda guardado |
| Guardar onboarding completo en Firestore | 6h | Developer | Pasos onboarding | User, business, services, fixedExpenses, categories y settings quedan persistidos |
| Crear settings para servicios | 8h | Developer | Hooks Firestore | Crear, editar y desactivar servicios desde configuracion |
| Crear settings para gastos fijos, categorias y salario | 8h | Developer | Hooks Firestore | Ajustes financieros editables despues del onboarding |
| Implementar estados vacios e incompletos | 4h | Developer | Settings | La app guia a completar datos faltantes sin mostrar cifras confusas |

**Deliverable**: Una usuaria nueva queda lista para registrar movimientos reales.

---

## Phase 4: Registro Rapido de Movimientos (Semanas 3-4)

| Task | Effort | Owner | Depends On | Done Criteria |
|------|--------|-------|------------|---------------|
| Crear servicio de escritura de transacciones | 4h | Developer | Firestore hooks | `income`, `expense` y `withdrawal` se guardan con timestamps |
| Implementar bottom navigation y FAB | 6h | Developer | Shell | FAB siempre visible ofrece venta, gasto y pagarme |
| Construir formulario rapido de venta | 8h | Developer | Services data | Servicio, precio sugerido, metodo de pago, fecha y nota opcional |
| Guardar snapshots historicos de venta | 4h | Developer | Form venta | Se guardan `serviceName`, `priceAtTime` y `costAtTime` |
| Construir formulario rapido de gasto | 6h | Developer | Categories data | Categoria, monto, tipo de gasto, metodo, fecha y nota |
| Guardar snapshots historicos de gasto | 3h | Developer | Form gasto | Se guarda `categoryName` para historial estable |
| Construir formulario de retiro | 6h | Developer | Financial data | Retiro se registra separado de gastos del negocio |
| Agregar validaciones y advertencias criticas | 8h | Developer | Forms | Monto > 0, fecha futura, duplicados, servicio sin precio y retiro mayor al disponible |
| Agregar toasts y confirmaciones | 4h | Developer | Forms | Mensajes amigables al guardar o fallar |

**Deliverable**: La usuaria puede registrar ventas, gastos y retiros rapidamente desde celular.

---

## Phase 5: Calculos Financieros y Dashboard (Semana 5)

| Task | Effort | Owner | Depends On | Done Criteria |
|------|--------|-------|------------|---------------|
| Crear `shared/utils/financials.ts` | 8h | Developer | Transactions + settings | Funciones puras para ingresos, gastos, retiros, PE, salario y ganancia |
| Agregar unit tests de calculos financieros | 6h | Developer | Financial utils | Casos positivos, cero datos, negativos y cambio de precio pasan |
| Crear hook `useDashboard` | 6h | Developer | Financial utils | Hook entrega indicadores diarios y mensuales desde Firestore |
| Construir cards principales del dashboard | 8h | Developer | useDashboard | Ventas, gastos, dinero negocio, salario, ganancia y PE visibles |
| Agregar barra de avance al punto de equilibrio | 4h | Developer | Dashboard data | Progreso y mensaje simple reflejan el mes actual |
| Agregar servicio mas vendido y mas rentable | 6h | Developer | Transactions | Indicadores calculan por cantidad y margen |
| Agregar grafica simple ventas vs gastos | 6h | Developer | Dashboard data | ApexCharts renderiza sin scroll horizontal en mobile |
| Crear estados loading, empty y error del dashboard | 4h | Developer | Dashboard UI | Skeleton, estado vacio y reintento disponibles |

**Deliverable**: Dashboard claro que responde las preguntas financieras principales en menos de 5 segundos.

---

## Phase 6: Historial, Edicion y Tarjetas Educativas (Semana 6)

| Task | Effort | Owner | Depends On | Done Criteria |
|------|--------|-------|------------|---------------|
| Crear historial de movimientos | 6h | Developer | Transactions | Lista ordenada por fecha descendente |
| Agregar filtros basicos | 4h | Developer | Historial | Filtros por ventas, gastos, retiros y categoria/servicio |
| Crear detalle de movimiento | 4h | Developer | Historial | Detalle muestra campos relevantes segun tipo |
| Implementar edicion de movimientos | 8h | Developer | Detalle + schemas | Cambios se validan y actualizan sin romper snapshots |
| Implementar eliminacion con confirmacion y deshacer | 6h | Developer | Detalle | Dialog antes de eliminar y toast con undo |
| Mantener servicios/categorias historicos como inactivos | 4h | Developer | Settings | No se borra informacion usada por transacciones previas |
| Crear contenido educativo base | 4h | Developer + PO | Dashboard | Conceptos cubren ingresos, gastos, PE, salario y ganancia |
| Implementar drawer educativo | 6h | Developer | Conceptos | Icono de ayuda abre explicacion, ejemplo y decision |

**Deliverable**: La usuaria puede revisar el pasado, corregir errores y entender cada indicador.

---

## Phase 7: Pulido, Edge Cases y QA Mobile (Semana 7)

| Task | Effort | Owner | Depends On | Done Criteria |
|------|--------|-------|------------|---------------|
| Revisar todos los estados vacios | 4h | Developer | Features MVP | Cada pantalla vacia tiene mensaje y accion primaria |
| Implementar banner offline y error retry | 6h | Developer | Data hooks | Sin conexion y fallos de carga son visibles y recuperables |
| Pulir copy en espanol cotidiano | 4h | Developer + PO | UI completa | No queda jerga contable en flujos principales |
| Validar responsive en celular | 6h | Developer | UI completa | Sin overflow horizontal ni botones dificiles de tocar |
| Medir tiempo de venta y gasto | 4h | QA + Developer | Forms | Flujo desde dashboard hasta toast dura menos de 20 segundos |
| Agregar pruebas de flujos criticos | 8h | Developer | MVP features | Login, onboarding, venta, gasto, retiro y dashboard tienen cobertura |
| Revisar accesibilidad basica | 4h | Developer | UI completa | Labels, focus, contraste y navegacion por teclado basicos |
| Corregir bugs bloqueantes | 8h | Developer | QA | No quedan errores P0/P1 conocidos |

**Deliverable**: MVP estable, usable en celular y listo para beta real.

---

## Phase 8: Beta, Ajustes Finales y Despliegue (Semana 8)

| Task | Effort | Owner | Depends On | Done Criteria |
|------|--------|-------|------------|---------------|
| Configurar Firebase Hosting staging | 4h | Developer | Build estable | URL de staging disponible |
| Ejecutar sesion beta guiada con la dueña | 4h | PO + Developer | Staging | La usuaria registra ventas, gastos y lee dashboard sin ayuda |
| Priorizar feedback beta | 3h | Developer + PO | Sesion beta | Lista P0/P1/P2 con decisiones claras |
| Corregir feedback critico | 8h | Developer | Priorizacion | P0/P1 cerrados o explicitamente diferidos |
| Validar Firestore Rules finales | 4h | Developer | Rules | Acceso queda limitado a datos propios |
| Preparar checklist de lanzamiento | 4h | Developer | QA | Variables, build, deploy, cuenta y datos iniciales verificados |
| Desplegar MVP | 4h | Developer | Checklist | App disponible para uso real |
| Documentar comandos reales en `AGENTS.md` | 2h | Developer | Proyecto scaffolded | Comandos de dev, build, test y deploy quedan registrados |

**Deliverable**: MVP desplegado y validado con la usuaria objetivo.

---

## Dependencies Map

```text
Datos reales + decisiones MVP
  -> Setup Vite/Firebase
  -> Auth + modelo Firestore
  -> Onboarding/configuracion
  -> Registro de ventas/gastos/retiros
  -> Calculos financieros
  -> Dashboard
  -> Historial + tarjetas educativas
  -> QA mobile + beta
  -> Despliegue MVP
```

Critical path:

- Sin datos reales no hay onboarding util ni pruebas realistas.
- Sin Auth y modelo Firestore no se deben construir flujos persistentes.
- Sin transacciones reales no se puede validar dashboard.
- Sin pruebas con la dueña no se puede declarar reemplazo del cuaderno.

Parallelizable work:

- Copy educativo puede prepararse mientras se construyen formularios.
- Firestore Rules pueden evolucionar mientras se implementan schemas Zod.
- QA responsive puede iniciar tan pronto existan pantallas completas.

---

## Acceptance Criteria del MVP

| Area | Acceptance Criteria |
|------|---------------------|
| Login | La usuaria entra con correo/password, la sesion persiste y las rutas privadas quedan protegidas |
| Onboarding | La usuaria no llega al dashboard hasta tener negocio, minimo 1 servicio, gastos fijos y salario objetivo |
| Venta | Se registra desde dashboard en menos de 20 segundos y guarda precio/costo/nombre historicos |
| Gasto | Se registra desde dashboard en menos de 20 segundos y conserva categoria historica |
| Retiro | Se registra separado de gastos; si supera disponible, advierte pero no bloquea |
| Dashboard | Muestra ventas, gastos, PE, dinero del negocio, salario, ganancia y servicios destacados |
| Calculos | Unit tests cubren meses sin datos, costos fijos, retiros, cambios de precio y valores negativos |
| Historial | Lista, filtra, edita y elimina movimientos con confirmacion y undo |
| Educacion | Cada indicador clave tiene explicacion simple, ejemplo del spa y decision asociada |
| Seguridad | Firestore Rules impiden leer/escribir datos de otro `userId` |
| Mobile | No hay scroll horizontal critico; botones y campos son comodos en celular |

---

## Testing Plan

| Test Type | Scope | Tooling Suggested | Done Criteria |
|-----------|-------|-------------------|---------------|
| Unit | `shared/utils/financials.ts`, formatters y helpers de fecha | Vitest | Formulas financieras pasan casos principales y borde |
| Schema | Zod schemas para servicios, transacciones, gastos y salario | Vitest | Entradas invalidas fallan con mensajes utiles |
| Component | Formularios y cards principales | React Testing Library | Renderizan loading, empty, validacion y success states |
| Integration | Auth, onboarding, Firestore hooks y dashboard | Firebase Emulator + Vitest/RTL | Datos escritos aparecen en pantalla correcta |
| E2E/smoke | Login, onboarding, venta, gasto, retiro, historial | Playwright | Flujos criticos funcionan en viewport mobile |
| Manual UX | Sesion con la dueña del spa | Celular real | Puede registrar y entender dashboard sin ayuda |

Minimum release gate:

- Unit tests de calculos financieros pasan.
- Smoke test manual de login, onboarding, venta, gasto, retiro y dashboard pasa.
- Firestore Rules revisadas.
- Venta y gasto cumplen el objetivo de menos de 20 segundos.

---

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| La usuaria no registra todos los movimientos | High | High | FAB siempre visible, formularios cortos, valores precargados y recordatorios amigables |
| Conceptos financieros confusos | High | Medium | Lenguaje cotidiano, tarjetas educativas y beta con la usuaria |
| Sobrecargar el dashboard | Medium | Medium | Maximo 6-8 indicadores MVP y sin metricas no accionables |
| Datos incompletos distorsionan calculos | High | High | Guard de onboarding, estados incompletos y advertencias |
| Mezclar salario con gastos del negocio | High | High | Tipo `withdrawal` separado, UI separada y tests de calculos |
| Firestore Rules permisivas | High | Medium | Reglas por `userId`, pruebas con emulator y revision antes de deploy |
| Scope creep hacia citas o facturacion | Medium | Medium | Mantener Won't Have visible y diferir a roadmap |
| UX mas lenta que el cuaderno | High | Medium | Medir flujos reales y recortar campos si exceden 20 segundos |
| Dependencia de conexion a internet | Medium | Medium | Banner offline en MVP; offline-first queda como decision futura si el local lo requiere |

---

## Resource Allocation

| Role | Hours/Week | Key Responsibilities |
|------|------------|----------------------|
| Full-stack Developer | 32-38h | Implementacion, pruebas, Firebase, UI, deploy |
| Product Owner | 2-4h | Datos reales, validacion de copy, decisiones de alcance |
| QA/User Tester | 1-2h desde Semana 5 | Probar flujos en celular y reportar fricciones |

Estimated development effort: 250-290 horas incluyendo QA y buffer. El rango depende de la velocidad de definicion de datos reales, configuracion Firebase y feedback beta.

---

## Open Inputs Required Before or During Week 1

| Input | Required For | Priority |
|-------|--------------|----------|
| Servicios iniciales del spa | Onboarding, ventas, reportes por servicio | High |
| Precio actual de cada servicio | Venta rapida y dashboard | High |
| Costo aproximado por servicio | Margen y servicio mas rentable | High |
| Gastos fijos mensuales | Punto de equilibrio | High |
| Salario mensual deseado | Meta de salario y retiros | High |
| Metodos de pago usados | Formularios de venta/gasto | High |
| Categorias de gasto actuales | Onboarding e historial | Medium |
| Estabilidad de internet en el local | Decidir si offline necesita subir prioridad | Medium |

Default si un input no esta listo:

- Permitir configurarlo manualmente en onboarding.
- No mostrar indicadores dependientes hasta tener datos suficientes.
- Evitar datos inventados en produccion; usar solo datos de ejemplo en entorno dev.

---

## Release Checklist

- App compila sin errores TypeScript.
- Variables de entorno de Firebase estan configuradas.
- Auth email/password habilitado.
- Firestore Rules publicadas y revisadas.
- Onboarding completo probado con cuenta nueva.
- Venta, gasto y retiro probados con datos reales.
- Dashboard mensual muestra numeros esperados.
- Historial permite editar y eliminar con confirmacion.
- Copy revisado por claridad y tono cotidiano.
- Vista mobile revisada en celular real.
- `AGENTS.md` actualizado con comandos reales del proyecto.
- `spa_control_planeacion.md` sigue siendo la fuente de verdad del producto.

---

## Out of Scope for This Development Plan

- Agenda de citas y recordatorios.
- WhatsApp Business.
- Facturacion electronica o DIAN.
- Exportacion formal a Excel/PDF.
- Inventario avanzado.
- Gestion avanzada de clientes.
- Multiusuario, multiples sedes o roles.
- Integraciones bancarias.
- App nativa iOS/Android.
- Contabilidad de partida doble.

Estas funciones solo deben entrar con un nuevo plan posterior al MVP.
