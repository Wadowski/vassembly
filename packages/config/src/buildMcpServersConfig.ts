import type { McpProxyKind, McpServersConfig, McpTransport } from './types';

const MCP_SPIKE_SLUGS = ['brave-search-mcp', 'wikipedia-mcp'] as const;

const MCP_HOST = process.env.MCP_HOST || 'localhost';

const SPIKE_CONTAINER_DEFAULTS: Record<
  string,
  { port: number; transport: McpTransport; proxy: McpProxyKind }
> = {
  'brave-search-mcp': { port: 4109, transport: 'stdio-wrapped', proxy: 'mcp-key-proxy' },
  'wikipedia-mcp': { port: 4110, transport: 'stdio-wrapped', proxy: 'mcpproxy-go' },
};

const buildSpikeServerUrls = (): Record<string, string> =>
  Object.fromEntries(
    MCP_SPIKE_SLUGS.map((slug) => {
      const port = SPIKE_CONTAINER_DEFAULTS[slug]?.port ?? 8080;
      return [slug, `http://${MCP_HOST}:${port}/mcp`];
    }),
  );

export const buildMcpServersConfig = (): McpServersConfig => ({
  defaults: {
    logLevel: process.env.MCP_LOG_LEVEL || 'info',
    host: MCP_HOST,
    proxyPoolSize: Number(process.env.MCP_PROXY_POOL_SIZE) || 5,
  },
  serverUrls: process.env.MCP_SERVER_URLS_JSON
    ? (JSON.parse(process.env.MCP_SERVER_URLS_JSON) as Record<string, string>)
    : buildSpikeServerUrls(),
  containers: Object.fromEntries(
    MCP_SPIKE_SLUGS.map((slug) => {
      const defaults = SPIKE_CONTAINER_DEFAULTS[slug];
      return [
        slug,
        {
          port: defaults?.port ?? 8080,
          transport: defaults?.transport ?? 'stdio-wrapped',
          proxy: defaults?.proxy ?? 'mcp-key-proxy',
          dockerImage:
            slug === 'wikipedia-mcp'
              ? 'vassembly/mcp-wikipedia-mcp:local'
              : 'ghcr.io/onprem-ai/mcp-key-proxy:latest',
          platformEnv: {},
        },
      ];
    }),
  ),
});
