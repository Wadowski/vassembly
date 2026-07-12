import skillDomain, { formatSkillsCatalogSection } from '@vassembly/domain-skill';
import specializationDomain from '@vassembly/domain-specialization';

export interface BuildTaskPlannerSkillsCatalogSectionParams {
  specializationIds: string[];
}

export const buildTaskPlannerSkillsCatalogSection = async ({
  specializationIds,
}: BuildTaskPlannerSkillsCatalogSectionParams): Promise<string | undefined> => {
  const sections: string[] = [];

  for (const specializationId of specializationIds) {
    const specializationResult = await specializationDomain.queries.getById({ id: specializationId });
    const catalogResult = await skillDomain.queries.getCatalogBySpecializationId({ specializationId });
    const catalogSection = formatSkillsCatalogSection({ items: catalogResult.items });

    sections.push(
      `### ${specializationResult.data.name} (specializationId: ${specializationResult.data.id})`,
      catalogSection || '_No skills in catalog yet._',
    );
  }

  if (sections.length === 0) {
    return undefined;
  }

  return `## Linked specializations\n\n${sections.join('\n\n')}`;
};
