import { decode } from '@vassembly/client-encoder';

import { isEncryptedValue } from './isEncryptedValue';

export const decodeEncryptedFieldValues = (
  fieldValues: Record<string, string | boolean>,
): Record<string, string | boolean> => {
  const result = { ...fieldValues };

  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'string' && isEncryptedValue({ value })) {
      result[key] = decode(value);
    }
  }

  return result;
};
