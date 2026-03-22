import { createCipheriv, randomBytes, scryptSync } from 'crypto';
import { config } from '@vassembly/config';

const { secret, algorithm } = config.encoder;

function deriveKey(): Buffer {
  return scryptSync(secret, 'salt', 32);
}

export function encode(text: string): string {
  const key = deriveKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return `${iv.toString('hex')}:${encrypted}`;
}
