export interface SkillCatalogItem {
  name: string;
  description: string;
}

export interface GetCatalogBySpecializationIdParams {
  specializationId: string;
}

export interface GetCatalogBySpecializationIdResult {
  items: SkillCatalogItem[];
}
