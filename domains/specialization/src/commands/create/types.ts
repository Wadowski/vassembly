export interface CreateSpecializationCommandInput {
  name: string;
  description: string;
}

export interface CreateSpecializationCommandResult {
  id: string;
  isNew: boolean;
}
