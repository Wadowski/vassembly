export interface BackfillItemSkillIdCommandInput {
  id: string;
  templateItemIndex: number;
  skillId: string;
}

export interface BackfillItemSkillIdCommandResult {
  data: {
    items?: Array<{ skillId: string | null }>;
  };
}
