import { ApolloError } from '@apollo/client';

import { CommonError, ErrorTypes, InternalError } from '@vassembly/errors';

import { mapHttpStatusToError } from '../http/mapHttpStatusToError';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export function mapApolloError(error: unknown): never {
  if (error instanceof ApolloError) {
    const networkError = error.networkError;

    if (networkError && isRecord(networkError)) {
      const statusCode = networkError['statusCode'];

      if (typeof statusCode === 'number') {
        const message = error.message;
        throw mapHttpStatusToError({ status: statusCode, message });
      }
    }

    const graphQLErrors = error.graphQLErrors;

    if (graphQLErrors && graphQLErrors.length > 0) {
      const first = graphQLErrors[0];
      const message = first?.message ?? 'GraphQL request failed';
      throw new CommonError(200, ErrorTypes.INTERNAL_ERROR, message, graphQLErrors);
    }

    throw new InternalError(
      error.message ?? 'GraphQL request failed',
      error,
    );
  }

  throw new InternalError('GraphQL request failed', error);
}
