import type { McpModel } from '../../model';
import type { McpSeedEntry } from '../../seed/types';

export const SEED_MCPS: McpSeedEntry[] = [
  {
    slug: 'google-workspace-mcp',
    name: 'Gmail MCP',
    description:
      'Complete email management, calendar, documents, sheets, slides, forms, and chat integration',
    tags: ['productivity', 'email', 'google-workspace', 'calendar', 'documents'],
    iconPath: '/mcps/gmail.svg',
    documentationUrl: 'https://glama.ai/mcp/servers/taylorwilsdon/google_workspace_mcp',
    repositoryUrl: 'https://github.com/taylorwilsdon/google_workspace_mcp',
  },
  {
    slug: 'brave-search-mcp',
    name: 'Brave Search MCP',
    description:
      'Comprehensive search capabilities including web search, local business search, image search, video search, news search, and AI-powered summarization',
    tags: ['search', 'web', 'ai-summary', 'news', 'images'],
    iconPath: '/mcps/brave-search.svg',
    documentationUrl: 'https://glama.ai/mcp/servers/brave/brave-search-mcp-server',
    repositoryUrl: 'https://github.com/brave/brave-search-mcp-server',
    configSchema: {
      fields: [
        {
          key: 'apiKey',
          label: 'API Key',
          type: 'password',
          description: 'Your Brave Search API key',
          required: true,
          placeholder: 'Enter your Brave Search API key',
        },
        {
          key: 'transport',
          label: 'Transport Mode',
          type: 'select',
          description: 'Transport mode for MCP server',
          defaultValue: 'stdio',
          options: [
            { value: 'stdio', label: 'STDIO (Default)' },
            { value: 'http', label: 'HTTP' },
          ],
        },
        {
          key: 'port',
          label: 'Port',
          type: 'text',
          description: 'HTTP server port (default: 8000)',
          placeholder: '8000',
          pattern: '^[0-9]{1,5}$',
        },
        {
          key: 'host',
          label: 'Host',
          type: 'text',
          description: 'HTTP server host (default: 0.0.0.0)',
          placeholder: '0.0.0.0',
        },
        {
          key: 'logLevel',
          label: 'Log Level',
          type: 'select',
          description: 'Desired logging level',
          defaultValue: 'info',
          options: [
            { value: 'debug', label: 'Debug' },
            { value: 'info', label: 'Info' },
            { value: 'notice', label: 'Notice' },
            { value: 'warning', label: 'Warning' },
            { value: 'error', label: 'Error' },
            { value: 'critical', label: 'Critical' },
            { value: 'alert', label: 'Alert' },
            { value: 'emergency', label: 'Emergency' },
          ],
        },
        {
          key: 'enabledTools',
          label: 'Enabled Tools',
          type: 'text',
          description:
            'Space-separated whitelist of tools to enable (e.g., "brave_web_search brave_news_search")',
          placeholder: 'Leave empty to enable all tools',
        },
        {
          key: 'disabledTools',
          label: 'Disabled Tools',
          type: 'text',
          description:
            'Space-separated blacklist of tools to disable (e.g., "brave_image_search")',
          placeholder: 'Leave empty to disable no tools',
        },
        {
          key: 'stateless',
          label: 'Stateless Mode',
          type: 'checkbox',
          description: 'HTTP stateless mode (recommended for Amazon Bedrock)',
          defaultValue: true,
        },
      ],
    },
  },
];

const BASE_DATE = new Date('2026-06-01T00:00:00.000Z');

export const toMcpDoc = (entry: McpSeedEntry, index: number): Partial<McpModel> => ({
  id: `mcp-${index + 1}`,
  slug: entry.slug,
  name: entry.name,
  description: entry.description,
  tags: entry.tags,
  iconPath: entry.iconPath,
  documentationUrl: entry.documentationUrl ?? null,
  repositoryUrl: entry.repositoryUrl ?? null,
  configSchema: entry.configSchema,
  createdAt: BASE_DATE,
  updatedAt: BASE_DATE,
});

export const SEED_MCP_DOCS = SEED_MCPS.map(toMcpDoc);

export const buildPaginationDataset = (count: number): Partial<McpModel>[] => {
  const docs = SEED_MCP_DOCS.map((doc) => ({ ...doc }));

  for (let index = docs.length; index < count; index += 1) {
    const label = String(index + 1).padStart(2, '0');
    docs.push(
      toMcpDoc(
        {
          slug: `extra-mcp-${label}`,
          name: `Extra MCP ${label}`,
          description: `Additional MCP catalog entry ${label}`,
          tags: ['catalog'],
          iconPath: `/mcps/extra-${label}.svg`,
        },
        index,
      ),
    );
  }

  return docs;
};

const matchesRegexFilter = ({
  value,
  pattern,
}: {
  value: string;
  pattern: RegExp | string;
}): boolean => {
  if (pattern instanceof RegExp) {
    return pattern.test(value);
  }

  return new RegExp(pattern, 'i').test(value);
};

const matchesDocument = (doc: Partial<McpModel>, filter: Record<string, unknown>): boolean => {
  if (Object.keys(filter).length === 0) {
    return true;
  }

  if ('$and' in filter && Array.isArray(filter.$and)) {
    return (filter.$and as Record<string, unknown>[]).every((condition) => matchesDocument(doc, condition));
  }

  if ('$or' in filter && Array.isArray(filter.$or)) {
    return (filter.$or as Record<string, unknown>[]).some((condition) => matchesDocument(doc, condition));
  }

  if ('tags' in filter) {
    const tagsFilter = filter.tags as { $in?: string[] };
    const selectedTags = tagsFilter.$in ?? [];
    return (doc.tags ?? []).some((tag) => selectedTags.includes(tag));
  }

  for (const [field, condition] of Object.entries(filter)) {
    if (field.startsWith('$')) {
      continue;
    }

    const fieldValue = doc[field as keyof McpModel];
    if (typeof fieldValue !== 'string') {
      return false;
    }

    const regexCondition = condition as { $regex?: RegExp | string; $options?: string };
    if (regexCondition.$regex !== undefined) {
      return matchesRegexFilter({ value: fieldValue, pattern: regexCondition.$regex });
    }
  }

  return true;
};

export const createInMemoryMcpStore = (docs: Partial<McpModel>[]) => {
  const store = [...docs];

  const query = (filter: Record<string, unknown> = {}) => store.filter((doc) => matchesDocument(doc, filter));

  return {
    getManyRaw: async (
      filter: Record<string, unknown>,
      options: { sort?: Record<string, 1 | -1>; offset?: number; limit?: number } = {},
    ) => {
      const sorted = query(filter).sort((left, right) => {
        const direction = options.sort?.name ?? 1;
        const leftName = left.name ?? '';
        const rightName = right.name ?? '';
        return direction === 1 ? leftName.localeCompare(rightName) : rightName.localeCompare(leftName);
      });

      const offset = options.offset ?? 0;
      const limit = options.limit ?? sorted.length;
      return sorted.slice(offset, offset + limit);
    },
    countDocuments: async (filter: Record<string, unknown> = {}) => query(filter).length,
  };
};
