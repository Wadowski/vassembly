import type { ApplySeedContextParams } from './types';

export const applySeedContext = ({ context }: ApplySeedContextParams): void => {
  process.env.MONGODB_URL = context.mongoUrl;
  process.env.MONGODB_DATABASE = context.mongoDatabase;
};
