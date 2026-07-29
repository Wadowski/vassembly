import { listSystemAgentsBySpecializationIds } from './listAgents/listSystemAgentsBySpecializationIds';
import { isSpecializationWorkerAgentName } from './isSpecializationWorkerAgentName';

export interface BuildTaskPlannerAgentsCatalogSectionParams {
  specializationIds: string[];
}

export const buildTaskPlannerAgentsCatalogSection = async ({
  specializationIds,
}: BuildTaskPlannerAgentsCatalogSectionParams): Promise<string> => {
  const agents = await listSystemAgentsBySpecializationIds({ specializationIds });
  const workerAgents = agents.filter((agent) => isSpecializationWorkerAgentName({ name: agent.name }));

  if (workerAgents.length === 0) {
    return '## Available agents\n\n(none — no specialization workers for this task)';
  }

  const lines = workerAgents.map(
    (agent) =>
      `- **${agent.name}** — use this exact string as \`agentName\` in persist_task_plan items`,
  );

  return `## Available agents

Plan items must target specialization **workers** only (listed below). Do not use researchers or validators as agentName.

${lines.join('\n')}`;
};
