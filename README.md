# PrepRoute — Test Management App

A 5-page test management application: log in, browse tests, create/edit test details, add MCQ questions, then preview & publish. Built for the PrepRoute frontend evaluation task.

## Tech Stack
- **React 18 + TypeScript** (Vite)
- **Redux Toolkit + RTK Query** — state + all API calls (caching, tag invalidation)
- **React Router v6** — routing + protected routes
- **React Hook Form + Zod** — forms & validation
- **Tailwind CSS v4** — styling (design tokens from the Figma)
- **react-hot-toast**, **lucide-react**, **DOMPurify**

> The HTTP layer uses RTK Query's `fetchBaseQuery` (built on the native Fetch API), with the JWT injected via `prepareHeaders`. No separate Axios dependency.

## Getting Started
```bash
npm install
npm run dev
```

Create a `.env` file with:
```
VITE_API_BASE_URL=https://admin-moderator-backend-staging.up.railway.app/api
```
Build: `npm run build` · Preview build: `npm run preview`

Test credentials: `vedant-admin` / `vedant123`

## Project Structure
```
src/
  app/            store.ts, hooks.ts (typed useAppDispatch/Selector)
  features/
    api/          apiSlice.ts (RTK Query — one createApi)
    auth/         authSlice.ts (JWT + user, localStorage)
  components/     ProtectedRoute.tsx, shared UI
  pages/          Login, Dashboard, CreateTest, AddQuestions, PreviewPublish
  types/          shared API types
  index.css       Tailwind + design tokens
  App.tsx         router
```
