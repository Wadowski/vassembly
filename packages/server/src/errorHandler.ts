import { CommonError, InternalError, TooManyRequestsError, WrongParamError } from "@vassembly/errors";
import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
} from "fastify-type-provider-zod";

import type { ApplyFrameworkErrorHandlerProps } from "./types";

const sendCommonErrorShape = (reply: FastifyReply, error: CommonError) => {
  if (error instanceof TooManyRequestsError && error.retryAfterSeconds !== undefined) {
    reply.header('Retry-After', String(error.retryAfterSeconds));
  }

  return reply.status(error.statusCode).send({
    type: error.type,
    message: error.message,
    error: error.error,
  });
};

const isFastifyRequestValidationError = (err: unknown): err is FastifyError =>
  typeof err === "object" &&
  err !== null &&
  "code" in err &&
  (err as FastifyError).code === "FST_ERR_VALIDATION";

export const applyFrameworkErrorHandler = ({ fastify }: ApplyFrameworkErrorHandlerProps): void => {
  fastify.setErrorHandler((err: unknown, _request: FastifyRequest, reply: FastifyReply) => {
    if (hasZodFastifySchemaValidationErrors(err)) {
      const error = new WrongParamError("Request doesn't match the schema", { issues: err.validation || [] });
      return sendCommonErrorShape(reply, error);
    }
    if (isFastifyRequestValidationError(err)) {
      const error = new WrongParamError("Request doesn't match the schema", {
        validation: err.validation ?? [],
      });
      return sendCommonErrorShape(reply, error);
    }
    if (isResponseSerializationError(err)) {
      return sendCommonErrorShape(reply, new InternalError("Internal Server Error", { error: err }));
    }
    const error = err instanceof CommonError ? err : new InternalError("Internal Server Error", { error: err });
    return sendCommonErrorShape(reply, error);
  });
};
