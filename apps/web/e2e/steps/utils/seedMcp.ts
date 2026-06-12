import { requireWorkspaceModule } from '@vassembly/e2e';

import type {
  EnsureMcpIndexesParams,
  GetMcpIdBySlugParams,
  SeedMcpCatalogParams,
  SeedMcpParams,
} from './types';

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

export const seedMcpCatalog = async ({ context }: SeedMcpCatalogParams): Promise<void> => {
  await ensureMcpIndexes({ context });

  const mcpDomain = requireWorkspaceModule<typeof import('@vassembly/domain-mcp')>({
    moduleName: '@vassembly/domain-mcp',
  });

  await mcpDomain.seedMcps();
};

export const getMcpIdBySlug = async ({ context, slug }: GetMcpIdBySlugParams): Promise<string> => {
  await ensureMcpIndexes({ context });

  const mcpDomain = requireWorkspaceModule<typeof import('@vassembly/domain-mcp')>({
    moduleName: '@vassembly/domain-mcp',
  });

  const catalogResult = await mcpDomain.queries.getList({ page: 0, size: 100 });
  const mcp = catalogResult.items.find((item) => item.slug === slug);

  if (mcp === undefined) {
    throw new Error(`MCP with slug "${slug}" was not found. Seed the catalog first.`);
  }

  return mcp.id;
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
