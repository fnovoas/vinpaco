#!/usr/bin/env bash
set +e

DEV_PID_FILE=".dev.pid"
SERVE_PID_FILE=".serve.pid"
SERVE_PORT=8080

kill_pid_tree() {
  local pid="$1"
  [ -n "$pid" ] || return 0
  kill -0 "$pid" 2>/dev/null || return 0
  kill "$pid" 2>/dev/null
  pkill -P "$pid" 2>/dev/null
}

kill_by_pattern() {
  local pattern="$1"
  local pid
  while IFS= read -r pid; do
    [ -z "$pid" ] && continue
    [ "$pid" = "$$" ] || [ "$pid" = "$PPID" ] && continue
    kill "$pid" 2>/dev/null
    pkill -P "$pid" 2>/dev/null
  done < <(pgrep -f "$pattern" 2>/dev/null)
}

echo "Deteniendo servidores locales..."

for f in "$DEV_PID_FILE" "$SERVE_PID_FILE"; do
  if [ -f "$f" ]; then
    kill_pid_tree "$(cat "$f" 2>/dev/null)"
  fi
done

kill_by_pattern 'esbuild static/js/main.ts --bundle --outfile=static/js/visor.js'
kill_by_pattern 'npm exec live-server'
kill_by_pattern 'node_modules/.bin/live-server'
kill_by_pattern "live-server --no-browser --port=${SERVE_PORT}"

sleep 3
fuser -k "${SERVE_PORT}/tcp" 2>/dev/null

if command -v lsof >/dev/null 2>&1; then
  lsof -ti ":${SERVE_PORT}" | xargs -r kill -9 2>/dev/null
fi

rm -f "$DEV_PID_FILE" "$SERVE_PID_FILE"

if ss -ltn 2>/dev/null | grep -q ":${SERVE_PORT} "; then
  echo "Aviso: el puerto ${SERVE_PORT} sigue en uso."
  exit 1
fi

echo "Detenido."
