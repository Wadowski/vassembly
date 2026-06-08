import { assertRequiredFields, toIsoString } from '@vassembly/mappers';

import type { McpListItemResponse } from './dto';
import type { McpModel } from './model';

const REQUIRED_FIELDS = [
  'id',
  'slug',
  'name',
  'description',
  'tags',
  'iconPath',
  'createdAt',
  'updatedAt',
] as const;

export interface ToMcpResponseParams {
  mcp: McpModel;
}

export const toMcpResponse = ({ mcp }: ToMcpResponseParams): McpListItemResponse => {
  assertRequiredFields({
    entity: mcp,
    fields: REQUIRED_FIELDS,
    entityName: 'MCP',
  });

  return {
    id: mcp.id!,
    slug: mcp.slug!,
    name: mcp.name!,
    description: mcp.description!,
    tags: mcp.tags!,
    iconPath: mcp.iconPath!,
    documentationUrl: mcp.documentationUrl ?? null,
    repositoryUrl: mcp.repositoryUrl ?? null,
    createdAt: toIsoString({ value: mcp.createdAt!, fieldName: 'createdAt' }),
    updatedAt: toIsoString({ value: mcp.updatedAt!, fieldName: 'updatedAt' }),
  };
};
