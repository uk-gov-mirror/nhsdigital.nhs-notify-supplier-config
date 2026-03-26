---
layout: page
title: Supplier config admin UI plan
nav_order: 2
description: Proposed implementation plan for a new supplier config admin UI
summary: Supplier config admin UI plan
is_not_draft: false
last_modified_date: 2026-03-26
owner: NHS Notify
author: AI-assisted draft
---
<!-- vale off -->

## Goal

Stand up a new supplier-config admin UI in this repository using the deployment and authentication shape from `nhs-notify-web-template-management`, while removing template-management and client-group concepts and keeping the scope focused on supplier configuration only.

## Scope

### In scope

- New top-level `frontend/` Next.js app copied from `nhs-notify-web-template-management/frontend`
- Root workspace updates so `frontend/` is included alongside `packages/*`
- One new backend lambda under `lambdas/` that handles all UI routes for now
- Terraform for Amplify hosting, API, auth, and DynamoDB
- Supplier-config CRUD and read views for the entities already modelled in this repository
- NHS styling and layout patterns
- Versioned persistence with optimistic locking and audit metadata

### Out of scope

- Client configuration
- Template management workflows
- Client group management
- Splitting the backend into multiple lambdas
- Reworking supplier-config domain schemas beyond what is required to persist and edit them

## Comparison findings

### `nhs-notify-web-template-management`

Use this as the structural baseline for:

- the top-level `frontend/` placement
- the root workspace entry pattern
- Amplify deployment wiring
- generation of `amplify_outputs.json` from Terraform outputs or environment variables
- Cognito + Amplify auth flow in the frontend
- NHS header, footer, middleware, and CSP handling

Do **not** carry across these areas:

- template and routing-config routes
- template preview/upload/proof flows
- backend client packages tied to template management
- client-id based authorisation and request-to-be-added flows
- multiple backend lambdas per route

### `nhs-notify-admin-ui`

Use this as a lightweight reference for:

- simple CRUD-oriented admin page flows
- overview/dashboard landing page concepts
- React Query usage for client-side cache invalidation
- modal-based create/edit interactions where they genuinely help

Do **not** carry across these areas:

- client, campaign, quota, or other non-supplier-config sections
- placeholder domain models that do not map to this repository

### `CCM-15826-supplier-config-ui`

This branch usefully highlights the supplier-config entity set the UI needs to think about:

- pack specifications
- envelopes
- papers
- postages
- inserts
- suppliers
- volume groups
- supplier packs
- supplier allocations
- supplier reports

It also shows useful schema-first thinking via the existing Zod models, but it should **not** be used as the main implementation baseline because it currently leans on:

- `packages/ui/` rather than the requested top-level `frontend/`
- tRPC rather than the requested single lambda/API approach
- file-backed local persistence instead of DynamoDB
- Tailwind/shadcn patterns rather than the NHS-styled frontend we want to preserve

## Recommended target architecture

### Frontend

Create a new top-level `frontend/` app by copying `nhs-notify-web-template-management/frontend` and then stripping it down to a clean admin shell.

Keep:

- Amplify/Next.js integration
- middleware and CSP setup
- NHS layout and global styles
- auth provider and session helpers
- app shell components such as header/footer
- test setup patterns where still relevant

Replace with supplier-config-specific routes:

- `/` dashboard
- `/suppliers`
- `/pack-specifications`
- `/postages`
- `/papers`
- `/envelopes`
- `/inserts`
- `/volume-groups`
- `/supplier-packs`
- `/supplier-allocations`
- `/reports/suppliers`
- `/history/[type]/[id]`

Recommendation: start with server-rendered list/detail pages and progressively add client-side editing where it improves UX. Keep React Query only for cacheable CRUD interactions; avoid introducing another API abstraction if simple `fetch` wrappers will do.

### Authentication and authorisation

Simplify the copied auth model to a single application role:

- authenticated users must be in the Cognito group `admin`
- no client-id claim checks
- no per-client routing or group selection
- frontend middleware should only enforce sign-in plus membership of `admin`
- backend should independently verify the same requirement from the token claims

