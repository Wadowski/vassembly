import path from 'node:path';
import { createRequire } from 'node:module';

const nodeRequire = createRequire(path.resolve('package.json'));

export const getE2ePackageRoot = (): string => {
  return path.dirname(nodeRequire.resolve('@vassembly/e2e/package.json'));
};
