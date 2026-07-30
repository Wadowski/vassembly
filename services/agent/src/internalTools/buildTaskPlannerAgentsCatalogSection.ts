import { listSystemAgentsBySpecializationIds } from './listAgents/listSystemAgentsBySpecializationIds';
import { resolveSpecializationAgentRole } from './createSpecialization/resolveSpecializationAgentRole';

export interface BuildTaskPlannerAgentsCatalogSectionParams {
  specializationIds: string[];
}

export const buildTaskPlannerAgentsCatalogSection = async ({
  specializationIds,
}: BuildTaskPlannerAgentsCatalogSectionParams): Promise<string> => {
  const agents = await listSystemAgentsBySpecializationIds({ specializationIds });
  const specializationAgents = agents
    .map((agent) => ({ agent, role: resolveSpecializationAgentRole({ name: agent.name }) }))
    .filter(
      (
        entry,
      ): entry is {
        agent: (typeof agents)[number];
        role: NonNullable<ReturnType<typeof resolveSpecializationAgentRole>>;
      } => entry.role !== undefined,
    );

  const planAssignableAgents = specializationAgents.filter(
    ({ role }) => role !== 'methodologist',
  );

  if (planAssignableAgents.length === 0) {
    return '## Available agents\n\n(none — no specialization agents for this task)';
  }

  const lines = planAssignableAgents.map(
    ({ agent, role }) =>
      `- **${agent.name}** (${role}) — use this exact string as \`agentName\` in persist_task_plan items`,
  );

  return `## Available agents

Each plan item targets exactly one specialization agent — worker, researcher, or validator (listed below with role). Methodologists run before planning and are not plan items. Assign a worker for execution, a researcher to gather topic data, or a validator to verify the user's request is fulfilled.

${lines.join('\n')}`;
};