### Backend API

Create one new lambda, for example `lambdas/supplier-config-api`, as an npm workspace.

Recommended initial shape:

- one Lambda handler for all routes
- one API Gateway/HTTP API integration
- internal route dispatch on `method + pathname`
- Zod-based request/response validation using the existing schema package under `packages/events`
- shared service layer for DynamoDB access and optimistic locking

Suggested initial route groups:

- `GET /api/config/:type`
- `GET /api/config/:type/:id`
- `POST /api/config/:type`
- `PUT /api/config/:type/:id`
- `DELETE /api/config/:type/:id`
- `GET /api/history/:type/:id`
- `GET /api/reports/suppliers`
- `POST /api/publish` (only if event publication is brought into phase 1)

This keeps the backend simple now while leaving room to split by domain later.

### Domain model usage

Use the existing repository schema package as the source of truth for entity shapes wherever possible:

- `packages/events/src/domain/pack-specification.ts`
- `packages/events/src/domain/supplier.ts`
- `packages/events/src/domain/volume-group.ts`
- `packages/events/src/domain/letter-variant.ts`
- `packages/events/src/domain/supplier-pack.ts`
- `packages/events/src/domain/supplier-allocation.ts`
- `packages/events/src/domain/postage.ts`
- `packages/events/src/domain/envelope.ts`
- `packages/events/src/domain/paper.ts`
- `packages/events/src/domain/insert.ts`

Recommendation: define API DTOs close to these schemas instead of inventing a second parallel model.

## DynamoDB design

The requirement says records should be identified by `PK = <TYPE>#<ID>` and also retain versioned changes with optimistic locking, modified timestamp, and modified user.

The cleanest way to satisfy both is a **single-table design with a sort key**.

### Table keys

- `PK = <TYPE>#<ID>`
- `SK = LATEST` for the current materialised record
- `SK = v#<VERSION>` for immutable history entries

### Current record shape

`LATEST` item should include:

- `PK`
- `SK = LATEST`
- `type`
- `id`
- `version`
- `status`
- `modifiedAt`
- `modifiedBy`
- `createdAt`
- `createdBy`
- `data` (full config object snapshot)

### History record shape

Each version item should include:

- `PK`
- `SK = v#<VERSION>`
- `version`
- `modifiedAt`
- `modifiedBy`
- `changeType` such as `CREATED`, `UPDATED`, `DELETED`
- `data` (snapshot at that version)

### Write pattern

Use a DynamoDB transaction for create/update/delete:

1. Read `PK + SK = LATEST`
2. Check expected `version` from the request
3. Write the new immutable `v#<VERSION+1>` item
4. Update or replace the `LATEST` item with `version + 1`

This gives optimistic locking and a full audit trail.

### Listing pattern

To support lists by type without scanning the whole table, add a GSI such as:

- `GSI1PK = TYPE#<TYPE>`
- `GSI1SK = <ID>` or `<NAME>`

Only `LATEST` items need to be projected into this index.

## Terraform plan

The current repository only has scaffold/example Terraform, so this should be treated as new real infrastructure rather than an incremental tweak.

### Reuse from `nhs-notify-web-template-management`

Copy the overall pattern for:

- `acct`, `app`, and `branch` style component separation where appropriate
- Amplify app resource
- Amplify branch module usage
- IAM role for Amplify
- CloudWatch logging for Amplify
- route53/domain wiring if this UI needs a first-class hostname
- Terraform outputs used to generate frontend Amplify config

### New infrastructure to add

For this repository, the `app` layer should own:

- Amplify app and branch for `frontend/`
- API Gateway/HTTP API
- single `supplier-config-api` lambda
- DynamoDB supplier-config table
- Cognito user pool, user pool client, and `admin` group if not consuming an existing user pool
- IAM policies for:
  - DynamoDB CRUD + transactional writes
  - CloudWatch logs
  - optional event publication if phase 1 includes publish flows

### Simplifications from the template-management setup

Do not copy the full multi-lambda API module shape. Instead:

