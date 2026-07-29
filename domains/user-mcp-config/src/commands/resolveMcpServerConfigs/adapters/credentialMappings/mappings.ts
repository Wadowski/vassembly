import { MCP_SLUG } from '@vassembly/constants';

import type { CredentialMapping } from './types';

const bearer = (fieldKey: string): CredentialMapping => ({
  kind: 'header',
  headers: [{ headerName: 'Authorization', fieldKey, format: 'bearer' }],
});

const optionalBearer = (fieldKey: string): CredentialMapping => ({
  kind: 'header',
  headers: [{ headerName: 'Authorization', fieldKey, format: 'bearer', optional: true }],
});

const mcpEnv = (headerName: string, fieldKey: string, optional = false): CredentialMapping => ({
  kind: 'header',
  headers: [{ headerName, fieldKey, optional }],
});

export const CREDENTIAL_MAPPINGS: Record<string, CredentialMapping> = {
  [MCP_SLUG.GithubMcp]: mcpEnv('X-Mcp-Env-GITHUB_PERSONAL_ACCESS_TOKEN', 'personalAccessToken'),
  [MCP_SLUG.Context7]: optionalBearer('apiKey'),
  [MCP_SLUG.MongodbMcp]: mcpEnv('X-Mcp-Env-MONGODB_URI', 'connectionUri'),
  [MCP_SLUG.RedisMcp]: mcpEnv('X-Mcp-Env-REDIS_URL', 'connectionUrl'),
  [MCP_SLUG.AwsMcp]: {
    kind: 'header',
    headers: [
      { headerName: 'X-Mcp-Env-AWS_ACCESS_KEY_ID', fieldKey: 'accessKeyId' },
      { headerName: 'X-Mcp-Env-AWS_SECRET_ACCESS_KEY', fieldKey: 'secretAccessKey' },
      { headerName: 'X-Mcp-Env-AWS_REGION', fieldKey: 'region' },
    ],
  },
  [MCP_SLUG.VercelMcp]: bearer('apiToken'),
  [MCP_SLUG.TerraformMcp]: mcpEnv('X-Mcp-Env-TF_TOKEN_app_terraform_io', 'terraformCloudToken'),
  [MCP_SLUG.SentryMcp]: mcpEnv('X-Mcp-Env-SENTRY_AUTH_TOKEN', 'authToken'),
  [MCP_SLUG.DatadogMcp]: {
    kind: 'header',
    headers: [
      { headerName: 'DD-API-KEY', fieldKey: 'apiKey' },
      { headerName: 'DD-APPLICATION-KEY', fieldKey: 'applicationKey' },
    ],
  },
  [MCP_SLUG.BraveSearchMcp]: {
    kind: 'header',
    headers: [{ headerName: 'x-api-key', fieldKey: 'apiKey' }],
  },
  [MCP_SLUG.WikipediaMcp]: { kind: 'none' },
  [MCP_SLUG.PubmedMcp]: mcpEnv('X-Mcp-Env-NCBI_API_KEY', 'ncbiApiKey', true),
  [MCP_SLUG.ArxivMcp]: { kind: 'none' },
  [MCP_SLUG.GoogleSearchMcp]: {
    kind: 'header',
    headers: [
      { headerName: 'X-Mcp-Env-GOOGLE_API_KEY', fieldKey: 'apiKey' },
      { headerName: 'X-Mcp-Env-GOOGLE_CSE_ID', fieldKey: 'searchEngineId' },
    ],
  },
  [MCP_SLUG.NotionMcp]: mcpEnv('X-Mcp-Env-NOTION_TOKEN', 'integrationToken'),
  [MCP_SLUG.ObsidianMcp]: mcpEnv('X-Mcp-Env-OBSIDIAN_API_KEY', 'apiKey'),
  [MCP_SLUG.GranolaMcp]: bearer('apiToken'),
  [MCP_SLUG.DiscordMcp]: mcpEnv('X-Mcp-Env-DISCORD_BOT_TOKEN', 'botToken'),
  [MCP_SLUG.GmailMcp]: bearer('accessToken'),
  [MCP_SLUG.GoogleCalendarMcp]: bearer('accessToken'),
  [MCP_SLUG.TodoistMcp]: mcpEnv('X-Mcp-Env-TODOIST_API_TOKEN', 'apiToken'),
  [MCP_SLUG.LinearMcp]: bearer('apiKey'),
  [MCP_SLUG.StripeMcp]: bearer('restrictedApiKey'),
  [MCP_SLUG.FigmaMcp]: {
    kind: 'header',
    headers: [{ headerName: 'X-Figma-Token', fieldKey: 'personalAccessToken' }],
  },
  [MCP_SLUG.GoogleSheetsMcp]: bearer('accessToken'),
  [MCP_SLUG.CanvaMcp]: bearer('accessToken'),
  [MCP_SLUG.GoogleMapsMcp]: mcpEnv('X-Mcp-Env-GOOGLE_MAPS_API_KEY', 'apiKey'),
  [MCP_SLUG.OpenweatherMcp]: mcpEnv('X-Mcp-Env-OPENWEATHER_API_KEY', 'apiKey'),
  [MCP_SLUG.SpotifyMcp]: bearer('accessToken'),
};
