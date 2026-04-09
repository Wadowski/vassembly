import { CommonError } from "@vassembly/errors";
import { GraphQLError, type GraphQLFormattedError } from "graphql";

const getCommonError = (error: unknown): CommonError | undefined => {
  if (!(error instanceof GraphQLError)) {
    return undefined;
  }

  const { originalError } = error;

  if (originalError instanceof CommonError) {
    return originalError;
  }

  return undefined;
};

export const formatGraphQlError = (
  formattedError: GraphQLFormattedError,
  error: unknown,
): GraphQLFormattedError => {
  const commonError = getCommonError(error);

  if (commonError === undefined) {
    return formattedError;
  }

  return {
    ...formattedError,
    message: commonError.message,
    extensions: {
      ...formattedError.extensions,
      code: commonError.type,
      statusCode: commonError.statusCode,
    },
  };
};
