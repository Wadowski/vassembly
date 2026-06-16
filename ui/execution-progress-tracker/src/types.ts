export interface TokenUsage {
  input: number;
  output: number;
  total: number;
}

export interface ErrorDetails {
  message: string;
  type: string;
  stackTrace?: string;
}

export interface ProgressEvent {
  id: string;
  agentId: string;
  agentName: string;
  parentAgentId: string | null;
  state: 'STARTED' | 'COMPLETED' | 'FAILED';
  timestamp: Date;
  duration: number | null;
  inputMessages: string | null;
  generatedResponse: string | null;
  tokenUsage: TokenUsage | null;
  errorDetails: ErrorDetails | null;
  integrationName: string | null;
  provider: string | null;
  model: string | null;
}

export interface TaskProgressData {
  id: string;
  taskId: string;
  startedAt: Date;
  completedAt: Date | null;
  totalDuration: number;
  totalTokens: TokenUsage;
  events: ProgressEvent[];
}

export interface ExecutionProgressTrackerProps {
  taskId: string;
  userId?: string;
  taskStatus?: 'created' | 'in-progress' | 'done' | 'failed' | 'paused';
  onTaskCompleted?: (taskProgress: TaskProgressData) => void;
}

export interface ProgressListProps {
  events: ProgressEvent[];
  selectedEventId: string | null;
  onSelectEvent: (eventId: string) => void;
}

export interface ProgressItemProps {
  event: ProgressEvent;
  isSelected: boolean;
  onSelect: () => void;
}

export interface ProgressDetailModalProps {
  isOpen: boolean;
  event: ProgressEvent | null;
  onClose: () => void;
}

export interface TokenUsageWidgetProps {
  tokenUsage: TokenUsage;
  variant?: 'inline' | 'expanded';
}

export interface ProgressHeaderProps {
  taskProgress: TaskProgressData;
  taskStatus?: 'created' | 'in-progress' | 'done' | 'failed' | 'paused';
}
