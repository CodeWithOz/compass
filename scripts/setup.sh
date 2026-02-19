#!/usr/bin/env bash
# =============================================================================
# Compass — Worktree Setup
# =============================================================================
# Bootstraps a local dev environment for this worktree.
# Safe to run repeatedly (idempotent).
#
# What it does:
#   1. Verifies prerequisites (node, npm, docker)
#   2. Starts a Docker Postgres container unique to this worktree
#   3. Creates .env.local with the correct DATABASE_URL
#   4. Installs npm dependencies
#   5. Runs Prisma migrations + generates the client
#
# Usage:
#   ./scripts/setup.sh            # full setup
#   ./scripts/setup.sh --db-only  # only start/reset the database
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

DB_USER="compass"
DB_PASS="compass"
DB_NAME="compass"

# Derive a stable, unique container name + port from the worktree directory.
# This ensures each worktree gets its own isolated Postgres.
if command -v shasum > /dev/null 2>&1; then
  WORKTREE_HASH=$(echo -n "$PROJECT_DIR" | shasum | cut -c1-8)
else
  WORKTREE_HASH=$(echo -n "$PROJECT_DIR" | sha1sum | cut -c1-8)
fi
CONTAINER_NAME="compass-pg-${WORKTREE_HASH}"

# Map hash to a port in the range 54320–54999 to avoid conflicts.
HASH_DEC=$((16#${WORKTREE_HASH:0:4}))
DB_PORT=$(( (HASH_DEC % 680) + 54320 ))

STATE_FILE="$PROJECT_DIR/.db-state"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
info()  { printf "\033[1;34m→\033[0m %s\n" "$*"; }
ok()    { printf "\033[1;32m✓\033[0m %s\n" "$*"; }
warn()  { printf "\033[1;33m!\033[0m %s\n" "$*"; }
fail()  { printf "\033[1;31m✗\033[0m %s\n" "$*" >&2; exit 1; }

require() {
  command -v "$1" >/dev/null 2>&1 || fail "$1 is required but not found. Please install it."
}

# ---------------------------------------------------------------------------
# Prerequisites
# ---------------------------------------------------------------------------
check_prereqs() {
  info "Checking prerequisites…"
  require node
  require npm
  require docker

  # Verify Docker daemon is running
  if ! docker info >/dev/null 2>&1; then
    fail "Docker is installed but the daemon is not running. Please start Docker Desktop."
  fi

  ok "Prerequisites satisfied (node $(node -v), npm $(npm -v), docker)"
}

# ---------------------------------------------------------------------------
# Database (Docker Postgres)
# ---------------------------------------------------------------------------
start_database() {
  info "Setting up Postgres (container: $CONTAINER_NAME, port: $DB_PORT)…"

  # If container already exists and is running, we're good
  if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    ok "Postgres already running on port $DB_PORT"
    return
  fi

  # If container exists but is stopped, start it
  if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    info "Starting existing container…"
    docker start "$CONTAINER_NAME" >/dev/null
    ok "Postgres started on port $DB_PORT"
    return
  fi

  # Create a new container
  info "Creating new Postgres container…"
  docker run -d \
    --name "$CONTAINER_NAME" \
    -e POSTGRES_USER="$DB_USER" \
    -e POSTGRES_PASSWORD="$DB_PASS" \
    -e POSTGRES_DB="$DB_NAME" \
    -p "${DB_PORT}:5432" \
    --restart unless-stopped \
    postgres:16-alpine \
    >/dev/null

  # Wait for Postgres to be ready
  info "Waiting for Postgres to accept connections…"
  for i in $(seq 1 30); do
    if docker exec "$CONTAINER_NAME" pg_isready -U "$DB_USER" >/dev/null 2>&1; then
      ok "Postgres ready on port $DB_PORT"

      # Save state for teardown
      echo "CONTAINER_NAME=$CONTAINER_NAME" > "$STATE_FILE"
      echo "DB_PORT=$DB_PORT" >> "$STATE_FILE"
      return
    fi
    sleep 0.5
  done

  fail "Postgres did not become ready in 15 seconds"
}

# ---------------------------------------------------------------------------
# Environment file
# ---------------------------------------------------------------------------
write_env() {
  local ENV_FILE="$PROJECT_DIR/.env.local"
  local DB_URL="postgres://${DB_USER}:${DB_PASS}@localhost:${DB_PORT}/${DB_NAME}?sslmode=disable"

  if [ -f "$ENV_FILE" ]; then
    # Update DATABASE_URL if it changed (e.g. port drift)
    if grep -q "^DATABASE_URL=" "$ENV_FILE"; then
      local CURRENT_URL
      CURRENT_URL=$(grep "^DATABASE_URL=" "$ENV_FILE" | head -1 | cut -d'"' -f2)
      if [ "$CURRENT_URL" != "$DB_URL" ]; then
        info "Updating DATABASE_URL in .env.local (port: $DB_PORT)…"
        # Use a temp file for portable sed
        sed "s|^DATABASE_URL=.*|DATABASE_URL=\"${DB_URL}\"|" "$ENV_FILE" > "${ENV_FILE}.tmp"
        mv "${ENV_FILE}.tmp" "$ENV_FILE"
        ok "DATABASE_URL updated"
      else
        ok ".env.local already configured"
      fi
    else
      echo "" >> "$ENV_FILE"
      echo "DATABASE_URL=\"${DB_URL}\"" >> "$ENV_FILE"
      ok "DATABASE_URL added to .env.local"
    fi
  else
    info "Creating .env.local from .env.example…"
    if [ -f "$PROJECT_DIR/.env.example" ]; then
      cp "$PROJECT_DIR/.env.example" "$ENV_FILE"
      sed "s|^DATABASE_URL=.*|DATABASE_URL=\"${DB_URL}\"|" "$ENV_FILE" > "${ENV_FILE}.tmp"
      mv "${ENV_FILE}.tmp" "$ENV_FILE"
    else
      cat > "$ENV_FILE" <<EOF
# Database
DATABASE_URL="${DB_URL}"

# AI Providers
ANTHROPIC_API_KEY=""
OPENAI_API_KEY=""
DEFAULT_AI_PROVIDER="claude"
EOF
    fi
    ok ".env.local created"
    warn "Remember to add your API keys to .env.local"
  fi

  # Save state for teardown
  echo "CONTAINER_NAME=$CONTAINER_NAME" > "$STATE_FILE"
  echo "DB_PORT=$DB_PORT" >> "$STATE_FILE"
}

# ---------------------------------------------------------------------------
# Dependencies
# ---------------------------------------------------------------------------
install_deps() {
  if [ -d "$PROJECT_DIR/node_modules" ] && [ -f "$PROJECT_DIR/node_modules/.package-lock.json" ]; then
    info "Checking if dependencies are up to date…"
    # Quick check: compare package-lock.json mtime vs node_modules
    if [ "$PROJECT_DIR/package-lock.json" -nt "$PROJECT_DIR/node_modules/.package-lock.json" ]; then
      info "Lock file changed, reinstalling…"
      npm ci
    else
      ok "Dependencies up to date"
      return
    fi
  else
    info "Installing dependencies…"
    npm ci
  fi
  ok "Dependencies installed"
}

# ---------------------------------------------------------------------------
# Prisma
# ---------------------------------------------------------------------------
run_prisma() {
  info "Running Prisma migrations…"
  if deploy_output=$(npx prisma migrate deploy 2>&1); then
    ok "Migrations applied"
  else
    # migrate deploy failed — check if it's the expected "no migrations yet" case
    # (e.g. fresh project with no migration files) and fall back to migrate dev.
    # Any other error (DB connection, schema drift) is printed so the cause is visible.
    if echo "$deploy_output" | grep -qi "no pending migrations\|no migration\|no schema changes"; then
      info "No existing migrations found — creating initial migration…"
    else
      printf "%s\n" "$deploy_output" >&2
      info "migrate deploy failed — trying migrate dev --name init as fallback…"
    fi
    npx prisma migrate dev --name init
    ok "Migrations applied"
  fi

  info "Generating Prisma client…"
  npx prisma generate
  ok "Prisma client generated"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
main() {
  echo ""
  echo "  ╔══════════════════════════════════════╗"
  echo "  ║      Compass — Worktree Setup        ║"
  echo "  ╚══════════════════════════════════════╝"
  echo ""
  info "Project: $PROJECT_DIR"
  info "Worktree ID: $WORKTREE_HASH"
  echo ""

  check_prereqs

  if [ "${1:-}" = "--db-only" ]; then
    start_database
    write_env
    echo ""
    ok "Database ready! URL: postgres://${DB_USER}:${DB_PASS}@localhost:${DB_PORT}/${DB_NAME}"
    return
  fi

  start_database
  write_env
  install_deps
  run_prisma

  echo ""
  echo "  ╔══════════════════════════════════════╗"
  echo "  ║           Setup Complete!            ║"
  echo "  ╚══════════════════════════════════════╝"
  echo ""
  ok "Database:  localhost:$DB_PORT ($CONTAINER_NAME)"
  ok "Run:       npm run dev"
  ok "Studio:    npm run db:studio"
  ok "Teardown:  npm run teardown"
  echo ""
}

main "$@"
