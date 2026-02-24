# ADR 0001: Use dotenv-cli to inject .env.local into Prisma CLI commands

**Status:** Accepted
**Date:** 2026-02-24

## Context

This project stores local environment variables in `.env.local` (Next.js convention). On production, environment variables are injected directly by the host runtime — no `.env` file is read.

Prisma 7 uses `prisma.config.ts` to configure the datasource URL, reading `process.env.DATABASE_URL` directly. Because `.env.local` is not automatically loaded into the process environment, the CLI cannot find `DATABASE_URL` unless something injects it first.

An earlier approach used the `dotenv` npm package inside `prisma.config.ts` to load `.env.local` programmatically. This created two problems:

1. **Unnecessary prod dependency** — the `dotenv` package ran on every production start even though production never needs it.
2. **Coupling** — env loading logic was embedded inside Prisma config code rather than at the invocation boundary.

## Decision

Use [dotenv-cli](https://github.com/entropitor/dotenv-cli) (a `devDependency`) to inject `.env.local` into the environment before every Prisma CLI invocation. The form differs depending on the context:

- **Inside npm scripts** — npm adds `node_modules/.bin` to PATH, so the short form works:
  ```
  dotenv -e .env.local -- npx prisma <command>
  ```
- **Inside shell scripts / CI** — PATH cannot be assumed; use the explicit local binary:
  ```
  ./node_modules/.bin/dotenv -e .env.local -- ./node_modules/.bin/prisma <command>
  ```

This injects `.env.local` at the invocation boundary so Prisma sees `DATABASE_URL` without any runtime dotenv import in `prisma.config.ts`.

## Consequences

### For npm scripts (`package.json`)

All `db:*` and `generate` scripts include the prefix. npm automatically adds `node_modules/.bin` to PATH when running scripts, so `dotenv` and `npx prisma` both resolve locally:

```jsonc
"db:migrate": "dotenv -e .env.local -- npx prisma migrate dev",
"db:deploy": "dotenv -e .env.local -- npx prisma migrate deploy",
"db:studio": "dotenv -e .env.local -- npx prisma studio",
"db:reset":  "dotenv -e .env.local -- npx prisma migrate reset",
"generate":  "dotenv -e .env.local -- npx prisma generate"
```

**Always use these npm scripts.** Never call `npx prisma` bare in a local dev context.

### For shell scripts (`scripts/setup.sh`)

The setup script installs dependencies before running Prisma, so both local binaries are present by the time `run_prisma()` executes. Both are pinned by full path to eliminate PATH ambiguity:

```bash
local DOTENV_BIN="$PROJECT_DIR/node_modules/.bin/dotenv"
local PRISMA_BIN="$PROJECT_DIR/node_modules/.bin/prisma"
local ENV_FILE="$PROJECT_DIR/.env.local"

"$DOTENV_BIN" -e "$ENV_FILE" -- "$PRISMA_BIN" migrate deploy
"$DOTENV_BIN" -e "$ENV_FILE" -- "$PRISMA_BIN" generate
```

### For production

No change — `dotenv-cli` is a `devDependency` and is never installed in production builds. Production environments inject `DATABASE_URL` through their own runtime (Docker, Coolify, etc.).

### Rule for future contributors

> If you add a new `prisma` CLI invocation — in a script, Makefile, CI step, or shell session — prefix it with `dotenv -e .env.local --` (npm scripts) or the explicit local binary form (shell scripts / CI).
