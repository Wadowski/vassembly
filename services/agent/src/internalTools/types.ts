export interface InternalToolBinding {
  toolId: string;
  handler: (args: Record<string, unknown>) => Promise<string>;
}

export interface InternalToolContext {
  userId: string;
  taskId: string;
  commentId: string;
  invocationId: string;
  callerAgentType: 'personal' | 'system';
  callerAgentId: string;
  recursionDepth: number;
  rootInvokeId: string;
  specializationIds?: string[] | null;
  parentAgentId?: string;
  parentInvocationId?: string;
  spawnBatchId?: string;
  abortSignal?: AbortSignal;
  shouldAbort?: () => Promise<boolean>;
  recordAgentInvokeProgress?: RecordAgentInvokeProgress;
  recordMcpUsageEvent?: RecordMcpUsageEvent;
}

export type CredentialScope = 'platform' | 'user';

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
  credentialSource?: CredentialScope;
}

export type RecordAgentInvokeProgress = (
  input: AgentInvokeProgressEventInput,
) => Promise<void>;

export interface McpUsageEventStartedInput {
  phase: 'started';
  mcpId: string;
  toolName: string;
  args: Record<string, unknown>;
  startedAt: Date;
  agentId?: string;
  invocationId?: string;
  rootInvokeId?: string;
}

export interface McpUsageEventCompletedInput {
  phase: 'completed';
  eventId: string;
  status: 'success' | 'error';
  endedAt: Date;
  durationMs: number;
  errorMessage?: string;
}

export type RecordMcpUsageEventInput =
  | McpUsageEventStartedInput
  | McpUsageEventCompletedInput;

export type RecordMcpUsageEvent = (
  input: RecordMcpUsageEventInput,
) => Promise<string | void>;

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
  credentialScope?: CredentialScope;
  connectionOverride?: { integrationCredentialId: string };
  mcpIdsOverride?: string[];
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
