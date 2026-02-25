# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for Compass.

ADRs capture significant technical decisions — why they were made, what alternatives were considered, and what consequences follow. They are the long-form companion to the brief notes in `AGENTS.md`.

## Index

| # | Title | Status |
|---|-------|--------|
| [0001](0001-dotenv-cli-for-prisma.md) | Use dotenv-cli to inject .env.local into Prisma CLI commands | Accepted |

## Format

Each ADR uses the [MADR](https://adr.github.io/madr/) (Markdown Architectural Decision Records) template: **Status → Context → Decision → Consequences**.

## Adding a new ADR

1. Copy an existing file as a starting point.
2. Increment the number (`0002-…`).
3. Add a row to the index table above.
