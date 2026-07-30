export interface GetByIdsParams {
  ids: string[];
}

export interface GetByIdsResult {
  items: import('../../model/dto').McpListItemResponse[];
}
