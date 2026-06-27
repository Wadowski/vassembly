import type { InternalToolContext } from '../types';

export interface ResolveSpecializationIdsParams {
  args: Record<string, unknown>;
  context: InternalToolContext;
}

const parseSpecializationIdsFromArgs = (args: Record<string, unknown>): string[] | undefined => {
  const raw = args.specializationIds;

  if (!Array.isArray(raw)) {
    return undefined;
  }

  const ids = raw
    .filter((id): id is string => typeof id === 'string' && id.trim() !== '')
    .map((id) => id.trim());

  return ids.length > 0 ? ids : undefined;
};

const parseSpecializationIdsFromContext = (
  context: InternalToolContext,
): string[] | undefined => {
  const ids =
    context.specializationIds
      ?.filter((id): id is string => typeof id === 'string' && id.trim() !== '')
      .map((id) => id.trim()) ?? [];

  return ids.length > 0 ? ids : undefined;
};

export const resolveSpecializationIds = ({
  args,
  context,
}: ResolveSpecializationIdsParams): string[] | undefined => {
  const fromArgs = parseSpecializationIdsFromArgs(args);

  if (fromArgs !== undefined) {
    return fromArgs;
  }

  return parseSpecializationIdsFromContext(context);
};
