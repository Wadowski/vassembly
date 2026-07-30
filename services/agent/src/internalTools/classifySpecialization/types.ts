export interface ClassifySpecializationArgs {
  taskId: string;
  description: string;
}

export interface NewSpecializationEntry {
  name: string;
  description: string;
}

export type ClassifySpecializationResult =
  | {
      type: 'classified';
      existingSpecializationIds: string[];
      newSpecializations: NewSpecializationEntry[];
    }
  | { type: 'skipped'; reason: string };
