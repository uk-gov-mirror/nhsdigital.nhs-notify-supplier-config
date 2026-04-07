# AGENTS.md
<!-- vale off -->

## Scope

This file is for **AI agents** working within NHS Notify repositories.
Humans should read `README.md` and the docs for how we actually work day to day.
Keep anything language or tool-specific in nested `AGENTS.md` files (for example under `infrastructure/terraform` or `packages`).

## Repository Layout (high level)

At a glance, the main areas are:

- `infrastructure/terraform/` – Terraform components, and shared modules for AWS accounts and environments.
- `packages/` – Supplier-config libraries, tools, and prototype/support modules.
- `src/` – Repository-level helper code (for example the Jekyll devcontainer support).
- `docs/` – Documentation site, ADRs, RFCS, and other long‑form docs.
- `.github/workflows/` and `.github/actions/` – GitHub Actions workflows and composite actions.
- `scripts/` – Helper scripts and tooling used by humans and workflows.
- `tests/` – Cross‑cutting tests and harnesses for the repo.

Agents should look for a nested `AGENTS.md` in or near these areas before making non‑trivial changes.

## Root package.json – role and usage

The root `package.json` is the orchestration manifest for this repo. It does not ship application code; it wires up shared dev tooling and delegates to workspace-level projects.

- Workspaces: The root workspace list currently uses the glob `packages/*`. New npm projects under that directory will be discovered automatically once they have a valid `package.json`; projects elsewhere still need an explicit workspace entry.
- Scripts: Provides top-level commands that fan out across workspaces using `--workspaces` (lint, typecheck, unit tests) plus shared helpers such as `generate-dependencies`.
- Dev tool dependencies: Centralises Jest, TypeScript, ESLint configurations and plugins to keep versions consistent across workspaces. Workspace projects should rely on these unless a local override is strictly needed.
- Overrides/resolutions: Pins transitive dependencies (e.g. Jest/react-is) to avoid ecosystem conflicts. Agents must not remove overrides without verifying tests across all workspaces.

Agent guidance:

- Before adding or removing a workspace, update the root `workspaces` array and ensure CI scripts still succeed with `npm run lint`, `npm run typecheck`, and `npm run test:unit` at the repo root.
- When adding repo-wide scripts, keep names consistent with existing patterns (e.g. `lint`, `lint:fix`, `typecheck`, `test:unit`, `generate-dependencies`) and prefer `--workspaces` fan-out.
- Do not publish from the root. If adding a new workspace intended for publication, mark that workspace package as `private: false` and keep the root as private.
- Validate changes by running the repo pre-commit hooks: `make githooks-run`.

Success criteria for changes affecting the root `package.json`:

- `npm run lint`, `npm run typecheck`, and `npm run test:unit` pass at the repo root.
- Workspace discovery is correct (new projects appear under `npm run typecheck --workspaces`).
- Workspace discovery is still correct for the existing wildcard entries and any newly added explicit workspace entries.

## What Agents Can / Can’t Do

Agents **can**:

- Propose changes to code, tests, GitHub workflows, Terraform, and docs.
- Suggest new scripts, Make targets, or composite actions by copying existing patterns.
- Run tests to validate proposed solutions.

Agents **must not**:

- Create, push, or merge branches or PRs.
- Introduce new technologies, providers, or big architectural patterns without clearly calling out that an ADR is needed.
- Invent secrets or hard‑code real credentials anywhere.

## Working With This Repo

- Use `make config` for common repo setup (notably git hooks and docs dependencies). For JavaScript package work you will usually also need a root `npm ci` or a package-local install.
- **Don’t guess commands.** Derive them from what’s already here or ask for guidance from the human user:
  - Prefer `Makefile` targets, `scripts/`, `.github/workflows/`, and `.github/actions/`.
- For Terraform, follow `infrastructure/terraform/{components,modules}` and respect `versions.tf`.
- Keep diffs small and focused. Avoid mixing refactors with behaviour changes unless you explain why.

## Quality Expectations

When proposing a change, agents should:

- Keep code formatted and idiomatic (Terraform, TypeScript, Bash, YAML).
- Stick to existing patterns where available (for example established package conventions under `packages/`, plus composite actions under `.github/actions`).
- Use available information on best practices within the specific area of the codebase.
- **Always** run local pre-commit hooks from the repo root with:

  ```sh
    pre-commit run \
    --config scripts/config/pre-commit.yaml
  ```

  to catch formatting and basic lint issues. Domain specific checks will be defined in appropriate nested AGENTS.md files.

- Suggest at least one extra validation step (for example `npm test` in a lambda, or triggering a specific workflow).
- Any required follow up activites which fall outside of the current task's scope should be clearly marked with a 'TODO: CCM-12345' comment. The human user should be prompted to create and provide a JIRA ticket ID to be added to the comment.

## Security & Safety

- All agent-generated changes **must** be reviewed and merged by a human.
- Provide a concise, clear summary of the proposed changes to make human review easier (what changed, why (refer directly to the guidance in relevant Agents.MD files when applicable), and how it was validated). It should be directly pastable into the PR description and make it clear that AI assistance was used.
- Never output real secrets or tokens. Use placeholders and rely on the GitHub/AWS secrets already wired into workflows.

## Escalation / Blockers

If you are blocked by an unavailable secret, unclear architectural constraint, missing upstream module, or failing tooling you cannot safely fix, stop and ask a single clear clarifying question rather than guessing.

## `nhs-notify-supplier-config` repo-specific notes

- `nhs-notify-repository-template/` is a checked-in reference copy of the template repo. Do not make normal feature changes there; only edit it when intentionally comparing with or syncing the template.
- The main application and domain work in this repo is concentrated under `packages/`. Use local `README` files, manifests, and tests there to understand package-specific behaviour before making non-trivial changes.
- Important repo data inputs live at the top level and under `packages/ui/data/`, especially `specifications.json`, `specifications.xlsx`, and `letterVariants.csv`. Treat these as source material for supplier configuration work and preserve their formats unless the task explicitly changes them.
- `make build` currently builds the Jekyll docs site (`docs/`); it is not a full monorepo build for the supplier-config packages.
- CI currently still includes some template-era scaffolding. In particular, root workspace scripts and some `make test-*` paths do not yet cover every directory under `packages/`, so validate the specific package or area you changed directly as well as running the standard repo hooks.
- Suggested extra validation by area:
  - `packages/`: run the changed package's local scripts (for example tests, typecheck, or generators) in addition to repo-level hooks.
  - `docs/`: run `(cd docs && make build)` when changing Jekyll content or templates.
  - root config/docs guidance: run `pre-commit run --config scripts/config/pre-commit.yaml` from the repo root.
- If you touch the root `package.json`, verify that the workspace globs and script fan-out still match the repo layout. Avoid incidental “tidying” unless the task requires it and you can validate the downstream impact.
