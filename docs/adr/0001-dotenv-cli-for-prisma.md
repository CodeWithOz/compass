# ADR 0001: Use dotenv-cli to inject .env.local into Prisma CLI commands

**Status:** Accepted
**Date:** 2026-02-24

## Context

This project stores local environment variables in `.env.local` (Next.js convention) rather than the `.env` file that Prisma's CLI auto-loads. On production, environment variables are injected directly by the host runtime — no `.env` file is read at all.

An earlier approach used the `dotenv` npm package inside Prisma configuration files to load `.env.local` programmatically. This created two problems:

1. **Unnecessary prod dependency** — the `dotenv` package ran on every production start even though production never needs it.
2. **Coupling** — env loading logic was embedded inside Prisma config code rather than at the invocation boundary.

## Decision

Use [dotenv-cli](https://github.com/entropitor/dotenv-cli) (a `devDependency`) to prefix every Prisma CLI invocation with:

```
dotenv -e .env.local -- npx prisma <command>
```

This injects `.env.local` into the process environment before Prisma starts, so Prisma sees `DATABASE_URL` without needing any runtime dotenv import inside its own config files.

## Consequences

### For npm scripts (`package.json`)

All `db:*` and `generate` scripts already include the prefix:

```jsonc
"db:migrate": "dotenv -e .env.local -- npx prisma migrate dev",
"db:deploy": "dotenv -e .env.local -- npx prisma migrate deploy",
"db:studio": "dotenv -e .env.local -- npx prisma studio",
"db:reset":  "dotenv -e .env.local -- npx prisma migrate reset",
"generate":  "dotenv -e .env.local -- npx prisma generate"
```

**Always use these npm scripts.** Never call `npx prisma` bare in a local dev context.

### For shell scripts (`scripts/setup.sh`)

The setup script installs dependencies before running Prisma, so by the time Prisma is invoked `node_modules/.bin/dotenv` is present. The `run_prisma()` function uses the local binary explicitly:

```bash
local DOTENV_BIN="$PROJECT_DIR/node_modules/.bin/dotenv"
local ENV_FILE="$PROJECT_DIR/.env.local"

"$DOTENV_BIN" -e "$ENV_FILE" -- npx prisma migrate deploy
"$DOTENV_BIN" -e "$ENV_FILE" -- npx prisma generate
```

Using the full path prevents any PATH ambiguity inside the setup script.

### For production

No change — `dotenv-cli` is a `devDependency` and is never installed in production builds. Production environments inject `DATABASE_URL` through their own runtime (Docker, Coolify, etc.).

### Rule for future contributors

> If you add a new `prisma` CLI invocation — in a script, Makefile, CI step, or shell session — prefix it with `dotenv -e .env.local --`.
