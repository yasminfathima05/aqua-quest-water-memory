# Aqua Quest: Water Memory

A short playable water-conservation game that turns everyday choices into remembered habits and a real-world action.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/aqua-quest run dev` — run the Aqua Quest web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + TypeScript + Tailwind CSS
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/aqua-quest/src/App.tsx` — game flow, quest rules, local persistence, and screen rendering
- `artifacts/aqua-quest/src/index.css` — Aqua Quest visual system, responsive layout, and motion
- `artifacts/aqua-quest` — deployable web artifact
- `artifacts/api-server` — shared API scaffold; not required by the current game MVP

## Architecture decisions

- The MVP is frontend-only and deterministic so the 3–5 minute judging demo works without accounts, paid services, or network dependencies.
- Progress is stored in `localStorage` so an in-progress run and the selected real-world quest survive refreshes.
- The six-quest flow uses repeated behaviour and a memory echo instead of an AI system; the learning mechanic is explicit and reliable.
- The design uses illustrated CSS/SVG-style visuals and motion rather than stock imagery.

## Product

Players protect a shared water supply across six everyday decisions, see immediate consequences, revisit an earlier habit through Water Memory, receive a final result, and choose a practical real-world quest. Completing the follow-through unlocks the Real Water Guardian badge.

## User preferences

- Keep the prototype focused on a polished playable game rather than a generic educational website or dashboard.

## Gotchas

- The app is a root-routed artifact; use the managed `artifacts/aqua-quest: web` workflow rather than starting Vite manually.
- The game intentionally has no backend or external integrations in the MVP.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
