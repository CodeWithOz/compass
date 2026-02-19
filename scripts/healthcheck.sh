#!/usr/bin/env sh
set -eu

# 1) App healthy?
if curl -fsS "http://127.0.0.1:3000/api/health" >/dev/null 2>&1; then
  exit 0
fi

# 2) Still in prestart phase (migrations running)?
if [ -f "/tmp/.prestart" ]; then
  exit 0
fi

# 3) Neither app up nor starting: unhealthy
exit 1
