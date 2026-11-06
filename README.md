# ISDIN Order Hub 2.0 — Frontend

Frontend del proyecto de hackatón **ISDIN Order Hub 2.0**: automatiza la recepción, homologación, revisión y exportación a SAP de órdenes de compra de clientes ISDIN Chile. Este repositorio contiene únicamente el frontend; el backend (FastAPI) y el módulo Processing viven en sus propios repositorios.

## Stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) como bundler y servidor de desarrollo
- [Tailwind CSS v4](https://tailwindcss.com/) para estilos utilitarios
- [shadcn/ui](https://ui.shadcn.com/) (preset Nova, Base UI + Lucide) para componentes accesibles
- [React Router](https://reactrouter.com/) para la navegación
- [oxlint](https://oxc.rs/) para linting

## Conexión con el backend

El frontend habla siempre con el backend real (FastAPI); **ya no existe el modo con datos simulados**. El contrato es el del
backend, con el mismo vocabulario que Processing (`src/types/api.ts`): estados `REQUIRES_REVIEW` / `READY` / `EXPORTED`,
métodos de homologación `EXACT_CLIENT_CODE`, `SUGGESTED_REVIEW`, `MANUAL`… y códigos de alerta abiertos. El frontend **no define
estados propios** ni calcula nada: muestra lo que dice el backend y cada acción devuelve la OC completa.

```bash
cp .env.example .env     # VITE_API_BASE_URL=http://localhost:8710
npm run dev              # http://localhost:5710
```

Cómo trabaja una persona con una OC (`src/hooks/useOrderWorkspace.ts`):

- Al abrirla **reserva** la OC (`POST /lock`) y la renueva con un latido; al salir la libera. Si la tiene otra persona, la ve en
  solo lectura con su nombre. Un aviso en tiempo real (SSE) refresca la pantalla cuando otra persona la cambia.
- Cada acción envía `X-Actor` (quién), `Idempotency-Key` (anti doble clic), `If-Match` (versión vista) y `X-Lock-Token`
  (la reserva). Códigos: 409 versión vieja o estado inválido · 422 lo rechazó Processing (mensaje en español) · 423 reservada.
- **Usuario provisional:** hasta que exista inicio de sesión, se pide el correo y se guarda en el navegador (`src/lib/actor.ts`).

Pantallas: Dashboard · Agregar documento · Órdenes (bandeja y por cliente) · Revisión de la OC · Aprobación y exportación ·
Convertidas a CSV · **Documentos** (incluye los que fallaron, con su motivo, reproceso y sugerencia de perfil) · **Clientes**
(registrar clientes nuevos).

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
├── hooks/                 # useOrders, useOrderWorkspace (reserva + versión + SSE), useDashboard, useDocuments, useClients
├── services/
│   └── api/                # Cliente HTTP real (FastAPI): http-client + orders/documents/clients
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
