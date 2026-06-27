import { SYSTEM_AGENT_NAME } from '@vassembly/constants';
import mcpDomain from '@vassembly/domain-mcp';
import systemAgentDomain from '@vassembly/domain-system-agent';

import { runAgentInvokeWithTools } from '../runAgentInvokeWithTools';
import { logSpecializationEvent } from './logSpecializationEvent';

import type { InternalToolContext } from '../types';

const MCP_CATALOG_PAGE_SIZE = 200;

export interface MapMcpsToSpecializationParams {
  specializationId: string;
  specializationName: string;
  specializationDescription: string;
  userId: string;
  connectionOverride: { integrationCredentialId: string };
  toolContext: InternalToolContext;
}

const buildMcpCatalogMessage = ({
  specializationName,
  specializationDescription,
  mcps,
}: {
  specializationName: string;
  specializationDescription: string;
  mcps: Array<{ name: string; slug: string; description: string }>;
}): string => {
  const mcpLines = mcps.map((mcp) => `- ${mcp.name} (${mcp.slug}): ${mcp.description}`).join('\n');

  return [
    `Specialization: ${specializationName}`,
    `Description: ${specializationDescription}`,
    '',
    'Available MCPs:',
    mcpLines,
  ].join('\n');
};

const parseMcpSlugs = ({ rawOutput }: { rawOutput: string }): string[] => {
  const slugs: string[] = [];

  for (const line of rawOutput.split('\n')) {
    const slug = line.trim();

    if (slug.length > 0 && !slugs.includes(slug)) {
      slugs.push(slug);
    }
  }

  return slugs;
};

export const mapMcpsToSpecialization = async ({
  specializationId,
  specializationName,
  specializationDescription,
  userId,
  connectionOverride,
  toolContext,
}: MapMcpsToSpecializationParams): Promise<void> => {
  const startedAt = Date.now();

  try {
    const catalogResult = await mcpDomain.queries.getList({
      page: 0,
      size: MCP_CATALOG_PAGE_SIZE,
    });

    if (catalogResult.items.length === 0) {
      logSpecializationEvent({
        event: 'specialization.mcp_mapping.skipped',
        specializationId,
        userId,
        reason: 'empty_catalog',
        durationMs: Date.now() - startedAt,
      });
      return;
    }

    const agentResult = await systemAgentDomain.queries.getActiveByName({
      name: SYSTEM_AGENT_NAME.McpSpecializationClassifier,
    });

    const invokeResult = await runAgentInvokeWithTools({
      userId,
      agentType: 'system',
      agentId: agentResult.data.id!,
      message: buildMcpCatalogMessage({
        specializationName,
        specializationDescription,
        mcps: catalogResult.items.map((mcp) => ({
          name: mcp.name,
          slug: mcp.slug,
          description: mcp.description,
        })),
      }),
      connectionOverride,
      toolContext,
    });

    const slugs = parseMcpSlugs({ rawOutput: invokeResult.message });
    const slugToMcpId = new Map(
      catalogResult.items.map((mcp) => [mcp.slug.toLowerCase(), mcp.id]),
    );

    let mappedCount = 0;

    for (const slug of slugs) {
      const mcpId = slugToMcpId.get(slug.toLowerCase());

      if (mcpId === undefined) {
        continue;
      }

      try {
        await mcpDomain.commands.addSpecializationId({
          mcpId,
          specializationId,
        });
        mappedCount += 1;
      } catch (error) {
        logSpecializationEvent({
          event: 'specialization.mcp_mapping.failed',
          specializationId,
          userId,
          reason: error instanceof Error ? error.message : String(error),
        });
      }
    }

    logSpecializationEvent({
      event: 'specialization.mcp_mapping.completed',
      specializationId,
      userId,
      mcpCount: mappedCount,
      durationMs: Date.now() - startedAt,
    });
  } catch (error) {
    logSpecializationEvent({
      event: 'specialization.mcp_mapping.failed',
      specializationId,
      userId,
      reason: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startedAt,
    });
  }
};
