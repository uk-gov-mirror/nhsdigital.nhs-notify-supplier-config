# AGENTS.md
<!-- vale off -->

## Scope

This file applies to work under `frontend/`.
Follow the root `AGENTS.md` first, then use this file for frontend-specific guidance.

## What this package is

- A Next.js App Router frontend workspace.
- Uses `nhsuk-frontend` Sass/CSS alongside React components and Amplify auth UI.
- Package-local scripts live in `frontend/package.json` and are the source of truth for package verification.

## Change guidance

- Keep changes small and focused.
- Prefer existing package entrypoints over deep imports when bringing in framework assets or styles.
- Treat `.next/` as generated output; do not edit generated files.
- If you change routing, auth, styles, Next config, ESLint config, or dependencies, run the full verification flow below.

## Known fragile areas

### Sass imports

- `frontend/src/styles/app.scss` must import NHS styles from the package entrypoint:

  ```scss
  @use "nhsuk-frontend";
  ```

- Do not switch this back to a deep path such as `nhsuk-frontend/dist/nhsuk` unless you have verified that the installed package still resolves that path in this workspace.
- After changing Sass imports or style tooling, run `npm run build --workspace frontend` from the repo root to catch stylesheet resolution problems.

### App Router query params and auth pages

- Build-time and prerender-sensitive routes should prefer resolving query params in the server `page.tsx` via `searchParams`, then passing plain props into client components.
- Be careful when introducing `useSearchParams()` in client components used by prerendered routes such as `frontend/src/app/auth/page.tsx`; this can require a suspense boundary or cause build failures.
- If you touch auth flow or redirect handling, test both the production build and a manual auth URL such as `/auth?redirect=%2F`.

### ESLint and generated Next.js files

- `frontend/.next/` must stay ignored by ESLint.
- If you change `frontend/eslint.config.mjs`, verify that `.next/**` is still ignored and run lint after a build, not only before it.
- A clean lint result before `next build` is not sufficient; generated `.next/types/**` files can reveal config regressions only after a build has run.

## Required verification flow

Run these commands from the repository root when making non-trivial changes in `frontend/`:

```sh
pre-commit run --config scripts/config/pre-commit.yaml
rm -rf frontend/.next
npm run build --workspace frontend
npm run lint --workspace frontend
npm run typecheck --workspace frontend
npm run test:unit --workspace frontend
```

## Verification notes

- Use the clean build step to surface Sass resolution and App Router prerender issues.
- Keep the post-build lint step to catch accidental linting of generated `.next` artifacts.
- `typecheck` and `test:unit` both create mock Amplify outputs automatically via package scripts; prefer the existing scripts over ad hoc commands.
- If you change auth, routing, middleware, or base-path handling, add a quick manual browser check in development as an extra validation step.

## Minimum review summary for frontend changes

Include in your handoff or PR summary:

- what changed in `frontend/`
- why the change was needed
- that the root pre-commit checks were run
- that `build`, `lint`, `typecheck`, and `test:unit` were run for the frontend workspace
- any manual route or auth checks you performed
