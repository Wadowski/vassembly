export interface SkillCatalogItem {
  name: string;
  description: string;
  input: string;
  output: string;
}

export interface GetCatalogBySpecializationIdParams {
  specializationId: string;
}

export interface GetCatalogBySpecializationIdResult {
  items: SkillCatalogItem[];
}
