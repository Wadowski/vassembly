import type { ScriptStorageClient } from '../../clients';
import type { SkillScript } from '../../model';

import { buildSkillScriptStorageKey } from './buildStorageKey';
import type { SkillScriptInput } from './types';

export interface PersistSkillScriptsParams {
  skillId: string;
  scripts: SkillScriptInput[];
  scriptStorageClient: ScriptStorageClient;
}

export const persistSkillScripts = async ({
  skillId,
  scripts,
  scriptStorageClient,
}: PersistSkillScriptsParams): Promise<SkillScript[]> => {
  const persistedScripts: SkillScript[] = [];

  for (const script of scripts) {
    const storageKey = buildSkillScriptStorageKey({ skillId, filename: script.filename });

    await scriptStorageClient.putScriptContent({
      storageKey,
      content: script.content,
    });

    persistedScripts.push({
      filename: script.filename,
      language: script.language,
      storageKey,
    });
  }

  return persistedScripts;
};

export interface RemoveSkillScriptsParams {
  scripts: SkillScript[];
  scriptStorageClient: ScriptStorageClient;
}

export const removeSkillScripts = async ({
  scripts,
  scriptStorageClient,
}: RemoveSkillScriptsParams): Promise<void> => {
  await Promise.all(
    scripts.map((script) =>
      scriptStorageClient.removeScriptContent({ storageKey: script.storageKey }),
    ),
  );
};
