const SKILL_BACKFILL_TOOL_IDS = new Set(['skill-create', 'skill-plan']);

export interface InternalToolExecutionResult {
  toolId: string;
  content: string;
}

export interface ExtractCreatedSkillIdParams {
  internalToolResults?: InternalToolExecutionResult[];
}

export const extractCreatedSkillId = ({
  internalToolResults = [],
}: ExtractCreatedSkillIdParams): string | undefined => {
  for (const result of internalToolResults) {
    if (!SKILL_BACKFILL_TOOL_IDS.has(result.toolId)) {
      continue;
    }

    try {
      const parsed = JSON.parse(result.content) as { skillId?: unknown };

      if (typeof parsed.skillId === 'string' && parsed.skillId.length > 0) {
        return parsed.skillId;
      }
    } catch {
      continue;
    }
  }

  return undefined;
};
