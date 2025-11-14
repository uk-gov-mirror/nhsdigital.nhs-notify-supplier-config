# NHS Notify Supplier Config

This repository contains code and schemas for NHS Notify supplier configuration management and event publishing.

## Purpose

- **Configuration Model:** Defines and manages supplier, quota, routing, and related configuration for NHS Notify
  suppliers.
- **Event Schemas:** Publishes configuration changes as events to an event bus for consumption by other system
  components.

## Design

### Configuration Management

A phased approach will be used to improve supplier configuration management:

1. **Libraries & Validation:** Standardise configuration and naming, reduce manual errors, and improve auditability.
2. **API Layer:** Centralise access to supplier configuration data.
3. **Web UI:** Enable operations/admin teams to manage supplier configuration with validation and audit trails.

Configuration entities include:

- `supplier_quota`, `channel_supplier`, `queue`, `suppression_filter`, `govuknotify_account`

Configuration changes are validated, auditable, and published to environments via an event bus.

### Event Publishing

Configuration changes are published as events to a central event bus, enabling decoupled updates across bounded
contexts (core, print supplier API, template/routing UI, user management, etc.).

Event publishing strategies include:

- CLI tools (tactical)
- Admin/Web UI (strategic, single source of truth)

## Event Builder CLI

The Excel parsing and event publishing functionality now lives in the `event-builder` package, exposed via a single CLI with subcommands.

### Commands

- `parse` – Parse an Excel specification file and emit JSON to stdout (packs + variants).
- `publish` – Build specialised (non-draft) LetterVariant events and publish them to an AWS EventBridge bus.

### Quick Start

```bash
# Parse
npm run cli:events --workspace=nhs-notify-supplier-config-event-builder -- parse -f ./example_specifications.xlsx

# Dry-run publish (no AWS calls)
npm run cli:events --workspace=nhs-notify-supplier-config-event-builder -- publish -f ./example_specifications.xlsx -b my-bus --dry-run

# Publish (requires AWS credentials with events:PutEvents)
npm run cli:events --workspace=nhs-notify-supplier-config-event-builder -- publish -f ./example_specifications.xlsx -b my-bus -r eu-west-2
```

### Envelope Defaults

Source: `/control-plane/supplier-config/<env>/<service>` built from `EVENT_ENV` (default `dev`) and `EVENT_SERVICE` (default `events`).

Other generated fields:

- `severitytext` INFO / `severitynumber` 2
- `partitionkey` LetterVariant id
- `sequence` Incrementing zero-padded 20-digit counter per run
- `traceparent` Random W3C trace context value
- `dataschema` & `dataschemaversion` fixed to example `1.0.0`

Set environment overrides:

```bash
EVENT_ENV=staging EVENT_SERVICE=config npm run cli:events --workspace=nhs-notify-supplier-config-event-builder -- publish -f specs.xlsx -b staging-bus -r eu-west-2
```

## Usage

### Testing

There are `make` tasks for you to configure to run your tests. Run
`make test` to see how they work. You should be able to use the same
entry points for local development as in your CI pipeline.

## Contributing

Describe or link templates on how to raise an issue, feature request
or make a contribution to the codebase. Reference the other
documentation files, like

- Environment setup for contribution, i.e. `CONTRIBUTING.md`
- Coding standards, branching, linting, practices for development and
  testing
- Release process, versioning, changelog
- Backlog, board, roadmap, ways of working
- High-level requirements, guiding principles, decision records, etc.

## Contacts

Provide a way to contact the owners of this project. It can be a team,
an individual or information on the means of getting in touch via
active communication channels, e.g. opening a GitHub discussion,
raising an issue, etc.

## Licence

Unless stated otherwise, the codebase is released under the MIT
License. This covers both the codebase and any sample code in the
documentation.

Any HTML or Markdown documentation
is [© Crown Copyright](https://www.nationalarchives.gov.uk/information-management/re-using-public-sector-information/uk-government-licensing-framework/crown-copyright/)
and available under the terms of
the [Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/).
