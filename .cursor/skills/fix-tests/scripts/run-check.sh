#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../../" && pwd)"

CHECK="${1:-}"
shift || true

FILTERS=()
TEST_PATH=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --filter)
      FILTERS+=("$2")
      shift 2
      ;;
    --test)
      TEST_PATH="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$CHECK" ]]; then
  echo "Usage: run-check.sh <build|lint|types|unit|e2e> [--filter PKG ...] [--test PATH]" >&2
  exit 1
fi

cd "$REPO_ROOT"

build_filter_args() {
  local args=()
  for filter in "${FILTERS[@]}"; do
    args+=(--filter="$filter")
  done
  if [[ ${#args[@]} -eq 0 ]]; then
    return 0
  fi
  printf '%s ' "${args[@]}"
}

run_turbo() {
  local task="$1"
  if [[ ${#FILTERS[@]} -eq 0 ]]; then
    pnpm turbo run "$task"
    return
  fi
  # shellcheck disable=SC2046
  pnpm turbo run "$task" $(build_filter_args)
}

case "$CHECK" in
  build)
    run_turbo build
    ;;
  lint)
    run_turbo lint
    ;;
  types)
    run_turbo check-types
    ;;
  unit)
    if [[ -n "$TEST_PATH" && ${#FILTERS[@]} -eq 1 ]]; then
      pnpm --filter "${FILTERS[0]}" test -- "$TEST_PATH"
    elif [[ ${#FILTERS[@]} -eq 1 ]]; then
      pnpm turbo run test --filter="${FILTERS[0]}"
    else
      run_turbo test
    fi
    ;;
  e2e)
    "$SCRIPT_DIR/e2e-dev-server.sh" stop
    "$SCRIPT_DIR/e2e-dev-server.sh" ensure

    e2e_exit=0
    set +e
    if [[ -n "$TEST_PATH" ]]; then
      dotenv -e .env -e .env.e2e -o -- pnpm --filter @vassembly/web test:e2e -- "$TEST_PATH"
      e2e_exit=$?
    elif [[ ${#FILTERS[@]} -gt 0 ]]; then
      # shellcheck disable=SC2046
      dotenv -e .env -e .env.e2e -o -- pnpm turbo run test:e2e $(build_filter_args)
      e2e_exit=$?
    else
      pnpm test:e2e:web
      e2e_exit=$?
    fi
    set -e

    "$SCRIPT_DIR/e2e-dev-server.sh" stop
    exit "$e2e_exit"
    ;;
  *)
    echo "Unknown check: $CHECK (expected build, lint, types, unit, or e2e)" >&2
    exit 1
    ;;
esac
