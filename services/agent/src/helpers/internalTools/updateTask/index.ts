import { INTENT_CATEGORY_SLUG } from '@vassembly/constants';
import taskDomain from '@vassembly/domain-task';
import { ValidationError } from '@vassembly/errors';

const VALID_SLUGS = new Set<string>(Object.values(INTENT_CATEGORY_SLUG));

export const updateTaskToolHandler = async (args: Record<string, unknown>): Promise<string> => {
  const id = typeof args.id === 'string' ? args.id : typeof args.taskId === 'string' ? args.taskId : '';
  const { title, category } = args;

  if (!id) {
    throw new ValidationError('id is required');
  }

  if (title === undefined && category === undefined) {
    throw new ValidationError('At least one of title or category must be provided');
  }

  if (title !== undefined && (typeof title !== 'string' || !title)) {
    throw new ValidationError('title must be a non-empty string');
  }

  if (category !== undefined && category !== null && !VALID_SLUGS.has(String(category))) {
    throw new ValidationError(`category must be one of: ${[...VALID_SLUGS].join(', ')}`);
  }

  await taskDomain.commands.updateTask({
    id,
    ...(title !== undefined ? { title } : {}),
    ...(category !== undefined ? { category: category as INTENT_CATEGORY_SLUG | null } : {}),
  });

  const updatedFields = [title !== undefined ? 'title' : null, category !== undefined ? 'category' : null]
    .filter(Boolean)
    .join(' and ');

  return `Updated ${updatedFields} for task ${id}`;
};
