const ENCODED_VALUE_PATTERN = /^[0-9a-f]+:[0-9a-f]+$/i;
const TEST_ENCODED_PREFIX = 'enc:';

export const isEncryptedValue = ({ value }: { value: string | boolean }): boolean => {
  if (typeof value !== 'string') {
    return false;
  }

  return value.startsWith(TEST_ENCODED_PREFIX) || ENCODED_VALUE_PATTERN.test(value);
};
