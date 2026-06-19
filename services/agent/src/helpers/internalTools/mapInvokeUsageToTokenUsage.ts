export interface InvokeUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens?: number;
}

export interface TokenUsage {
  input: number;
  output: number;
  total: number;
}

export interface MapInvokeUsageToTokenUsageParams {
  usage?: InvokeUsage;
}

export const mapInvokeUsageToTokenUsage = ({
  usage,
}: MapInvokeUsageToTokenUsageParams): TokenUsage | undefined => {
  if (!usage) {
    return undefined;
  }

  const input = usage.promptTokens || 0;
  const output = usage.completionTokens || 0;

  return {
    input,
    output,
    total: usage.totalTokens ?? input + output,
  };
};
