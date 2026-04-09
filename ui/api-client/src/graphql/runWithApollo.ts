import { InternalError } from '@vassembly/errors';

import { mapApolloError } from './mapApolloError';
import type { RunWithApolloProps } from './types'

export const runWithApollo = async <TData>({
  options,
  execute,
}: RunWithApolloProps<unknown, TData>): Promise<TData> => {
  try {
    const result = await execute({ headers: options.headers ?? {} });

    if (result.data === undefined || result.data === null) {
      throw new InternalError('GraphQL response missing data');
    }

    return result.data;
  } catch (error) {
    return mapApolloError(error);
  }
};
