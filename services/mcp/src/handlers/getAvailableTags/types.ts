export interface ServiceContext {
  authenticatedUserId?: string;
}

export type GetAvailableTagsInput = Record<string, never>;

export interface GetAvailableTagsResult {
  tags: string[];
}
