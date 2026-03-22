import * as bcrypt from 'bcrypt';

export async function hash({ text }: { text: string }): Promise<string> {
  return bcrypt.hash(text, 10);
}
