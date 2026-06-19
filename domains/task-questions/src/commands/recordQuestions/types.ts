import type {
  AgentType,
  InvocationResumeCheckpoint,
  TaskQuestionsModel,
} from '../../model';

export interface RecordQuestionInput {
  questionId?: string;
  question: string;
  inputType?: 'text' | 'select' | 'multiselect' | 'boolean';
  options?: string[];
  schema?: Record<string, unknown>;
}

export interface RecordQuestionsCommandInput {
  taskId: string;
  invocationId: string;
  askedByAgentId: string;
  askedByAgentType: AgentType;
  questions: RecordQuestionInput[];
  resumeCheckpoint?: InvocationResumeCheckpoint;
}

export interface RecordQuestionsCommandResult {
  data: TaskQuestionsModel;
}
