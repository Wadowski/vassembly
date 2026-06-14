import { Model } from '@vassembly/model';

import type { McpConfigSchema } from './configSchema';

export class McpModel extends Model {
  slug!: string;
  name!: string;
  description!: string;
  tags!: string[];
  iconPath!: string;
  documentationUrl?: string | null;
  repositoryUrl?: string | null;
  configurationStatus?: string | null;
  configSchema?: McpConfigSchema | null;
}
