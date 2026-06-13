import type { ApplyResolversProps } from './types';

export const applyResolvers = ({
  builder,
  queries,
  mutations,
}: ApplyResolversProps): void => {
  if (queries) {
    builder.queryFields(queries);
  }
  if (mutations) {
    builder.mutationFields(mutations);
  }
};
