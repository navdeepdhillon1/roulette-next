# Repository Guidelines

## Project Structure & Module Organization
- `app/` hosts all routed pages and server components; UI entry points live in `app/(sections)` while `app/layout.tsx` wires shared providers.
- Reusable UI and logic is split into `components/`, `hooks/`, `stores/`, and `lib/`; keep exports lean and colocate supporting styles or helpers with their feature.
- Persistent assets (icons, fonts, images) belong in `public/`; long-form references or product notes go in `docs/`.
- Type definitions should live in `types/` and be re-exported when helpful to avoid deep import paths.

## Build, Test, and Development Commands
- `npm run dev` runs the Next.js dev server with Turbopack at `http://localhost:3000`.
- `npm run build` produces an optimized production build; run before shipping changes that touch routing or build-time data.
- `npm run start` serves the production bundle locally for smoke testing.
- `npm run lint` runs ESLint with the shared config (`eslint.config.mjs`); resolve warnings before opening a PR.

## Coding Style & Naming Conventions
- Use TypeScript throughout; prefer `PascalCase` for components/hooks, `camelCase` for variables, and descriptive store keys in `zustand` slices.
- Follow the existing 2-space indentation in React and configuration files; keep JSX props on separate lines when they exceed ~80 characters.
- Favor functional components with explicit return types and memoize heavy selectors in `stores/`.
- Tailwind CSS is the primary styling approach; group utility classes from layout → color → effects for readability.

## Testing Guidelines
- Automated tests are not yet wired in; at minimum, back up UI changes with `npm run lint` and a `npm run dev` smoke pass.
- When introducing tests, colocate `.test.tsx` files beside the component they cover and use React Testing Library for component behavior.
- Document manual QA steps in the PR description until an automated suite is adopted.

## Commit & Pull Request Guidelines
- Mirror the existing Conventional Commit-style history (`feat:`, `fix:`, `chore:`); include scope in parentheses when narrowing the change (e.g., `feat(analysis): add number stats view`).
- Keep commits focused and self-contained; amend or squash noisy WIP commits before pushing.
- Pull requests should outline the change, link to any tracking issue, list validation steps, and include screenshots for UI updates.

## Environment & Configuration
- Set Supabase credentials in `.env.local` using the keys shown in `.env.example`; never commit secrets.
- Review `next.config.ts` and `postcss.config.mjs` before modifying build behavior, and call out any config changes in your PR notes.
