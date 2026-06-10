import type { EnsureMcpIndexesParams, SeedMcpParams } from './types';

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

  const { init } = await import('@vassembly/client-mongodb');
  const mcpDomain = await import('@vassembly/domain-mcp');

  await init({ indexFunctions: [mcpDomain.mongodbIndexes] });
};

export const seedMcp = async ({
  context,
  name,
  provider,
  description,
}: SeedMcpParams): Promise<string> => {
  await ensureMcpIndexes({ context });

  const { mcpMongodbDao, mcpFactory } = await import('@vassembly/domain-mcp');

  const existing = await mcpMongodbDao.collection.findOne({ name });
  if (existing !== null && existing.id !== undefined) {
    return existing.id;
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

  const createdId = await mcpMongodbDao.create(instance);

  return createdId;
};
