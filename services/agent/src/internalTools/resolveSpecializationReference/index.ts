import specializationDomain from '@vassembly/domain-specialization';
import systemAgentDomain from '@vassembly/domain-system-agent';
import { ValidationError } from '@vassembly/errors';

import type {
  ResolveSpecializationReferenceParams,
  ResolveSpecializationReferenceResult,
} from './types';

const MONGODB_OBJECT_ID_HEX = /^[a-f\d]{24}$/i;

const isMongoDbObjectId = (value: string): boolean => MONGODB_OBJECT_ID_HEX.test(value);

const toSpecializationReference = ({
  id,
  name,
}: {
  id: string | undefined;
  name: string | undefined;
}): ResolveSpecializationReferenceResult | null => {
  if (!id || !name) {
    return null;
  }

  return { id, name };
};

const resolveByObjectId = async (
  id: string,
): Promise<ResolveSpecializationReferenceResult | null> => {
  if (!isMongoDbObjectId(id)) {
    return null;
  }

  try {
    const result = await specializationDomain.queries.getModelById({ id });
    return toSpecializationReference({
      id: result.data.id,
      name: result.data.name,
    });
  } catch {
    return null;
  }
};

const resolveByName = async (
  name: string,
): Promise<ResolveSpecializationReferenceResult | null> => {
  try {
    const result = await specializationDomain.queries.getModelByName({ name });
    return toSpecializationReference({
      id: result.data.id,
      name: result.data.name,
    });
  } catch {
    return null;
  }
};

const resolveFromContextSpecializationIds = async ({
  specializationRef,
  context,
}: ResolveSpecializationReferenceParams): Promise<ResolveSpecializationReferenceResult | null> => {
  const contextIds = (context.specializationIds ?? []).filter(
    (id): id is string => typeof id === 'string' && id.trim().length > 0,
  );

  if (contextIds.length === 0) {
    return null;
  }

  const normalizedRef = specializationRef?.trim().toLowerCase() ?? '';

  for (const id of contextIds) {
    const specialization = await resolveByObjectId(id);

    if (!specialization) {
      continue;
    }

    if (contextIds.length === 1 && !normalizedRef) {
      return specialization;
    }

    if (normalizedRef && specialization.name.toLowerCase() === normalizedRef) {
      return specialization;
    }
  }

  if (contextIds.length === 1 && !normalizedRef) {
    return resolveByObjectId(contextIds[0]!);
  }

  return null;
};

const resolveFromAgentContext = async ({
  context,
}: ResolveSpecializationReferenceParams): Promise<ResolveSpecializationReferenceResult | null> => {
  const { data: callerAgent } = await systemAgentDomain.queries.getActiveById({
    id: context.callerAgentId,
  });

  const callerSpecializationId = callerAgent?.specializationId?.trim() ?? '';

  if (callerSpecializationId) {
    const specialization = await resolveByObjectId(callerSpecializationId);

    if (specialization) {
      return specialization;
    }
  }

  if (!context.parentAgentId) {
    return null;
  }

  const { data: parentAgent } = await systemAgentDomain.queries.getActiveById({
    id: context.parentAgentId,
  });

  const parentSpecializationId = parentAgent?.specializationId?.trim() ?? '';

  if (!parentSpecializationId) {
    return null;
  }

  return resolveByObjectId(parentSpecializationId);
};

export const resolveSpecializationReference = async (
  params: ResolveSpecializationReferenceParams,
): Promise<ResolveSpecializationReferenceResult> => {
  const specializationRef = params.specializationRef?.trim() ?? '';

  if (params.preferCallerSpecialization) {
    const fromAgent = await resolveFromAgentContext(params);

    if (fromAgent) {
      return fromAgent;
    }
  }

  if (specializationRef) {
    const byObjectId = await resolveByObjectId(specializationRef);

    if (byObjectId) {
      return byObjectId;
    }

    const byName = await resolveByName(specializationRef);

    if (byName) {
      return byName;
    }
  }

  const fromContext = await resolveFromContextSpecializationIds(params);

  if (fromContext) {
    return fromContext;
  }

  const fromAgent = await resolveFromAgentContext(params);

  if (fromAgent) {
    return fromAgent;
  }

  throw new ValidationError(
    specializationRef
      ? `Specialization not found: ${specializationRef}. Use a linked specialization id or name.`
      : 'specializationId is required',
  );
};
