export type TaskSubmitResult =
  | { status: 'success' }
  | { status: 'unauthorized' }
  | { status: 'error'; message: string };

export interface UseTaskInputResult {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  error: string | null;
  handleSubmit: () => Promise<TaskSubmitResult | undefined>;
  handleBlur: () => void;
  clearInput: () => void;
}
