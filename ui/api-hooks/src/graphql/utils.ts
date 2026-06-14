import { parse } from 'graphql';
import type { ApolloError } from '@apollo/client';
import type { DocumentNode } from 'graphql';
import { mapApolloError } from './mapApolloError';
import type { CommonError } from '@vassembly/errors';

export const parseGraphQLDocument = (document: string | DocumentNode): DocumentNode => {
  if (typeof document === 'string') {
    return parse(document);
  }
  return document;
};

export const mapGraphQLError = (error: ApolloError | undefined): CommonError | undefined => {
  if (!error) {
    return undefined;
  }

  try {
    return mapApolloError(error);
  } catch (err) {
    return err as CommonError;
  }
};

