export interface ServiceContext {
  authenticatedUserId?: string;
}

export interface GetAvailableTagsInput {}

export interface GetAvailableTagsResult {
  tags: string[];
}
