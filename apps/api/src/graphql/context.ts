import type { FastifyReply, FastifyRequest } from 'fastify';
import { CUSTOM_HEADERS } from '@vassembly/constants';
import * as authTokenDomain from '@vassembly/domain-auth-token';

const extractAuthToken = (request: FastifyRequest): string | undefined => {
  const fromHeader = request.headers[CUSTOM_HEADERS.AuthToken];
  if (typeof fromHeader === 'string' && fromHeader.trim() !== '') {
    return fromHeader.trim();
  }
  const authorization = request.headers.authorization;
  if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
    return authorization.slice('Bearer '.length).trim();
  }
  return undefined;
};

export const createApiGraphQLContext = async (
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<{ authenticatedUserId: string | undefined }> => {
  const token = extractAuthToken(request);
  if (!token) {
    return { authenticatedUserId: undefined };
  }
  try {
    const verified = await authTokenDomain.queries.verify({ token });
    if (!verified.userId) {
      return { authenticatedUserId: undefined };
    }
    return { authenticatedUserId: verified.userId };
  } catch {
    return { authenticatedUserId: undefined };
  }
};