- create a smaller Terraform module or component for one lambda-backed API
- wire a single integration and route set
- keep Lambda packaging simple with one archive build
- only add extra queues/topics when a concrete use case appears

## Recommended implementation phases

### Phase 1: foundation

- Copy `nhs-notify-web-template-management/frontend` to top-level `frontend/`
- Add `frontend` to root `workspaces`
- Add frontend root scripts mirroring the template-management repo where useful
- Remove template-management routes, components, tests, and backend dependencies
- Keep NHS shell, auth plumbing, and Amplify output generation pattern

### Phase 2: backend and persistence

- Create `lambdas/supplier-config-api`
- Add workspace entry for the lambda if it becomes an npm project
- Implement route dispatch, auth checks, and DTO validation
- Create DynamoDB table with version-history design
- Implement repository functions for each config type

### Phase 3: infrastructure

- Replace example Terraform component with real app component(s)
- Add Amplify app/branch resources
- Add API + lambda resources
- Add DynamoDB table and IAM wiring
- Add Terraform outputs consumed by the frontend config generator

### Phase 4: feature delivery

Deliver CRUD in this order to match likely value and the earlier branch's discoveries:

1. postages
2. papers
3. envelopes
4. inserts
5. pack specifications
6. suppliers
7. volume groups
8. supplier packs
9. supplier allocations
10. supplier reports and history view

This order reduces dependency pain because pack specifications depend on several of the simpler reference entities.

### Phase 5: publish and audit

- add history UI per record
- add optimistic-lock conflict handling in the frontend
- add publish workflow if changes need to emit events
- add approval or guard rails later if needed

## Important design choices

### Styling

Use NHS styling from the copied `nhs-notify-web-template-management` frontend and/or `nhsuk-frontend` / `nhsuk-react-components`.

Do not use the Tailwind-heavy approach from `CCM-15826-supplier-config-ui` as the primary UI styling model.

### API contract

Prefer a straightforward REST-style API for the first cut. The branch's tRPC approach demonstrated entity coverage, but the user has explicitly asked for one lambda handling backend routes in one place.

### Persistence boundary

Do not keep the file-backed repository approach from the earlier branch except perhaps as a local-only test fixture helper. Production behaviour should be DynamoDB-backed from the start.

### Audit and optimistic locking

The frontend should always send the current `version` on update/delete requests. The backend should reject stale writes with a clear conflict response so the UI can prompt the user to refresh.

## Risks and follow-ups

- Reusing versus creating Cognito resources needs confirming during implementation.
- If event-bus publication is required in phase 1, we should reuse existing packages such as `@supplier-config/event-builder` rather than creating new event logic.
- If list pages need richer filtering or sorting, add GSIs deliberately rather than scanning the table.
- The current repo root scripts only cover `packages/*`; adding `frontend/` and a lambda workspace means the root script fan-out needs careful validation.

## Concrete change list for the first implementation PR

1. Add `frontend/` copied from `nhs-notify-web-template-management/frontend`
2. Update root `package.json` workspaces to include `frontend`
3. Add frontend scripts and `create-amplify-outputs` helper at the repo root
4. Create `lambdas/supplier-config-api/`
5. Add Terraform component/module(s) for Amplify, API, lambda, Cognito, and DynamoDB
6. Add a history-aware DynamoDB repository layer
7. Deliver CRUD for reference entities and pack specifications
8. Add at least one supplier report/read-only page
9. Add tests for auth gating, optimistic locking, and API validation

## Validation plan for the implementation work

Minimum validation for the delivery PR should be:

```sh
npm run lint
npm run typecheck
npm run test:unit
pre-commit run --config scripts/config/pre-commit.yaml
```

Area-specific validation should also include:

```sh
npm run typecheck --workspace frontend
npm run lint --workspace frontend
npm run test:unit --workspace frontend
npm run typecheck --workspace lambdas/supplier-config-api
npm run test:unit --workspace lambdas/supplier-config-api
```

Suggested extra validation after infrastructure work:

- generate Amplify outputs from Terraform outputs and verify local sign-in works
- run a Terraform plan for the new app component
- exercise an optimistic-lock conflict by updating the same record twice with a stale version
