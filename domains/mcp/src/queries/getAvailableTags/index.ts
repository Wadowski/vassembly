import { mcpMongodbDao } from '../../clients';

export interface GetAvailableTagsResult {
  tags: string[];
}

export const getAvailableTags = async (): Promise<GetAvailableTagsResult> => {
  const tags = await mcpMongodbDao.collection.distinct('tags');

  return { tags: tags.sort() };
};
