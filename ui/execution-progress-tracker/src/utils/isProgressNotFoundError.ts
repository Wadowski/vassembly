export const isProgressNotFoundError = (error: Error): boolean =>
  error.message.toLowerCase().includes('task progress not found') ||
  error.message.toLowerCase().includes('not found');
