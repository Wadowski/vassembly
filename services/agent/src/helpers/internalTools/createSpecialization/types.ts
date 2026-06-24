export interface CreateSpecializationArgs {
  name: string;
  description: string;
}

export interface CreateSpecializationToolResult {
  specializationId: string;
  isNew: boolean;
}
