import { WrongParamError } from '@vassembly/errors';
import { parse } from 'graphql';

export const parseGraphQLDocument = (source: string) => {
  try {
    return parse(source);
  } catch {
    throw new WrongParamError('Invalid GraphQL document');
  }
};
