#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../../" && pwd)"
PID_FILE="$SCRIPT_DIR/.e2e-dev-server.pid"
STARTED_FILE="$SCRIPT_DIR/.e2e-dev-server.started-by-skill"
E2E_WEB_URL="${E2E_WEB_BASE_URL:-http://localhost:3001}"
E2E_API_URL="${E2E_API_BASE_URL:-http://localhost:5001}"

http_code() {
  local url="$1"
  local code
  code="$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)"
  if [[ -z "$code" ]] || [[ "$code" == "000" ]]; then
    echo "000"
    return 1
  fi
  echo "$code"
}

is_running() {
  http_code "$E2E_API_URL/docs" >/dev/null && http_code "$E2E_WEB_URL" >/dev/null
}

status() {
  local api_code web_code
  api_code="$(http_code "$E2E_API_URL/docs" 2>/dev/null || true)"
  web_code="$(http_code "$E2E_WEB_URL" 2>/dev/null || true)"

  if is_running; then
    echo "running (api $E2E_API_URL/docs -> $api_code, web $E2E_WEB_URL -> $web_code)"
    exit 0
  fi
  echo "stopped (api $E2E_API_URL/docs -> $api_code, web $E2E_WEB_URL -> $web_code)"
  exit 1
}

wait_for_ready() {
  local attempts=0
  local max_attempts=60
  until is_running; do
    attempts=$((attempts + 1))
    if [[ $attempts -ge $max_attempts ]]; then
      echo "Timed out waiting for E2E servers (api $E2E_API_URL/docs, web $E2E_WEB_URL)" >&2
      if [[ -f "$SCRIPT_DIR/.e2e-dev-server.log" ]]; then
        echo "--- dev server log (last 50 lines) ---" >&2
        tail -n 50 "$SCRIPT_DIR/.e2e-dev-server.log" >&2
      fi
      exit 1
    fi
    sleep 2
  done
}

start() {
  if is_running; then
    echo "E2E dev servers already running (api $E2E_API_URL, web $E2E_WEB_URL)"
    return 0
  fi

  cd "$REPO_ROOT"
  pnpm dev:e2e >"$SCRIPT_DIR/.e2e-dev-server.log" 2>&1 &
  echo $! >"$PID_FILE"
  echo "1" >"$STARTED_FILE"
  wait_for_ready
  echo "E2E dev servers started (pid $(cat "$PID_FILE"), api $E2E_API_URL, web $E2E_WEB_URL)"
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
