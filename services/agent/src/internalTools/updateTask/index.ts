import { INTENT_CATEGORY_SLUG } from '@vassembly/constants';
import taskDomain from '@vassembly/domain-task';
import { ValidationError } from '@vassembly/errors';

const VALID_SLUGS = new Set<string>(Object.values(INTENT_CATEGORY_SLUG));

const isValidSpecializationIds = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.length <= 3 &&
  value.every((item) => typeof item === 'string' && item.length > 0);

const isValidSkillIdsUsed = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string' && item.length > 0);

export const updateTaskToolHandler = async (args: Record<string, unknown>): Promise<string> => {
  const id = typeof args.id === 'string' ? args.id : typeof args.taskId === 'string' ? args.taskId : '';
  const { title, category, specializationIds, skillIdsUsed } = args;

  if (!id) {
    throw new ValidationError('id is required');
  }

  if (
    title === undefined &&
    category === undefined &&
    specializationIds === undefined &&
    skillIdsUsed === undefined
  ) {
    throw new ValidationError(
      'At least one of title, category, specializationIds, or skillIdsUsed must be provided',
    );
  }

  if (title !== undefined && (typeof title !== 'string' || !title)) {
    throw new ValidationError('title must be a non-empty string');
  }

  if (category !== undefined && category !== null && !VALID_SLUGS.has(String(category))) {
    throw new ValidationError(`category must be one of: ${[...VALID_SLUGS].join(', ')}`);
  }

  if (specializationIds !== undefined && !isValidSpecializationIds(specializationIds)) {
    throw new ValidationError('specializationIds must be an array of max 3 strings');
  }

  if (skillIdsUsed !== undefined && !isValidSkillIdsUsed(skillIdsUsed)) {
    throw new ValidationError('skillIdsUsed must be an array of non-empty strings');
  }

  await taskDomain.commands.updateTask({
    id,
    ...(title !== undefined ? { title } : {}),
    ...(category !== undefined ? { category: category as INTENT_CATEGORY_SLUG | null } : {}),
    ...(specializationIds !== undefined ? { specializationIds } : {}),
    ...(skillIdsUsed !== undefined ? { skillIdsUsed } : {}),
  });

  const updatedFields = [
    title !== undefined ? 'title' : null,
    category !== undefined ? 'category' : null,
    specializationIds !== undefined ? 'specializationIds' : null,
    skillIdsUsed !== undefined ? 'skillIdsUsed' : null,
  ]
    .filter(Boolean)
    .join(' and ');

  return `Updated ${updatedFields} for task ${id}`;
};
