import { ValidationError } from '@vassembly/errors';

export interface CompositionSkillNode {
  id: string;
  usesSkillIds?: string[];
}

export interface DetectCompositionCycleParams {
  skillId: string;
  usesSkillIds: string[];
  allSkills: CompositionSkillNode[];
}

export const detectCompositionCycle = ({
  skillId,
  usesSkillIds,
  allSkills,
}: DetectCompositionCycleParams): void => {
  const graph = new Map(allSkills.map((skill) => [skill.id, skill.usesSkillIds ?? []]));
  graph.set(skillId, usesSkillIds);

  const visit = (currentId: string, visited: Set<string>): void => {
    if (visited.has(currentId)) {
      throw new ValidationError(`Skill composition cycle detected involving id "${currentId}"`);
    }

    const nextVisited = new Set(visited);
    nextVisited.add(currentId);

    for (const dependencyId of graph.get(currentId) ?? []) {
      visit(dependencyId, nextVisited);
    }
  };

  visit(skillId, new Set());
};
