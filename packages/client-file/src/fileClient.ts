import { promises as fs } from "fs";
import { join } from "path";
import { InternalError, NotFoundError } from "@vassembly/errors";
import { isEnoentError } from "./isEnoentError";
import {
  FileClientParams,
  ReadFileParams,
  WriteFileParams,
  RemoveFileParams,
  ClientFile,
} from "./types";

const CONSOLE_LOG_PREFIX = "client-file ::";

export const FileClient = ({
  basePath = process.cwd(),
}: FileClientParams): ClientFile => {
  const resolvePath = (filePath: string): string => {
    return join(basePath, filePath);
  };

  const read = async ({
    filePath,
  }: ReadFileParams): Promise<string> => {
    try {
      const resolvedPath = resolvePath(filePath);
      const content = await fs.readFile(resolvedPath, "utf-8");
      return content;
    } catch (error) {
      if (isEnoentError(error)) {
        throw new NotFoundError(
          `${CONSOLE_LOG_PREFIX} file not found at ${filePath}`,
          error,
        );
      }

      throw new InternalError(
        `${CONSOLE_LOG_PREFIX} failed to read file at ${filePath}`,
        error,
      );
    }
  };

  const write = async ({
    filePath,
    content,
  }: WriteFileParams): Promise<void> => {
    try {
      const resolvedPath = resolvePath(filePath);
      await fs.writeFile(resolvedPath, content, "utf-8");
    } catch {
      throw new InternalError(
        `${CONSOLE_LOG_PREFIX} failed to write file at ${filePath}`
      );
    }
  };

  const remove = async ({
    filePath,
  }: RemoveFileParams): Promise<void> => {
    try {
      const resolvedPath = resolvePath(filePath);
      await fs.unlink(resolvedPath);
    } catch (error) {
      if (isEnoentError(error)) {
        throw new NotFoundError(
          `${CONSOLE_LOG_PREFIX} file not found at ${filePath}`,
          error,
        );
      }

      throw new InternalError(
        `${CONSOLE_LOG_PREFIX} failed to remove file at ${filePath}`,
        error,
      );
    }
  };

  const removeIfExists = async ({
    filePath,
  }: RemoveFileParams): Promise<void> => {
    try {
      const resolvedPath = resolvePath(filePath);
      await fs.unlink(resolvedPath);
    } catch (error) {
      if (isEnoentError(error)) {
        return;
      }

      throw new InternalError(
        `${CONSOLE_LOG_PREFIX} failed to remove file at ${filePath}`,
        error,
      );
    }
  };

  return {
    read,
    write,
    remove,
    removeIfExists,
  };
};
