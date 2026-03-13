export interface DeepseekAiChatParams {
  systemMessage?: string;
  userMessage: string;
}

export interface DeepseekAiResponse {
  message: string;
}

export interface DeepseekAiClientParams {
  apiKey: string;
  baseURL: string;
}

export interface ClientDeepseekAi {
  chat: (params: DeepseekAiChatParams) => Promise<DeepseekAiResponse>;
}
