import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { NotFoundError } from '@vassembly/errors';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { LocalScriptStorageStrategy } from './index';

describe('LocalScriptStorageStrategy', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `test-local-script-storage-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should store and retrieve script content', async () => {
    const strategy = LocalScriptStorageStrategy({ rootPath: testDir });
    const storageKey = 'skill-1/main.py';
    const content = 'print("hello")';

    await strategy.putScriptContent({ storageKey, content });

    const result = await strategy.getScriptContent({ storageKey });
    expect(result).toBe(content);
  });

  it('should throw NotFoundError when script file is missing', async () => {
    const strategy = LocalScriptStorageStrategy({ rootPath: testDir });

    await expect(
      strategy.getScriptContent({ storageKey: 'missing/script.py' }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should remove script content without error when file is missing', async () => {
    const strategy = LocalScriptStorageStrategy({ rootPath: testDir });

    await expect(
      strategy.removeScriptContent({ storageKey: 'missing/script.py' }),
    ).resolves.toBeUndefined();
  });
});
