import { scryptSync, createDecipheriv } from 'crypto';
import { config } from '@vassembly/config';

const { secret, algorithm } = config.encoder;

function deriveKey(): Buffer {
  return scryptSync(secret, 'salt', 32);
}

export function decode(encoded: string): string {
  const key = deriveKey();
  const [ivHex, encryptedHex] = encoded.split(':');

  if (!ivHex || !encryptedHex) {
    throw new Error('Invalid encoded format');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const decipher = createDecipheriv(algorithm, key, iv);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
