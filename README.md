# Frontend ISDIN — Hackathon

Frontend del proyecto de la hackatón **ISDIN**. Construido con React, TypeScript, Vite, Tailwind CSS y shadcn/ui, listo para desarrollo en equipo.

## Stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) como bundler y servidor de desarrollo
- [Tailwind CSS v4](https://tailwindcss.com/) para estilos utilitarios
- [shadcn/ui](https://ui.shadcn.com/) (preset Nova, Base UI + Lucide) para componentes accesibles
- [oxlint](https://oxc.rs/) para linting

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
├── assets/            # Imágenes, íconos, fuentes
├── components/
│   ├── layout/         # Header, Footer, estructura general de página
│   └── ui/              # Componentes generados por shadcn/ui
├── hooks/              # Custom hooks reutilizables
├── lib/                # Utilidades (incluye cn() de shadcn/ui)
├── pages/              # Vistas / páginas de la aplicación
├── services/           # Llamadas a APIs externas
├── types/              # Tipos y contratos compartidos
├── App.tsx             # Composición raíz de la app
├── main.tsx            # Punto de entrada de React
└── index.css           # Estilos globales + Tailwind + tema shadcn/ui
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
