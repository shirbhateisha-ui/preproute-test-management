# PrepRoute — Test Management App

A test management application for creating tests, adding MCQ questions, and publishing them. Built for the PrepRoute frontend evaluation task.

## Tech Stack

- **React 19 + TypeScript** (Vite)
- **Redux Toolkit + RTK Query** — state management and API calls
- **React Router v6** — routing + protected routes
- **React Hook Form + Zod** — forms & validation
- **Tailwind CSS v4** — styling (design tokens from the Figma)
- **shadcn/ui** — accessible UI primitives (Radix + Tailwind), under `components/ui`
- **react-hot-toast**, **lucide-react**

> The HTTP layer uses RTK Query's `fetchBaseQuery` (built on the native Fetch API), with the JWT injected via `prepareHeaders`. No separate Axios dependency.

## Getting Started

```bash
npm install
npm run dev
```

Create a `.env` file with:

```
VITE_API_BASE_URL=/api
```

Requests to `/api` are proxied to the staging backend (see `vite.config.ts`) to avoid CORS during development.

Build: `npm run build` · Lint: `npm run lint` · Preview build: `npm run preview`

Test credentials: `vedant-admin` / `vedant123`

## Project Structure

```
src/
  app/            store.ts, hooks.ts (typed useAppDispatch/Selector)
  slice/
    api/          api-slice.ts (base RTK Query: baseQuery + auth header)
    auth/         auth-slice.ts (JWT + user, localStorage), auth-api.ts (login)
  types/          feature type definitions (api.ts, auth.ts)
  components/     ProtectedRoute.tsx; ui/ holds shadcn components
  pages/          LoginPage, DashboardPage, CreateTest, AddQuestions, PreviewPublish
  lib/            shared utilities (incl. cn() for shadcn)
  index.css       Tailwind + design tokens
  App.tsx         router
```

RTK Query endpoints are added per feature via `injectEndpoints` against the base API in `slice/api/api-slice.ts`.
