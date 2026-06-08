export interface BuildTagsFilterParams {
  tags?: string[];
}

export const buildTagsFilter = ({
  tags,
}: BuildTagsFilterParams): Record<string, unknown> | undefined => {
  if (tags === undefined || tags.length === 0) {
    return undefined;
  }

  return { tags: { $in: tags } };
};
