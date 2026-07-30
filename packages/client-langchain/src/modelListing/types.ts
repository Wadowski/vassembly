export interface ListOpenAiModelsParams {
  apiKey: string;
  baseUrl?: string | null;
  organizationId?: string | null;
}

export interface ListGeminiModelsParams {
  apiKey: string;
}

export interface GeminiModelApiEntry {
  name?: string;
  supportedGenerationMethods?: string[];
}

export interface GeminiListModelsApiResponse {
  models?: GeminiModelApiEntry[];
  nextPageToken?: string;
}

export interface ListAnthropicModelsParams {
  apiKey: string;
}
