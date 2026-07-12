import { createDb } from '@vassembly/commands';
import { ConflictError, ValidationError } from '@vassembly/errors';
import { validatorFactory } from '@vassembly/validation';
import { z } from 'zod';

import {
  SPECIALIZATION_DESCRIPTION_MAX_LENGTH,
  SPECIALIZATION_NAME_MAX_LENGTH,
  SPECIALIZATION_NAME_MIN_LENGTH,
} from '../../constants';
import { specializationMongodbDao } from '../../clients';
import { specializationFactory, SpecializationModel } from '../../model';

import type { CreateSpecializationCommandInput, CreateSpecializationCommandResult } from './types';

const CREATE_INPUT_SCHEMA = z.object({
  name: z.string().trim().min(SPECIALIZATION_NAME_MIN_LENGTH).max(SPECIALIZATION_NAME_MAX_LENGTH),
  description: z
    .string()
    .trim()
    .min(SPECIALIZATION_NAME_MIN_LENGTH)
    .max(SPECIALIZATION_DESCRIPTION_MAX_LENGTH),
});

const CREATE_DB_SCHEMA = z.object({
  name: z.string().min(SPECIALIZATION_NAME_MIN_LENGTH).max(SPECIALIZATION_NAME_MAX_LENGTH),
  description: z
    .string()
    .min(SPECIALIZATION_NAME_MIN_LENGTH)
    .max(SPECIALIZATION_DESCRIPTION_MAX_LENGTH),
});

const validateCreateInput = validatorFactory(CREATE_INPUT_SCHEMA);

const persistCreate = createDb<SpecializationModel>({
  dao: specializationMongodbDao,
  factory: specializationFactory,
  validationSchema: CREATE_DB_SCHEMA,
});

const isDuplicateKeyError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  return (error as { code?: number }).code === 11000;
};

const normalizeName = (name: string): string => name.trim().toLowerCase();

const findExistingByName = async ({
  name,
}: {
  name: string;
}): Promise<SpecializationModel | null> => {
  const row = await specializationMongodbDao.getRaw({ name: normalizeName(name) });

  if (!row) {
    return null;
  }

  const rowId = row.id ?? (row as { _id?: { toString(): string } })._id?.toString();

  if (!rowId) {
    return null;
  }

  return specializationFactory.create({
    ...(row as Partial<SpecializationModel>),
    id: rowId,
  });
};

export const create = async (
  input: CreateSpecializationCommandInput,
): Promise<CreateSpecializationCommandResult> => {
  const parsed = validateCreateInput(input);

  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.error);
  }

  const normalizedName = normalizeName(parsed.data.name);
  const description = parsed.data.description.trim();

  const existing = await findExistingByName({ name: normalizedName });

  if (existing?.id) {
    return {
      id: existing.id,
      isNew: false,
    };
  }

  try {
    const result = await persistCreate({
      name: normalizedName,
      description,
    });

    return {
      id: result.data.id!,
      isNew: true,
    };
  } catch (error) {
    if (!isDuplicateKeyError(error)) {
      throw error;
    }

    const racedExisting = await findExistingByName({ name: normalizedName });

    if (racedExisting?.id) {
      return {
        id: racedExisting.id,
        isNew: false,
      };
    }

    throw new ConflictError('Specialization name already exists', error);
  }
};
