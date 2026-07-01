export interface TaskDetailSkillsUsedProps {
  skillIds: string[];
  isAdmin: boolean;
}

export interface TaskDetailSkillsUsedViewProps extends TaskDetailSkillsUsedProps {
  linked: {
    skills: Array<{ id: string; name: string; specializationId: string }>;
    loading: boolean;
  };
}
