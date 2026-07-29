import { MCP_SLUG } from '@vassembly/constants';

import type { McpProxyKind, McpTransport } from './types';

export interface McpContainerDefaults {
  port: number;
  transport: McpTransport;
  proxy: McpProxyKind;
}

export const MCP_CONTAINER_DEFAULTS: Record<MCP_SLUG, McpContainerDefaults> = {
  [MCP_SLUG.GithubMcp]: { port: 4101, transport: 'stdio-wrapped', proxy: 'mcp-key-proxy' },
  [MCP_SLUG.Context7]: { port: 4001, transport: 'native-http', proxy: 'none' },
  [MCP_SLUG.MongodbMcp]: { port: 4104, transport: 'stdio-wrapped', proxy: 'mcp-key-proxy' },
  [MCP_SLUG.RedisMcp]: { port: 4105, transport: 'stdio-wrapped', proxy: 'mcp-key-proxy' },
  [MCP_SLUG.AwsMcp]: { port: 4106, transport: 'stdio-wrapped', proxy: 'mcp-key-proxy' },
  [MCP_SLUG.VercelMcp]: { port: 4003, transport: 'native-http', proxy: 'none' },
  [MCP_SLUG.TerraformMcp]: { port: 4107, transport: 'stdio-wrapped', proxy: 'mcp-key-proxy' },
  [MCP_SLUG.SentryMcp]: { port: 4108, transport: 'stdio-wrapped', proxy: 'mcp-key-proxy' },
  [MCP_SLUG.DatadogMcp]: { port: 4004, transport: 'native-http', proxy: 'none' },
  [MCP_SLUG.BraveSearchMcp]: { port: 4109, transport: 'stdio-wrapped', proxy: 'mcp-key-proxy' },
  [MCP_SLUG.WikipediaMcp]: { port: 4110, transport: 'stdio-wrapped', proxy: 'mcpproxy-go' },
  [MCP_SLUG.PubmedMcp]: { port: 4111, transport: 'stdio-wrapped', proxy: 'mcp-key-proxy' },
  [MCP_SLUG.ArxivMcp]: { port: 4112, transport: 'stdio-wrapped', proxy: 'mcpproxy-go' },
  [MCP_SLUG.GoogleSearchMcp]: { port: 4113, transport: 'stdio-wrapped', proxy: 'mcp-key-proxy' },
  [MCP_SLUG.NotionMcp]: { port: 4006, transport: 'stdio-wrapped', proxy: 'mcp-key-proxy' },
  [MCP_SLUG.ObsidianMcp]: { port: 4114, transport: 'stdio-wrapped', proxy: 'mcp-key-proxy' },
  [MCP_SLUG.GranolaMcp]: { port: 4007, transport: 'native-http', proxy: 'none' },
  [MCP_SLUG.DiscordMcp]: { port: 4115, transport: 'stdio-wrapped', proxy: 'mcp-key-proxy' },
  [MCP_SLUG.GmailMcp]: { port: 4008, transport: 'native-http', proxy: 'none' },
  [MCP_SLUG.GoogleCalendarMcp]: { port: 4009, transport: 'native-http', proxy: 'none' },
  [MCP_SLUG.TodoistMcp]: { port: 4116, transport: 'stdio-wrapped', proxy: 'mcp-key-proxy' },
  [MCP_SLUG.LinearMcp]: { port: 4010, transport: 'native-http', proxy: 'none' },
  [MCP_SLUG.StripeMcp]: { port: 4011, transport: 'native-http', proxy: 'none' },
  [MCP_SLUG.FigmaMcp]: { port: 4012, transport: 'native-http', proxy: 'none' },
  [MCP_SLUG.GoogleSheetsMcp]: { port: 4013, transport: 'native-http', proxy: 'none' },
  [MCP_SLUG.CanvaMcp]: { port: 4014, transport: 'native-http', proxy: 'none' },
  [MCP_SLUG.GoogleMapsMcp]: { port: 4117, transport: 'stdio-wrapped', proxy: 'mcp-key-proxy' },
  [MCP_SLUG.OpenweatherMcp]: { port: 4118, transport: 'stdio-wrapped', proxy: 'mcp-key-proxy' },
  [MCP_SLUG.SpotifyMcp]: { port: 4016, transport: 'native-http', proxy: 'none' },
};
