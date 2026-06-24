#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../../" && pwd)"
PID_FILE="$SCRIPT_DIR/.e2e-dev-server.pid"
STARTED_FILE="$SCRIPT_DIR/.e2e-dev-server.started-by-skill"
E2E_URL="${E2E_WEB_BASE_URL:-http://localhost:3001}"

http_code() {
  curl -s -o /dev/null -w "%{http_code}" "$E2E_URL" 2>/dev/null || echo "000"
}

is_running() {
  local code
  code="$(http_code)"
  [[ "$code" != "000" ]]
}

status() {
  if is_running; then
    echo "running ($E2E_URL -> $(http_code))"
    exit 0
  fi
  echo "stopped"
  exit 1
}

wait_for_ready() {
  local attempts=0
  local max_attempts=60
  until is_running; do
    attempts=$((attempts + 1))
    if [[ $attempts -ge $max_attempts ]]; then
      echo "Timed out waiting for $E2E_URL" >&2
      exit 1
    fi
    sleep 2
  done
}

start() {
  if is_running; then
    echo "E2E dev server already running at $E2E_URL"
    return 0
  fi

  cd "$REPO_ROOT"
  pnpm dev:e2e >"$SCRIPT_DIR/.e2e-dev-server.log" 2>&1 &
  echo $! >"$PID_FILE"
  echo "1" >"$STARTED_FILE"
  wait_for_ready
  echo "E2E dev server started (pid $(cat "$PID_FILE"))"
}

stop() {
  if [[ ! -f "$STARTED_FILE" ]]; then
    echo "Server was not started by fix-tests scripts; leaving it running"
    return 0
  fi

  if [[ -f "$PID_FILE" ]]; then
    local pid
    pid="$(cat "$PID_FILE")"
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
      sleep 1
      kill -9 "$pid" 2>/dev/null || true
    fi
    rm -f "$PID_FILE"
  fi

  rm -f "$STARTED_FILE"
  echo "E2E dev server stopped"
}

ensure() {
  if is_running; then
    return 0
  fi
  start
}

COMMAND="${1:-status}"

case "$COMMAND" in
  status) status ;;
  start) start ;;
  stop) stop ;;
  wait) wait_for_ready ;;
  ensure) ensure ;;
  *)
    echo "Usage: e2e-dev-server.sh {status|start|stop|wait|ensure}" >&2
    exit 1
    ;;
esac
