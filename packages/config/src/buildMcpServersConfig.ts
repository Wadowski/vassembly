import { getMcpSlugs } from '@vassembly/constants';

import { MCP_CONTAINER_DEFAULTS } from './mcpContainerDefaults';
import { MCP_DOCKER_IMAGES } from './mcpDockerImages';

import type { McpServersConfig } from './types';

const MCP_HOST = process.env.MCP_HOST || 'localhost';

const buildDefaultServerUrls = (): Record<string, string> =>
  Object.fromEntries(
    getMcpSlugs().map((slug) => {
      const port = MCP_CONTAINER_DEFAULTS[slug]?.port ?? 8080;
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
    : buildDefaultServerUrls(),
  containers: Object.fromEntries(
    getMcpSlugs().map((slug) => {
      const defaults = MCP_CONTAINER_DEFAULTS[slug];
      return [
        slug,
        {
          port: defaults?.port ?? 8080,
          transport: defaults?.transport ?? 'stdio-wrapped',
          proxy: defaults?.proxy ?? 'mcp-key-proxy',
          dockerImage: MCP_DOCKER_IMAGES[slug],
          platformEnv: {},
        },
      ];
    }),
  ),
});
