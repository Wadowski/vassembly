# MCP Servers

Local Docker fleet for MCP integrations. Run from the **monorepo root**:

```bash
pnpm mcp-servers:up        # default: arxiv, notion, wikipedia (3 containers)
pnpm mcp-servers:up:full   # all 29 containers
pnpm mcp-servers:down
```

`docker-compose.override.yml` assigns the `full` profile to every service except `arxiv-mcp`, `notion-mcp`, and `wikipedia-mcp`.

## Default dev subset (3 containers)

| Slug | Proxy | Port | URL |
|------|-------|------|-----|
| `arxiv-mcp` | [mcpproxy-go](https://github.com/smart-mcp-proxy/mcpproxy-go) | 4112 | `http://localhost:4112/mcp` |
| `notion-mcp` | mcp-key-proxy | 4006 | `http://localhost:4006/mcp` |
| `wikipedia-mcp` | mcpproxy-go | 4110 | `http://localhost:4110/mcp` |

## MCP fleet (29 containers, `--profile full`)

| Slug | Proxy | Port | URL |
|------|-------|------|-----|
| `github-mcp` | [mcp-key-proxy](https://github.com/onprem-ai/mcp-key-proxy) | 4101 | `http://localhost:4101/mcp` |
| `context7` | — | 4001 | `http://localhost:4001/mcp` |
| `mongodb-mcp` | mcp-key-proxy | 4104 | `http://localhost:4104/mcp` |
| `redis-mcp` | mcp-key-proxy | 4105 | `http://localhost:4105/mcp` |
| `aws-mcp` | mcp-key-proxy | 4106 | `http://localhost:4106/mcp` |
| `vercel-mcp` | — | 4003 | `http://localhost:4003/mcp` |
| `terraform-mcp` | mcp-key-proxy | 4107 | `http://localhost:4107/mcp` |
| `sentry-mcp` | mcp-key-proxy | 4108 | `http://localhost:4108/mcp` |
| `datadog-mcp` | — | 4004 | `http://localhost:4004/mcp` |
| `brave-search-mcp` | mcp-key-proxy | 4109 | `http://localhost:4109/mcp` |
| `wikipedia-mcp` | mcpproxy-go | 4110 | `http://localhost:4110/mcp` |
| `pubmed-mcp` | mcp-key-proxy | 4111 | `http://localhost:4111/mcp` |
| `arxiv-mcp` | mcpproxy-go | 4112 | `http://localhost:4112/mcp` |
| `google-search-mcp` | mcp-key-proxy | 4113 | `http://localhost:4113/mcp` |
| `notion-mcp` | mcp-key-proxy | 4006 | `http://localhost:4006/mcp` |
| `obsidian-mcp` | mcp-key-proxy | 4114 | `http://localhost:4114/mcp` |
| `granola-mcp` | — | 4007 | `http://localhost:4007/mcp` |
| `discord-mcp` | mcp-key-proxy | 4115 | `http://localhost:4115/mcp` |
| `gmail-mcp` | — | 4008 | `http://localhost:4008/mcp` |
| `google-calendar-mcp` | — | 4009 | `http://localhost:4009/mcp` |
| `todoist-mcp` | mcp-key-proxy | 4116 | `http://localhost:4116/mcp` |
| `linear-mcp` | — | 4010 | `http://localhost:4010/mcp` |
| `stripe-mcp` | — | 4011 | `http://localhost:4011/mcp` |
| `figma-mcp` | — | 4012 | `http://localhost:4012/mcp` |
| `google-sheets-mcp` | — | 4013 | `http://localhost:4013/mcp` |
| `canva-mcp` | — | 4014 | `http://localhost:4014/mcp` |
| `google-maps-mcp` | mcp-key-proxy | 4117 | `http://localhost:4117/mcp` |
| `openweather-mcp` | mcp-key-proxy | 4118 | `http://localhost:4118/mcp` |
| `spotify-mcp` | — | 4016 | `http://localhost:4016/mcp` |

Platform settings (`MCP_HOST`, `MCP_PROXY_POOL_SIZE`, ports) are loaded via `@vassembly/config` from the root `.env`.

User credentials are **not** stored in container env — they are sent per-request as HTTP headers from the agent runtime.

`serverUrl` for agent runtime is resolved from `@vassembly/config` (`config.mcpServers.serverUrls`) when not set on the catalog document.
