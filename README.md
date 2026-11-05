# ISDIN Order Hub 2.0 — Frontend

Frontend del proyecto de hackatón **ISDIN Order Hub 2.0**: automatiza la recepción, homologación, revisión y exportación a SAP de órdenes de compra de clientes ISDIN Chile. Este repositorio contiene únicamente el frontend; el backend (FastAPI) y el módulo Processing los desarrollan otros integrantes del equipo.

## Stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) como bundler y servidor de desarrollo
- [Tailwind CSS v4](https://tailwindcss.com/) para estilos utilitarios
- [shadcn/ui](https://ui.shadcn.com/) (preset Nova, Base UI + Lucide) para componentes accesibles
- [React Router](https://reactrouter.com/) para la navegación
- [oxlint](https://oxc.rs/) para linting

## Modo Mock vs. Modo API

El frontend funciona hoy 100% con datos simulados (`VITE_USE_MOCKS=true` en `.env`). Toda la lógica de negocio vive detrás de la interfaz `OrdersService` (`src/services/orders.types.ts`); las pantallas nunca llaman directamente al mock ni al cliente HTTP. Para conectar el backend real, basta con:

```bash
VITE_USE_MOCKS=false
VITE_API_BASE_URL=http://localhost:8000
```

No se requiere tocar ninguna pantalla. Ver `src/services/orders.service.ts` y `src/services/dashboard.service.ts`.

## Requisitos

- Node.js 20+ (recomendado 22 LTS)
- npm 10+

## Primeros pasos

```bash
# Instalar dependencias
npm install

# Variables de entorno (opcional, copiar y ajustar)
cp .env.example .env

# Levantar el servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Previsualizar el build de producción
npm run preview

# Lint
npm run lint
```

La app de desarrollo queda disponible en `http://localhost:5173`.

## Estructura del proyecto

```
src/
├── app/
│   ├── router/          # Definición de rutas (createBrowserRouter)
│   └── providers/        # Providers globales (Tooltip, etc.)
├── components/
│   ├── layout/           # AppLayout, AppSidebar, AppHeader
│   ├── shared/            # StatusBadge, StatTile, EmptyState, ErrorState…
│   └── ui/                 # Componentes shadcn/ui
├── pages/
│   ├── dashboard/         # Pantalla A — Dashboard
│   ├── orders/             # Pantalla B — Bandeja de órdenes
│   ├── order-review/      # Pantalla C — Detalle y revisión
│   └── results/            # Pantalla D — Resultados y exportación
├── hooks/                 # useOrders, useOrderWorkspace, useDashboard, useCsvDownload
├── services/
│   ├── api/                # Cliente HTTP real (FastAPI) por endpoint
│   ├── orders.service.ts   # Facade mock/API para órdenes
│   └── dashboard.service.ts
├── mocks/                 # Datos simulados + servicios mock (modo VITE_USE_MOCKS=true)
├── types/                 # Contratos de dominio y de API
├── lib/                   # env, format, labels, utils
├── main.tsx
└── index.css
```

## Añadir componentes de shadcn/ui

```bash
npx shadcn@latest add <componente>
```

Ejemplo: `npx shadcn@latest add dialog`

## Alias de importación

El proyecto usa el alias `@/*` apuntando a `src/*` (configurado en `tsconfig.app.json` y `vite.config.ts`):

```ts
import { Button } from '@/components/ui/button'
```

## Convenciones de ramas (sugerido)

- `main` — rama principal, siempre desplegable
- `feature/<nombre>` — nuevas funcionalidades
- `fix/<nombre>` — correcciones de bugs

## Variables de entorno

Ver `.env.example`. Las variables expuestas al cliente deben tener el prefijo `VITE_`.

## Repositorio remoto

Este repositorio se conecta a GitHub como `frontend-ISDIN`. Ver instrucciones de conexión en la documentación entregada por el equipo o preguntar al responsable del repositorio.
