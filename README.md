# Vassembly

Vassembly is an AI agent orchestration platform. Users describe work as **tasks**, run them asynchronously with LLM-backed **agents**, and organize capability through **specializations**, **skills**, **system agents**, and **MCP** (Model Context Protocol) integrations.

The platform covers the full lifecycle of AI-assisted work: authentication, credential management, task execution, human-in-the-loop questions, real-time progress, and extensible tool and skill execution.

## Capabilities

- **Tasks** — Create tasks from natural-language input, track execution, pause/resume/retry, and assign agents. Background title generation and real-time progress updates.
- **Agents** — User-owned agents and a platform catalog of system agents with per-user AI connection preferences.
- **Skills & specializations** — Reusable skill definitions with script execution, linked to a specialization catalog for domain tagging and classification.
- **MCP integrations** — Discovery catalog, user configuration, agent assignment, and connection testing.
- **AI integrations** — Store and test per-user LLM credentials (ChatGPT, Gemini, LM Studio, DeepSeek, and others via LangChain).
- **Human-in-the-loop** — Task questions let agents pause and ask the user for input before continuing.
- **Auth & account management** — Registration, login, email verification, password reset, profile settings, onboarding, and account deletion.

## Architecture

The repo is a **pnpm + Turborepo** monorepo organized in layers:

| Layer | Location | Role |
|-------|----------|------|
| Apps | `apps/` | User-facing surfaces and API gateway |
| Services | `services/` | Use-case orchestration (transport-agnostic handlers) |
| Domains | `domains/` | Business logic, models, persistence, GraphQL schema fragments |
| Packages | `packages/` | Shared infrastructure (DB clients, GraphQL, errors, config, etc.) |
| UI | `ui/` | Reusable React components, hooks, and Storybook |

**API convention:** GraphQL for reads, REST for commands. The API gateway (`apps/api`) wires Fastify routes and GraphQL resolvers to service handlers; business logic lives in domains and services.

### Apps

| Package | Description |
|---------|-------------|
| `@vassembly/web` | Main Next.js product UI |
| `@vassembly/api` | Fastify REST + GraphQL API gateway |
| `@vassembly/docs` | Documentation site (Next.js) |

### Domains

`agent`, `ai-integration`, `auth-token`, `mcp`, `refresh-token`, `skill`, `specialization`, `system-agent`, `task`, `task-progress`, `task-questions`, `user`, `user-mcp-config`

### Services

`agent`, `auth`, `mcp`, `skill`, `specialization`, `task`, `task-questions`

## Tech stack

- **TypeScript** 5.9, Node ≥ 18
- **Frontend:** Next.js 16, React 19, SCSS
- **Backend:** Fastify 5, GraphQL, Zod
- **Database:** MongoDB (Atlas Local via Docker for development)
- **Cache:** In-memory or Redis
- **AI:** LangChain unified client with multi-provider support
- **Skill execution:** Sandboxed script runner (Docker / Firecracker backends)
- **Testing:** Vitest (unit), Playwright BDD (e2e)

## Getting started

### Prerequisites

- Node.js ≥ 18
- [pnpm](https://pnpm.io/) 9
- Docker (for local MongoDB)

### Setup

```bash
pnpm install
cp .env.example .env   # then fill in required values
pnpm dev
```

Key environment variables include `MONGODB_URL`, `JWT_SECRET`, and `PLATFORM_AI_*` for platform-owned background LLM work. See `.env.example` and `turbo.json` (`globalEnv`) for the full list.

### Local MongoDB

The `@vassembly/client-mongodb` package starts a MongoDB Atlas Local container via Docker Compose on port `27017`:

```bash
pnpm --filter @vassembly/client-mongodb dev
```

## Development commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all packages and apps in development mode |
| `pnpm build` | Build all packages |
| `pnpm test` | Run unit tests across the workspace |
| `pnpm lint` | Lint all packages |
| `pnpm check-types` | Type-check all packages |
| `pnpm storybook` | Start the UI component Storybook |
| `pnpm dev:e2e` | Start MongoDB + API + Web with e2e config |
| `pnpm test:e2e:web` | Run Playwright BDD tests (servers must be running) |

Default local ports: Web `3000`, API `5000`, Docs `3001`. E2E uses Web `3001` and API `5001` — see [docs/E2E_TESTING.md](docs/E2E_TESTING.md).

## Project structure

```
vassembly/
├── apps/          # web, api, docs
├── domains/       # Business domains (commands, queries, models, persistence)
├── services/      # Handler orchestration consumed by the API
├── packages/      # Shared libraries (clients, server, graphql, errors, …)
├── ui/            # Design system, feature components, Storybook
├── docs/          # Feature PRDs, architecture docs, E2E guide
└── scripts/       # One-off migrations
```

Feature-level design documents live in [docs/features/](docs/features/).

## Further reading

- [E2E testing guide](docs/E2E_TESTING.md)
- [Monorepo package categories](.cursor/rules/monorepo-package-categories.mdc)
- [API calling conventions](.cursor/rules/api-calling-conventions.mdc) — GraphQL for reads, REST for commands
