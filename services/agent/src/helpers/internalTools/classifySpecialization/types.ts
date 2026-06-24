export interface ClassifySpecializationArgs {
  taskId: string;
  description: string;
}

export type ClassifySpecializationResult =
  | { type: 'existing'; specializationIds: string[] }
  | { type: 'new'; name: string; description: string }
  | { type: 'skipped'; reason: string };
