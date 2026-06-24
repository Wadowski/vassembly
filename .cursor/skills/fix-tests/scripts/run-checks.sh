#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ $# -lt 1 ]]; then
  echo "Usage: run-checks.sh <check1,check2,...> [--filter PKG ...] [--test PATH]" >&2
  echo "Checks: build, lint, types, unit, e2e" >&2
  exit 1
fi

CHECKS_CSV="$1"
shift

IFS=',' read -r -a CHECKS <<<"$CHECKS_CSV"

NON_E2E_CHECKS=()
HAS_E2E=0

for check in "${CHECKS[@]}"; do
  check="$(echo "$check" | xargs)"
  if [[ -z "$check" ]]; then
    continue
  fi
  if [[ "$check" == "e2e" ]]; then
    HAS_E2E=1
  else
    NON_E2E_CHECKS+=("$check")
  fi
done

run_check() {
  local check="$1"
  echo "=== Running $check ==="
  if ! "$SCRIPT_DIR/run-check.sh" "$check" "$@"; then
    echo "=== $check FAILED ===" >&2
    return 1
  fi
  echo "=== $check PASSED ==="
  return 0
}

FAILED=0

for check in "${NON_E2E_CHECKS[@]}"; do
  if ! run_check "$check" "$@"; then
    FAILED=1
  fi
done

if [[ "$HAS_E2E" -eq 1 ]]; then
  if ! run_check e2e "$@"; then
    FAILED=1
  fi
fi

if [[ "$FAILED" -ne 0 ]]; then
  exit 1
fi
