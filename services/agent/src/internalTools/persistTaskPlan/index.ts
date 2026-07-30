import taskCommentDomain from '@vassembly/domain-task-comment';
import taskPlanInstanceDomain from '@vassembly/domain-task-plan-instance';
import taskPlanTemplateDomain from '@vassembly/domain-task-plan-template';
import { normalizeDescriptionHash } from '@vassembly/domain-task-plan-template';
import skillDomain from '@vassembly/domain-skill';

import { logTaskPlanEvent } from './logTaskPlanEvent';
import { resolvePlanItemAgentIds } from './resolvePlanItemAgentIds';
import { resolvePlanItemSkillIds } from './resolvePlanItemSkillIds';

import type { InternalToolContext } from '../types';
import type { PersistTaskPlanInput } from './types';

const validateSkillIds = async ({ skillIds }: { skillIds: string[] }): Promise<void> => {
  const uniqueSkillIds = [...new Set(skillIds)];

  await Promise.all(
    uniqueSkillIds.map(async (skillId) => {
      await skillDomain.queries.getById({ id: skillId });
    }),
  );
};

export const persistTaskPlanToolHandler = async (
  input: PersistTaskPlanInput,
  context: InternalToolContext,
): Promise<string> => {
  try {
    const { taskId, commentId, specializationIds } = context;

    if (!taskId || !commentId) {
      return JSON.stringify({ error: 'taskId and commentId are required in execution context' });
    }

    if (!specializationIds || specializationIds.length === 0) {
      return JSON.stringify({ error: 'specializationIds are required in execution context' });
    }

    const skillIds = input.items
      .map((item) => item.skillId)
      .filter((skillId): skillId is string => skillId !== null);

    try {
      await validateSkillIds({ skillIds });
    } catch {
      return JSON.stringify({ error: 'Invalid skillId reference' });
    }

    const resolvedAgents = await resolvePlanItemAgentIds({
      items: input.items.map((item) => ({ agentName: item.agentName })),
      specializationIds,
    });

    const resolvedSkills = await resolvePlanItemSkillIds({
      items: input.items.map((item) => ({
        skillId: item.skillId,
        skillName: item.skillName,
        description: item.description,
      })),
      specializationIds,
    });

    const persistedItems = input.items.map((item, index) => ({
      agentId: resolvedAgents[index]!.agentId,
      skillId: resolvedSkills[index]!.skillId,
      description: resolvedSkills[index]!.description,
      order: item.order,
    }));

    const normalizedDescriptionHash = normalizeDescriptionHash({
      description: input.description,
    });

    const equivalent = await taskPlanTemplateDomain.queries.findEquivalent({
      shortName: input.shortName,
      normalizedDescriptionHash,
    });

    let taskPlanTemplateId = equivalent.data?.id;
    let reusedExistingTemplate = false;

    if (taskPlanTemplateId) {
      reusedExistingTemplate = true;
      logTaskPlanEvent({
        event: 'taskPlan.template.reused',
        taskId,
        commentId,
        userId: context.userId,
        taskPlanTemplateId,
      });
    } else {
      const createdTemplate = await taskPlanTemplateDomain.commands.create({
        shortName: input.shortName,
        description: input.description,
        inputDetails: input.inputDetails,
        outputDetails: input.outputDetails,
        items: persistedItems,
      });

      taskPlanTemplateId = createdTemplate.data.id;

      if (!taskPlanTemplateId) {
        return JSON.stringify({ error: 'Failed to create task plan template' });
      }

      logTaskPlanEvent({
        event: 'taskPlan.template.created',
        taskId,
        commentId,
        userId: context.userId,
        taskPlanTemplateId,
      });
    }

    const createdInstance = await taskPlanInstanceDomain.commands.create({
      taskPlanTemplateId,
      taskId,
      commentId,
      inputDetails: input.resolvedInputDetails,
      templateItems: persistedItems,
    });

    const taskPlanInstanceId = createdInstance.data.id;

    if (!taskPlanInstanceId) {
      return JSON.stringify({ error: 'Failed to create task plan instance' });
    }

    logTaskPlanEvent({
      event: 'taskPlan.instance.created',
      taskId,
      commentId,
      userId: context.userId,
      taskPlanTemplateId,
      taskPlanInstanceId,
    });

    await taskCommentDomain.commands.setAgentResponse({
      commentId,
      taskPlanInstanceId,
    });

    return JSON.stringify({
      taskPlanTemplateId,
      taskPlanInstanceId,
      reusedExistingTemplate,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return JSON.stringify({ error: errorMessage });
  }
};
