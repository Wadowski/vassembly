import { INTENT_CATEGORY_SLUG, normalizeIntentCategorySlug } from '@vassembly/constants';
import taskDomain from '@vassembly/domain-task';
import { ValidationError } from '@vassembly/errors';

import { resolveTaskId } from './resolveTaskId';
import { syncTaskSpecializationIds } from './syncTaskSpecializationIds';

import type { InternalToolContext } from '../types';

const VALID_SLUGS = new Set<string>(Object.values(INTENT_CATEGORY_SLUG));

const resolveCategoryArg = ({
  category,
}: {
  category: unknown;
}): INTENT_CATEGORY_SLUG | null | undefined => {
  if (category === undefined) {
    return undefined;
  }

  if (category === null) {
    return null;
  }

  if (typeof category !== 'string') {
    return normalizeIntentCategorySlug(String(category));
  }

  return normalizeIntentCategorySlug(category);
};

const isValidSpecializationIds = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.length <= 3 &&
  value.every((item) => typeof item === 'string' && item.length > 0);

const isValidSkillIdsUsed = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string' && item.length > 0);

export const updateTaskToolHandler = async (
  args: Record<string, unknown>,
  context?: InternalToolContext,
): Promise<string> => {
  const id = resolveTaskId({ args, context });
  const { title, category: rawCategory, specializationIds, skillIdsUsed } = args;
  const category = resolveCategoryArg({ category: rawCategory });

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

  if (rawCategory !== undefined && rawCategory !== null && category === null) {
    throw new ValidationError(`category must be one of: ${[...VALID_SLUGS].join(', ')}`);
  }

  if (specializationIds !== undefined && !isValidSpecializationIds(specializationIds)) {
    throw new ValidationError('specializationIds must be an array of max 3 strings');
  }

  if (skillIdsUsed !== undefined && !isValidSkillIdsUsed(skillIdsUsed)) {
    throw new ValidationError('skillIdsUsed must be an array of non-empty strings');
  }

  if (specializationIds !== undefined) {
    await syncTaskSpecializationIds({
      taskId: id,
      specializationIds,
      context,
    });
  }

  if (title !== undefined || category !== undefined || skillIdsUsed !== undefined) {
    await taskDomain.commands.updateTask({
      id,
      ...(title !== undefined ? { title } : {}),
      ...(category !== undefined ? { category: category as INTENT_CATEGORY_SLUG | null } : {}),
      ...(skillIdsUsed !== undefined ? { skillIdsUsed } : {}),
    });
  }

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
