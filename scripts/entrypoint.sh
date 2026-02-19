#!/usr/bin/env sh
set -eu

MARKER="/tmp/.prestart"
touch "$MARKER"

cleanup() {
  rm -f "$MARKER"
}
trap cleanup EXIT INT TERM

echo "[prestart] running migrations"
npx prisma migrate deploy
echo "[prestart] done"

rm -f "$MARKER"

echo "[server] starting"
exec node server.js
