import { promises as fs } from "fs";
import { join } from "path";
import { InternalError } from "@vassembly/errors";
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
    } catch (err) {
      throw new InternalError(
        `${CONSOLE_LOG_PREFIX} failed to read file at ${filePath}`
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
    } catch (err) {
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
    } catch (err) {
      throw new InternalError(
        `${CONSOLE_LOG_PREFIX} failed to remove file at ${filePath}`
      );
    }
  };

  return {
    read,
    write,
    remove,
  };
};
