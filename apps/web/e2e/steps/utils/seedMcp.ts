import type { SeedContext } from '@vassembly/e2e';
import { requireWorkspaceModule } from '@vassembly/e2e';

import type { EnsureMcpIndexesParams, McpCatalogEntry, SeedMcpParams } from './types';

const DEFAULT_MCP_ICON_PATH = '/mcps/gmail.svg';

const applySeedContext = ({ context }: EnsureMcpIndexesParams): void => {
  process.env.MONGODB_URL = context.mongoUrl;
  process.env.MONGODB_DATABASE = context.mongoDatabase;
};

const toSlug = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const ensureMcpIndexes = async ({ context }: EnsureMcpIndexesParams): Promise<void> => {
  applySeedContext({ context });

  const { init } = requireWorkspaceModule<
    typeof import('@vassembly/client-mongodb')
  >({
    moduleName: '@vassembly/client-mongodb',
  });
  const mcpDomain = requireWorkspaceModule<typeof import('@vassembly/domain-mcp')>({
    moduleName: '@vassembly/domain-mcp',
  });

  await init({ indexFunctions: [mcpDomain.mongodbIndexes] });
};

export const seedMcp = async ({
  context,
  name,
  provider,
  description,
}: SeedMcpParams): Promise<void> => {
  await ensureMcpIndexes({ context });

  const { mcpMongodbDao, mcpFactory } = requireWorkspaceModule<
    typeof import('@vassembly/domain-mcp')
  >({
    moduleName: '@vassembly/domain-mcp',
  });

  const existing = await mcpMongodbDao.collection.findOne({ name });
  if (existing !== null) {
    return;
  }

  const instance = mcpFactory.create({
    slug: toSlug(name),
    name,
    description,
    tags: [provider],
    iconPath: DEFAULT_MCP_ICON_PATH,
    documentationUrl: null,
    repositoryUrl: null,
  });

  await mcpMongodbDao.create(instance);
};

export const seedMcpCatalog = async ({
  context,
  entries,
}: {
  context: SeedContext;
  entries: McpCatalogEntry[];
}): Promise<void> => {
  for (const entry of entries) {
    await seedMcp({
      context,
      name: entry.name,
      provider: entry.provider,
      description: entry.description,
    });
  }
};
