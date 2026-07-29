import type { DynamicStructuredTool } from '@langchain/core/tools';

const MCP_TOOL_PREFIX = 'mcp__';

export interface BuildMcpToolNamePrefixParams {
  serverName: string;
}

export const buildMcpToolNamePrefix = ({
  serverName,
}: BuildMcpToolNamePrefixParams): string => `${MCP_TOOL_PREFIX}${serverName}__`;

export interface ParseOriginalMcpToolNameParams {
  toolName: string;
  serverName: string;
}

export const parseOriginalMcpToolName = ({
  toolName,
  serverName,
}: ParseOriginalMcpToolNameParams): string => {
  const prefix = buildMcpToolNamePrefix({ serverName });

  if (toolName.startsWith(prefix)) {
    return toolName.slice(prefix.length);
  }

  return toolName;
};

export interface DecorateMcpToolDescriptionParams {
  tool: DynamicStructuredTool;
  label: string;
}

export const decorateMcpToolDescription = ({
  tool,
  label,
}: DecorateMcpToolDescriptionParams): DynamicStructuredTool => {
  const baseDescription = tool.description ?? '';
  const description =
    baseDescription.length > 0 ? `[${label}] ${baseDescription}` : `[${label}]`;

  return Object.assign(Object.create(Object.getPrototypeOf(tool)), tool, {
    description,
  });
};
