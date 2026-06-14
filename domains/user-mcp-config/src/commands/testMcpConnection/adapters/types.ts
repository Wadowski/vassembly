export interface McpTestAdapterParams {
  fieldValues: Record<string, string | boolean>;
}

export interface McpTestAdapterResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface McpTestAdapter {
  test: (params: McpTestAdapterParams) => Promise<McpTestAdapterResult>;
}
