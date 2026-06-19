export interface InternalToolBinding {
  toolId: string;
  handler: (args: Record<string, unknown>) => Promise<string>;
}

export interface InternalToolContext {
  userId: string;
  taskId: string;
  invocationId: string;
  callerAgentType: 'personal' | 'system';
  callerAgentId: string;
  recursionDepth: number;
  rootInvokeId: string;
  parentAgentId?: string;
  parentInvocationId?: string;
  spawnBatchId?: string;
  abortSignal?: AbortSignal;
  shouldAbort?: () => Promise<boolean>;
  recordAgentInvokeProgress?: RecordAgentInvokeProgress;
}

export interface AgentInvokeProgressEventInput {
  agentId: string;
  parentAgentId?: string;
  state: 'started' | 'completed' | 'failed' | 'waiting';
  timestamp?: Date;
  duration?: number;
  inputMessages?: string;
  generatedResponse?: string;
  tokenUsage?: { input: number; output: number; total: number };
  errorDetails?: { message: string; type?: string; stackTrace?: string };
  integrationName?: string;
  provider?: string;
  model?: string;
}

export type RecordAgentInvokeProgress = (
  input: AgentInvokeProgressEventInput,
) => Promise<void>;

export type InternalToolHandler = (args: Record<string, unknown>) => Promise<string>;

export type InternalToolHandlerMap = Record<string, InternalToolHandler>;

export interface LoadAssignedInternalToolsParams {
  assignedToolIds: string[];
  toolContext: InternalToolContext;
}

export interface LoadAssignedInternalToolsResult {
  bindings: InternalToolBinding[];
  boundToolIds: string[];
  skippedToolIds: string[];
}

export interface RunAgentInvokeWithToolsParams {
  userId: string;
  agentType: 'personal' | 'system';
  agentId: string;
  message: string;
  connectionOverride?: { integrationCredentialId: string };
  toolContext: InternalToolContext;
}

export interface RunAgentInvokeWithToolsResult {
  message: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens?: number };
  metadata: {
    model?: string;
    provider?: string;
    mcpIdsUsed: string[];
    skippedMcpIds: string[];
    internalToolIdsUsed: string[];
    skippedInternalToolIds: string[];
    maxUseAgentDepth: number;
  };
}
