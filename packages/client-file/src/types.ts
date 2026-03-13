export interface FileClientParams {
  basePath?: string;
}

export interface ReadFileParams {
  filePath: string;
}

export interface WriteFileParams {
  filePath: string;
  content: string;
}

export interface RemoveFileParams {
  filePath: string;
}

export interface ClientFile {
  read: (params: ReadFileParams) => Promise<string>;
  write: (params: WriteFileParams) => Promise<void>;
  remove: (params: RemoveFileParams) => Promise<void>;
}

export interface DirectoryClientParams {
  basePath?: string;
}

export interface ListDirectoryParams {
  dirPath: string;
}

export interface DirectoryEntry {
  name: string;
  isDirectory: boolean;
}

export interface CreateDirectoryParams {
  dirPath: string;
}

export interface RemoveDirectoryParams {
  dirPath: string;
}

export interface ClientDirectory {
  list: (params: ListDirectoryParams) => Promise<DirectoryEntry[]>;
  create: (params: CreateDirectoryParams) => Promise<void>;
  remove: (params: RemoveDirectoryParams) => Promise<void>;
}
