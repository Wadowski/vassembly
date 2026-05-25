import { InternalError } from "@vassembly/errors";

export interface GetModelsParams {
  listModels: () => Promise<string[]>;
  errorMessage: string;
}

const CONSOLE_LOG_PREFIX = "client-langchain ::";

export const getModels = async ({
  listModels,
  errorMessage,
}: GetModelsParams): Promise<string[]> => {
  try {
    return await listModels();
  } catch (error) {
    console.error(`${CONSOLE_LOG_PREFIX} getModels failed`, error);
    throw new InternalError(errorMessage, error);
  }
};
