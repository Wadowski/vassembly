import * as bcrypt from 'bcrypt';
import { CompareHashInput } from './types';

export async function compareHash({ text, hash }: CompareHashInput): Promise<boolean> {
  return bcrypt.compare(text, hash);
}
