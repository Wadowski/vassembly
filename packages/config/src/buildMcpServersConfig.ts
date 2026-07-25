import { getMcpSlugs, MCP_SLUG } from '@vassembly/constants';

import type { McpProxyKind, McpServersConfig, McpTransport } from './types';

const MCP_HOST = process.env.MCP_HOST || 'localhost';

const SPIKE_CONTAINER_DEFAULTS: Record<
  MCP_SLUG,
  { port: number; transport: McpTransport; proxy: McpProxyKind }
> = {
  [MCP_SLUG.BraveSearchMcp]: {
    port: 4109,
    transport: 'stdio-wrapped',
    proxy: 'mcp-key-proxy',
  },
  [MCP_SLUG.WikipediaMcp]: {
    port: 4110,
    transport: 'stdio-wrapped',
    proxy: 'mcpproxy-go',
  },
};

const buildSpikeServerUrls = (): Record<string, string> =>
  Object.fromEntries(
    getMcpSlugs().map((slug) => {
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
    getMcpSlugs().map((slug) => {
      const defaults = SPIKE_CONTAINER_DEFAULTS[slug];
      return [
        slug,
        {
          port: defaults?.port ?? 8080,
          transport: defaults?.transport ?? 'stdio-wrapped',
          proxy: defaults?.proxy ?? 'mcp-key-proxy',
          dockerImage:
            slug === MCP_SLUG.WikipediaMcp
              ? 'vassembly/mcp-wikipedia-mcp:local'
              : 'ghcr.io/onprem-ai/mcp-key-proxy:latest',
          platformEnv: {},
        },
      ];
    }),
  ),
});
