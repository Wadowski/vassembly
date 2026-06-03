import { InternalError } from '@vassembly/errors';
import type {
  DeserializeCacheValueParams,
  SerializeCacheValueParams,
} from './types';

export const serializeCacheValue = <T>({ value }: SerializeCacheValueParams<T>): string =>
  JSON.stringify(value);

export const deserializeCacheValue = <T>({ serialized }: DeserializeCacheValueParams): T => {
  try {
    return JSON.parse(serialized) as T;
  } catch (error) {
    throw new InternalError('Failed to deserialize cache value', error);
  }
};
