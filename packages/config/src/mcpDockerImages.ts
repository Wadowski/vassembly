import { MCP_SLUG } from '@vassembly/constants';

const MCPPROXY_LOCAL_IMAGE = 'vassembly/mcp-{slug}:local';
const KEY_PROXY_IMAGE = 'ghcr.io/onprem-ai/mcp-key-proxy:latest';

const localMcpproxyImage = (slug: string): string =>
  MCPPROXY_LOCAL_IMAGE.replace('{slug}', slug);

export const MCP_DOCKER_IMAGES: Record<MCP_SLUG, string> = {
  [MCP_SLUG.GithubMcp]: KEY_PROXY_IMAGE,
  [MCP_SLUG.Context7]: 'context7/mcp-server:latest',
  [MCP_SLUG.MongodbMcp]: KEY_PROXY_IMAGE,
  [MCP_SLUG.RedisMcp]: KEY_PROXY_IMAGE,
  [MCP_SLUG.AwsMcp]: KEY_PROXY_IMAGE,
  [MCP_SLUG.VercelMcp]: 'vercel/mcp-server-vercel:latest',
  [MCP_SLUG.TerraformMcp]: KEY_PROXY_IMAGE,
  [MCP_SLUG.SentryMcp]: KEY_PROXY_IMAGE,
  [MCP_SLUG.DatadogMcp]: 'datadog/mcp-server-datadog:latest',
  [MCP_SLUG.BraveSearchMcp]: KEY_PROXY_IMAGE,
  [MCP_SLUG.WikipediaMcp]: localMcpproxyImage('wikipedia-mcp'),
  [MCP_SLUG.PubmedMcp]: KEY_PROXY_IMAGE,
  [MCP_SLUG.ArxivMcp]: localMcpproxyImage('arxiv-mcp'),
  [MCP_SLUG.GoogleSearchMcp]: KEY_PROXY_IMAGE,
  [MCP_SLUG.NotionMcp]: KEY_PROXY_IMAGE,
  [MCP_SLUG.ObsidianMcp]: KEY_PROXY_IMAGE,
  [MCP_SLUG.GranolaMcp]: 'granola/mcp-server-granola:latest',
  [MCP_SLUG.DiscordMcp]: KEY_PROXY_IMAGE,
  [MCP_SLUG.GmailMcp]: 'google/mcp-server-gmail:latest',
  [MCP_SLUG.GoogleCalendarMcp]: 'google/mcp-server-gcal:latest',
  [MCP_SLUG.TodoistMcp]: KEY_PROXY_IMAGE,
  [MCP_SLUG.LinearMcp]: 'linear/mcp-server-linear:latest',
  [MCP_SLUG.StripeMcp]: 'stripe/mcp-server-stripe:latest',
  [MCP_SLUG.FigmaMcp]: 'figma/mcp-server-figma:latest',
  [MCP_SLUG.GoogleSheetsMcp]: 'google/mcp-server-gsheets:latest',
  [MCP_SLUG.CanvaMcp]: 'canva/mcp-server-canva:latest',
  [MCP_SLUG.GoogleMapsMcp]: KEY_PROXY_IMAGE,
  [MCP_SLUG.OpenweatherMcp]: KEY_PROXY_IMAGE,
  [MCP_SLUG.SpotifyMcp]: 'communitymcp/spotify-mcp:latest',
};
