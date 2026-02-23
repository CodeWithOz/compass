#!/usr/bin/env bash
# =============================================================================
# Compass — Worktree Teardown
# =============================================================================
# Removes the Docker Postgres container for this worktree.
# Does NOT delete .env.local or node_modules (use git clean for that).
#
# Usage:
#   ./scripts/teardown.sh            # stop and remove container
#   ./scripts/teardown.sh --keep     # stop but keep container (preserves data)
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
STATE_FILE="$PROJECT_DIR/.db-state"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
info()  { printf "\033[1;34m→\033[0m %s\n" "$*"; }
ok()    { printf "\033[1;32m✓\033[0m %s\n" "$*"; }
warn()  { printf "\033[1;33m!\033[0m %s\n" "$*"; }

# ---------------------------------------------------------------------------
# Resolve container name
# ---------------------------------------------------------------------------
if [ -f "$STATE_FILE" ]; then
  # shellcheck source=/dev/null
  source "$STATE_FILE"
else
  # Recompute from project path (same logic as setup.sh)
  WORKTREE_HASH=$(echo -n "$PROJECT_DIR" | shasum | cut -c1-8)
  CONTAINER_NAME="compass-pg-${WORKTREE_HASH}"
fi

# ---------------------------------------------------------------------------
# Teardown
# ---------------------------------------------------------------------------
echo ""
info "Tearing down Compass environment…"
info "Container: $CONTAINER_NAME"
echo ""

if ! docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  ok "No container found — nothing to do"
  [ -f "$STATE_FILE" ] && rm "$STATE_FILE"
  exit 0
fi

if [ "${1:-}" = "--keep" ]; then
  info "Stopping container (keeping data)…"
  docker stop "$CONTAINER_NAME" >/dev/null 2>&1 || true
  ok "Container stopped. Run 'npm run setup' to restart."
else
  info "Stopping and removing container…"
  docker stop "$CONTAINER_NAME" >/dev/null 2>&1 || true
  docker rm "$CONTAINER_NAME" >/dev/null 2>&1 || true
  ok "Container removed"
fi

[ -f "$STATE_FILE" ] && rm "$STATE_FILE"

echo ""
ok "Teardown complete"
echo ""
