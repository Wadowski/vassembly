export interface LinkedSkillItem {
  id: string;
  name: string;
  specializationId: string;
}

export interface UseLinkedSkillsArgs {
  ids: string[];
}

export interface UseLinkedSkillsResult {
  skills: LinkedSkillItem[];
  loading: boolean;
}
