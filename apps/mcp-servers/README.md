# MCP Servers (spike)

Local Docker fleet for MCP integrations. Run from the **monorepo root**:

```bash
pnpm mcp-servers:up
pnpm mcp-servers:down
```

## Spike MCPs

| Slug | Proxy | Port | URL |
|------|-------|------|-----|
| `brave-search-mcp` | [mcp-key-proxy](https://github.com/onprem-ai/mcp-key-proxy) | 4109 | `http://localhost:4109/mcp` |
| `wikipedia-mcp` | [mcpproxy-go](https://github.com/smart-mcp-proxy/mcpproxy-go) | 4110 | `http://localhost:4110/mcp` |

Platform settings (`MCP_HOST`, `MCP_PROXY_POOL_SIZE`, ports) are loaded via `@vassembly/config` from the root `.env`.

User credentials are **not** stored in container env — they are sent per-request as HTTP headers from the agent runtime.

`serverUrl` for agent runtime is resolved from `@vassembly/config` (`config.mcpServers.serverUrls`) when not set on the catalog document.
