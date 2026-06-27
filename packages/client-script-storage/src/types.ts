export interface GetScriptContentParams {
  storageKey: string;
}

export interface PutScriptContentParams {
  storageKey: string;
  content: string;
}

export interface RemoveScriptContentParams {
  storageKey: string;
}

export interface ScriptStorageStrategy {
  getScriptContent: (params: GetScriptContentParams) => Promise<string>;
  putScriptContent: (params: PutScriptContentParams) => Promise<void>;
  removeScriptContent: (params: RemoveScriptContentParams) => Promise<void>;
}
