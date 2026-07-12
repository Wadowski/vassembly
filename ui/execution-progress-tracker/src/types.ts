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
  state: 'STARTED' | 'COMPLETED' | 'FAILED' | 'WAITING';
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

export interface ProgressAnsweredQuestion {
  questionId: string;
  question: string;
  answer: string;
  askedAt: string;
  answeredAt: string;
}

export type TimelineItemKind = 'progress-event' | 'question-asked' | 'answer-submitted';

export interface TimelineItem {
  id: string;
  kind: TimelineItemKind;
  timestamp: Date;
  progressEvent?: ProgressEvent;
  questionData?: ProgressAnsweredQuestion;
}

export interface TaskProgressData {
  id: string;
  taskId: string;
  startedAt: Date;
  completedAt: Date | null;
  totalDuration: number;
  totalTokens: TokenUsage;
  executionAttempt: number;
  events: ProgressEvent[];
}

export interface ExecutionProgressTrackerProps {
  taskId: string;
  userId?: string;
  taskStatus?: 'created' | 'in-progress' | 'waiting' | 'done' | 'failed' | 'paused';
  hasAssignedAgent?: boolean;
  answeredQuestions?: ProgressAnsweredQuestion[];
  onTaskCompleted?: (taskProgress: TaskProgressData) => void;
}

export interface ProgressListProps {
  items: TimelineItem[];
  selectedEventId: string | null;
  onSelectEvent: (eventId: string, trigger?: HTMLButtonElement | null) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export interface ProgressItemProps {
  item: TimelineItem;
  isSelected: boolean;
  onSelect: (trigger?: HTMLButtonElement | null) => void;
  relativeTimeTick?: number;
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
  taskStatus?: 'created' | 'in-progress' | 'waiting' | 'done' | 'failed' | 'paused';
}
