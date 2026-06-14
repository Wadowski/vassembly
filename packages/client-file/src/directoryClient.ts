import { promises as fs } from "fs";
import { join } from "path";
import { InternalError } from "@vassembly/errors";
import {
  DirectoryClientParams,
  ListDirectoryParams,
  CreateDirectoryParams,
  RemoveDirectoryParams,
  DirectoryEntry,
  ClientDirectory,
} from "./types";

const CONSOLE_LOG_PREFIX = "client-file-directory ::";

export const DirectoryClient = ({
  basePath = process.cwd(),
}: DirectoryClientParams): ClientDirectory => {
  const resolvePath = (dirPath: string): string => {
    return join(basePath, dirPath);
  };

  const list = async ({
    dirPath,
  }: ListDirectoryParams): Promise<DirectoryEntry[]> => {
    try {
      const resolvedPath = resolvePath(dirPath);
      const entries = await fs.readdir(resolvedPath, { withFileTypes: true });
      return entries.map((entry) => ({
        name: entry.name,
        isDirectory: entry.isDirectory(),
      }));
    } catch {
      throw new InternalError(
        `${CONSOLE_LOG_PREFIX} failed to list directory at ${dirPath}`
      );
    }
  };

  const create = async ({
    dirPath,
  }: CreateDirectoryParams): Promise<void> => {
    try {
      const resolvedPath = resolvePath(dirPath);
      await fs.mkdir(resolvedPath, { recursive: true });
    } catch {
      throw new InternalError(
        `${CONSOLE_LOG_PREFIX} failed to create directory at ${dirPath}`
      );
    }
  };

  const remove = async ({
    dirPath,
  }: RemoveDirectoryParams): Promise<void> => {
    try {
      const resolvedPath = resolvePath(dirPath);
      await fs.rm(resolvedPath, { recursive: true, force: true });
    } catch {
      throw new InternalError(
        `${CONSOLE_LOG_PREFIX} failed to remove directory at ${dirPath}`
      );
    }
  };

  return {
    list,
    create,
    remove,
  };
};
