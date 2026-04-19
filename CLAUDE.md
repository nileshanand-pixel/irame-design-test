# Irame MVP

## Overview
Vite + React 18 SPA for audit workflow management. Uses Redux Toolkit + React Query for state, shadcn/Radix UI for components, and Tailwind CSS for styling.

## Commands
```bash
npm run dev       # Start dev server (serves on localhost:5173)
npm run build     # Production build
npm run lint      # ESLint (Airbnb config)
npm run format    # Prettier
npm run preview   # Preview production build
```

## Tech Stack
- **Framework:** Vite 5 + React 18
- **State:** Redux Toolkit + React Query (hybrid)
- **Forms:** React Hook Form + Zod validation
- **UI:** shadcn/ui + Radix UI primitives
- **Styling:** Tailwind CSS 3.4 with custom design tokens (purple/primary color scale)
- **Charts:** Recharts, ECharts, Chart.js, D3
- **Auth:** JWT-based (jwt-decode)
- **Monitoring:** Sentry
- **Analytics:** Mixpanel

## Project Structure
```
src/
  api/          # API calls & services
  components/   # UI components (ui/, features/, elements/, error/)
  config/       # App configuration
  constants/    # App constants
  contexts/     # React contexts
  hooks/        # Custom hooks (extensive library)
  lib/          # Utilities & Sentry setup
  providers/    # App/theme providers
  redux/        # Redux store & slices
  routes/       # Route definitions
  utils/        # Utility functions
  workers/      # Web workers
```

## Conventions
- Path alias: `@` maps to `src/`
- Environment variables use `VITE_` prefix
- Airbnb ESLint config with Prettier integration
- Husky + lint-staged for pre-commit hooks
- Design tokens defined in `tailwind.config.js` (purple/primary scales, pill status variants)
- Always serve dev server on localhost:5173
