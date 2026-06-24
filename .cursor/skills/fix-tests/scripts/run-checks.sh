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

FAILED=0
for check in "${CHECKS[@]}"; do
  check="$(echo "$check" | xargs)"
  if [[ -z "$check" ]]; then
    continue
  fi
  echo "=== Running $check ==="
  if ! "$SCRIPT_DIR/run-check.sh" "$check" "$@"; then
    FAILED=1
    echo "=== $check FAILED ===" >&2
  else
    echo "=== $check PASSED ==="
  fi
done

if [[ "$FAILED" -ne 0 ]]; then
  exit 1
fi
