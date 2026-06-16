# Cajita — Spa Control

App web privada de control financiero para una dueña de spa unipersonal en Colombia. Reemplaza el cuaderno físico con una herramienta rápida, clara y mobile-first.

## Resumen

Cajita permite registrar ventas, gastos, retiros y vales personales en menos de 20 segundos. Calcula automáticamente indicadores financieros mensuales (punto de equilibrio, ganancia, salario pendiente) y los presenta en un dashboard con gráficas y tarjetas educativas, todo en lenguaje cotidiano y sin jerga contable.

## Características

- **Registro rápido de movimientos** — Ventas, gastos, retiros y vales personales desde un FAB con bottom sheet.
- **Dashboard financiero** — Indicadores mensuales: ventas, gastos, dinero del negocio, salario, ganancia y progreso al punto de equilibrio.
- **Gráficas móviles** — ApexCharts con visualizaciones de tendencias diarias, servicios más vendidos y gastos por categoría.
- **Historial con calendario** — Lista agrupada por día con filtros, vista de calendario con resumen diario y edición/eliminación con confirmación.
- **Catálogo de servicios** — CRUD con cálculo automático de costos basado en materias primas (insumos).
- **Materias primas** — Control de insumos por volumen, peso o unidad con historial de precios y cálculo de costo unitario.
- **Onboarding guiado** — Stepper que configura negocio, servicios, gastos fijos, categorías y salario objetivo.
- **Personalización visual** — Modo oscuro y selección de color de acento persistente en Firestore.
- **Tarjetas educativas** — Explicaciones simples de conceptos financieros con ejemplos del spa.
- **Seguridad por usuario** — Firestore Rules que limitan acceso a `users/{userId}` con validaciones de schema.

## Requisitos

- **Node.js** >= 18
- **Bun** (gestor de paquetes y runtime de scripts)
- **Firebase** — Proyecto configurado con Auth (email/password) y Firestore habilitado

## Instalación

```bash
git clone https://github.com/AdrianCCRS/cajita.git
cd cajita
bun install
```

## Variables de entorno

Copia `.env.example` a `.env` y completa con los datos de tu proyecto Firebase:

```bash
cp .env.example .env
```

| Variable | Descripción |
|---|---|
| `VITE_FIREBASE_API_KEY` | API Key del proyecto Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Dominio de autenticación |
| `VITE_FIREBASE_PROJECT_ID` | ID del proyecto Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | Bucket de Cloud Storage |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ID del remitente de mensajería |
| `VITE_FIREBASE_APP_ID` | ID de la app Firebase |

Si las variables no están configuradas, la app funciona en modo demo con datos en `localStorage`.

## Comandos

```bash
bun run dev          # Servidor de desarrollo (Vite)
bun run build        # Compilación TypeScript + build de producción
bun run test         # Ejecutar tests unitarios (Vitest)
bun run test:watch   # Tests en modo observador
```

## Despliegue

El proyecto usa Firebase Hosting. El build de producción se genera en `dist/`.

```bash
bun run build
firebase deploy
```

La configuración de hosting está en `firebase.json` con reescritura SPA (`**` → `/index.html`).

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Vite + React 19 + TypeScript |
| UI | HeroUI v3 + Tailwind CSS v4 |
| Formularios | React Hook Form + Zod |
| Gráficas | ApexCharts + react-apexcharts |
| Fechas | date-fns (locale `es`) |
| Auth | Firebase Auth (email/password) |
| Base de datos | Firestore (tiempo real) |
| Hosting | Firebase Hosting |
| Tests | Vitest + Testing Library + jsdom |
| Iconos | Lucide React + Gravity UI Icons |

## Estructura del proyecto

```
src/
├── app/                  # AppShell, rutas, estilos globales
├── config/               # Variables de entorno Firebase
├── features/
│   ├── auth/             # LoginScreen
│   ├── dashboard/        # Dashboard, gráficas
│   ├── onboarding/       # Stepper, inicialización de negocio
│   ├── services/         # Catálogo de servicios
│   ├── settings/         # Configuración y tema visual
│   └── transactions/     # Historial, calendario, registro
├── shared/
│   ├── auth/             # AuthContext
│   ├── components/       # Componentes UI reutilizables
│   ├── data/             # SpaDataContext (estado global)
│   ├── lib/              # Firebase init, rutas Firestore
│   ├── types/            # Tipos TypeScript del dominio
│   ├── utils/            # Cálculos financieros, formateo, fechas
│   └── validation/       # Schemas Zod
└── test/                 # Setup de Vitest
```

## Modelo de datos

Ruta base: `users/{userId}/businesses/{businessId}/`

| Colección | Contenido |
|---|---|
| `services/` | Catálogo de servicios |
| `services/{id}/materials/` | Materiales asociados a un servicio |
| `rawMaterials/` | Insumos / materias primas |
| `rawMaterials/{id}/priceHistory/` | Historial de cambios de precio |
| `transactions/` | Ventas, gastos, retiros y vales |
| `fixedExpenses/` | Gastos fijos mensuales |
| `categories/` | Categorías de gasto |
| `personalExpenseCategories/` | Categorías de gastos personales |
| `financialSettings/` | Salario objetivo (doc `main`) |
| `uiSettings/` | Tema visual (doc `main`) |

## Seguridad

Las Firestore Rules restringen lectura y escritura a `request.auth.uid == userId`. Incluyen validaciones de tipos, montos positivos y enums permitidos para cada colección.

## Licencia

Proyecto privado. No licenciado para distribución pública.
