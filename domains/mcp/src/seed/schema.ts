import { z } from 'zod';

import { mcpConfigSchema } from '../model/configSchema';
import { McpTransport } from '../model/transport';

export const mcpSeedSchema = z.object({
  slug: z.string().min(1).max(80),
  name: z.string().min(1).max(120),
  description: z.string().min(1).max(500),
  tags: z.array(z.string()).min(1),
  iconPath: z.string().startsWith('/mcps/'),
  documentationUrl: z.string().url().optional(),
  repositoryUrl: z.string().url().optional(),
  category: z.string().optional(),
  transport: z.enum([McpTransport.NativeHttp, McpTransport.StdioWrapped]),
  dockerImage: z.string().optional(),
  configSchema: mcpConfigSchema.optional(),
});
