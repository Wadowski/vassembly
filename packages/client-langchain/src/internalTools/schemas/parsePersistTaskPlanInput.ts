import { z } from 'zod';
import { repairLlmJson, tryParseJson } from '@vassembly/validation';

export const persistTaskPlanItemSchema = z.object({
  agentName: z.string().min(1).max(200),
  skillId: z.string().nullable(),
  skillName: z.string().min(1).max(64).nullable().optional(),
  description: z.string().min(1).max(500),
  order: z.number().int().nonnegative(),
});

const persistTaskPlanStrictSchema = z.object({
  shortName: z.string().min(1).max(120),
  description: z.string().min(1).max(500),
  inputDetails: z.record(z.string(), z.unknown()),
  outputDetails: z.record(z.string(), z.unknown()),
  resolvedInputDetails: z.record(z.string(), z.unknown()),
  items: z.array(persistTaskPlanItemSchema).min(1),
});

export type PersistTaskPlanSchemaOutput = z.infer<typeof persistTaskPlanStrictSchema>;

export const repairLlmToolArgumentsJson = ({ raw }: { raw: string }): string => {
  return repairLlmJson({ raw });
};

const slugifyShortName = ({ description }: { description: string }): string => {
  const slug = description
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);

  return slug.length > 0 ? slug : 'task-plan';
};

const coerceNullableSkillName = (value: unknown): string | null => {
  if (value === null || value === undefined || value === 'null' || value === 'none') {
    return null;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  return null;
};

const coerceNullableSkillId = (value: unknown): string | null => {
  if (value === null || value === undefined || value === 'null' || value === 'none') {
    return null;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }

  return null;
};

const coerceOrder = (value: unknown): number => {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);

    if (!Number.isNaN(parsed) && parsed >= 0) {
      return parsed;
    }
  }

  return 0;
};

const coerceJsonRecord = (value: unknown): Record<string, unknown> => {
  if (value === null || value === undefined) {
    return {};
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      return {};
    }

    const parsed = tryParseJsonObject({ raw: trimmed });

    if (parsed !== null) {
      return parsed;
    }

    return { summary: value };
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return { value };
};

const coerceItems = (value: unknown): Array<Record<string, unknown>> => {
  let arrayValue = value;

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      return [];
    }

    const parsed = tryParseJson({ raw: trimmed });

    if (Array.isArray(parsed)) {
      arrayValue = parsed;
    } else {
      const repaired = repairLlmToolArgumentsJson({ raw: trimmed });
      const repairedParsed = tryParseJson({ raw: repaired });

      if (Array.isArray(repairedParsed)) {
        arrayValue = repairedParsed;
      } else {
        return [];
      }
    }
  }

  if (!Array.isArray(arrayValue)) {
    return [];
  }

  return arrayValue.filter((item): item is Record<string, unknown> => {
    return typeof item === 'object' && item !== null && !Array.isArray(item);
  });
};

const extractShortNameFromCorruptedKeys = ({
  record,
}: {
  record: Record<string, unknown>;
}): string | undefined => {
  for (const [key, value] of Object.entries(record)) {
    if (key.includes('shortName') && typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  return undefined;
};

const tryParseJsonObject = ({ raw }: { raw: string }): Record<string, unknown> | null => {
  const repaired = repairLlmToolArgumentsJson({ raw });
  const candidates = [raw, repaired];

  for (const candidate of candidates) {
    const parsed = tryParseJson({ raw: candidate });

    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  }

  return null;
};

export const transformPersistTaskPlanShapedInput = (
  source: Record<string, unknown>,
): Record<string, unknown> => {
  const description =
    typeof source.description === 'string' && source.description.trim().length > 0
      ? source.description.trim()
      : undefined;

  if (!description) {
    return source;
  }

  const shortNameFromSource =
    typeof source.shortName === 'string' && source.shortName.trim().length > 0
      ? source.shortName.trim()
      : extractShortNameFromCorruptedKeys({ record: source });

  const shortName = shortNameFromSource ?? slugifyShortName({ description });

  const items = coerceItems(source.items).map((item) => ({
    agentName:
      typeof item.agentName === 'string'
        ? item.agentName
        : typeof item.agentId === 'string'
          ? item.agentId
          : '',
    skillId: coerceNullableSkillId(item.skillId),
    skillName: coerceNullableSkillName(item.skillName),
    description: typeof item.description === 'string' ? item.description.trim() : '',
    order: coerceOrder(item.order),
  }));

  return {
    shortName,
    description,
    inputDetails: coerceJsonRecord(source.inputDetails),
    outputDetails: coerceJsonRecord(source.outputDetails),
    resolvedInputDetails: coerceJsonRecord(source.resolvedInputDetails),
    items,
  };
};

export const persistTaskPlanShapeCoercion = {
  recordJsonFields: ['inputDetails', 'outputDetails', 'resolvedInputDetails'],
};

export const normalizePersistTaskPlanInput = (raw: unknown): PersistTaskPlanSchemaOutput => {
  let source: Record<string, unknown>;

  if (typeof raw === 'string') {
    const parsed = tryParseJsonObject({ raw });
    source = parsed ?? {};
  } else if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
    source = raw as Record<string, unknown>;
  } else {
    source = {};
  }

  const normalized = transformPersistTaskPlanShapedInput(source);

  return persistTaskPlanStrictSchema.parse(normalized);
};

export const persistTaskPlanSchema = persistTaskPlanStrictSchema;
