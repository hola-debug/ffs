# Repository Guidelines

## Project Structure & Module Organization
The entry point lives in `src/main.tsx`, which mounts `App.tsx`. Shared UI sits under `src/components`, route-level views in `src/pages`, and cross-cutting helpers in `src/hooks`, `src/contexts`, `src/lib`, and `src/config`. Visual assets belong in `src/assets`, while static files (favicons, manifest) reside in `public`. SQL migrations, Supabase edge-function payloads, and integration docs live in `supabase/` and the root `GUIA_*` files—keep infrastructure changes alongside those references. Build artifacts land in `dist/` (production) or `dev-dist/` (local previews); never edit them manually.

## Build, Test, and Development Commands
- `npm install` – sync dependencies; rerun whenever `package.json` changes.
- `npm run dev` – start the Vite dev server with HMR at `http://localhost:5173`.
- `npm run lint` – run the project-wide ESLint config (`eslint.config.js`).
- `npm run build` – produce an optimized bundle into `dist/`.
- `npm run preview` – serve the build output for smoke testing.
- `./test-webhook.sh` – trigger the webhook harness used for PocketEditor/N8N flows; update URLs inside the script before running in new environments.

## Coding Style & Naming Conventions
Use TypeScript everywhere; prefer functional React components with hooks over classes. Indent with two spaces, keep lines under ~100 chars, and favor descriptive names. Components and pages use `PascalCase`, hooks start with `use`, utility functions stay camelCase. Tailwind classes belong in JSX, but extract repeated styles into helper components. Run `npm run lint` before pushing; ESLint plus the React/TypeScript presets enforce import order, unused vars, and hook rules.

## Testing Guidelines
Automated tests are not yet wired in; prioritize deterministic manual verification. When adding coverage, colocate `*.test.tsx` beside the component under test and follow `ComponentName.test.tsx`. Exercise new data flows via `npm run dev` plus Supabase staging and document steps in the relevant `GUIA_*` file. For serverless endpoints, validate payloads with `test-webhook.sh` and capture console output in the PR.

## Commit & Pull Request Guidelines
Recent history favors short, present-tense summaries (often Spanish), e.g., `modal de crear bolsa`. Keep commits scoped to one concern, note migrations or env changes explicitly, and reference Linear/Jira issue IDs when available. PRs should include: a short narrative (what/why), screenshots or clips for UI deltas, a checklist of commands run (`dev`, `lint`, `test-webhook` if applicable), and links to any Supabase SQL or edge-function updates. Mention required env vars or feature flags so reviewers can reproduce locally.

## Security & Configuration Tips
Secrets live in `.env.local`; never commit keys. Required variables include `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (see `src/lib/supabaseClient.ts`). When touching Supabase edge functions (`src/lib/edgeFunctions.ts`), confirm their endpoints match the deployed function names and document any schema expectations inside `supabase/` scripts. For third-party SDK upgrades, record breaking changes in `RESUMEN_CAMBIOS.md` to keep downstream agents aligned.
