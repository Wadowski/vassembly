import type { AiProviderTestResult } from "../types";

export interface TestConnectionParams {
  listModels: () => Promise<string[]>;
  emptyModelsError?: string;
}

const CONSOLE_LOG_PREFIX = "client-langchain ::";

export const testConnection = async ({
  listModels,
  emptyModelsError,
}: TestConnectionParams): Promise<AiProviderTestResult> => {
  try {
    const models = await listModels();

    if (emptyModelsError && models.length === 0) {
      return {
        success: false,
        error: emptyModelsError,
      };
    }

    return { success: true, models };
  } catch (error) {
    console.error(`${CONSOLE_LOG_PREFIX} testConnection failed`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
