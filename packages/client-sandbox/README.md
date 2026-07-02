# @vassembly/client-sandbox

Strategy-based sandbox execution client for local Docker and cloud Firecracker backends.

## Exports

- `SandboxBackendStrategy` — execute scripts and delete workspaces
- `LocalDockerSandboxBackend` — HTTP adapter to a local sandbox worker
- `CloudFirecrackerSandboxBackend` — HTTP adapter to a cloud Firecracker worker
- `createSandboxClient` — selects backend from `ExecutionConfig`
- `WorkspaceManager` — tracks active workspace IDs and delegates cleanup
- `startLocalSandboxWorker` — starts the local HTTP worker process

## Local setup

1. Install dependencies from the monorepo root:

   ```bash
   pnpm install
   ```

2. Start the local sandbox worker (default port `4010`):

   ```bash
   pnpm --filter @vassembly/client-sandbox worker
   ```

   Override the port by calling `startLocalSandboxWorker({ port })` programmatically.

3. Point application config at the worker:

   ```bash
   export SKILLS_EXECUTION_BACKEND=local
   export SKILLS_EXECUTION_WORKER_URL=http://localhost:4010
   ```

## Docker (optional)

For production-like isolation, run script workloads in gVisor-backed containers. The local worker in this package uses process isolation in a temp workspace under `.data/sandbox-workspaces/` for development without Docker.

Optional Docker prerequisites for full local parity:

- Docker Engine
- gVisor (`runsc`) runtime

## Worker HTTP contract

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/execute` | Run a script; body matches `ExecuteParams` |
| `DELETE` | `/workspace/:id` | Remove workspace directory |

### Language I/O

| Language | Script file | Input |
|----------|-------------|-------|
| `python` | `skill_script.py` | `input.json`, `SKILL_INPUT_PATH=./input.json` |
| `nodejs` | `skill_script.mjs` | `input.json`, `SKILL_INPUT_PATH=./input.json` |
| `bash` | `skill_script.sh` | `input.json`, `SKILL_INPUT_PATH=./input.json` |
| `terminal` | inline `/bin/sh -c` | `input.json`, `SKILL_INPUT_PATH=./input.json` |

Consumed by `services/agent` tool handlers only.
