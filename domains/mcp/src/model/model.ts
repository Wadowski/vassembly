import { Model } from '@vassembly/model';

import type { McpConfigSchema } from './configSchema';
import type { McpTransportValue } from './transport';

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
  specializationIds?: string[];
  category?: string | null;
  transport?: McpTransportValue | null;
  serverUrl?: string | null;
  dockerImage?: string | null;
}
