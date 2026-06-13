import Fastify from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  InternalError,
  TooManyRequestsError,
  UnauthorizedError,
  ValidationError,
} from '@vassembly/errors';
import { applyFrameworkErrorHandler } from '@vassembly/server';
import { registerRoutes } from '@vassembly/server';
import { validatorFactory } from '@vassembly/validation';

const TASK_RESPONSE = {
  id: '507f1f77bcf86cd799439011',
  userId: 'user-1',
  description: 'Review quarterly report',
  type: 'user' as const,
  status: 'created' as const,
  agentAssignedId: null,
  createdAt: '2026-05-26T12:00:00.000Z',
  updatedAt: '2026-05-26T12:00:00.000Z',
};

const VALID_BODY = {
  description: 'Review quarterly report',
};

const AUTH_HEADERS = {
  authorization: 'Bearer valid-token',
};

let rateLimitCallCount = 0;

const { mockAuthorize, mockCreateTask, mockAssertUserRateLimit } = vi.hoisted(() => ({
  mockAuthorize: vi.fn(),
  mockCreateTask: vi.fn(),
  mockAssertUserRateLimit: vi.fn(),
}));

vi.mock('@vassembly/service-auth', () => ({
  handlers: {
    authorizeRequest: mockAuthorize,
  },
}));

vi.mock('@vassembly/service-task', () => ({
  default: {
    createTask: mockCreateTask,
  },
}));

vi.mock('@vassembly/server', async () => {
  const actual = await vi.importActual<typeof import('@vassembly/server')>('@vassembly/server');

  return {
    ...actual,
    assertUserRateLimit: mockAssertUserRateLimit,
  };
});

import { taskCreateBodySchema, taskCreateRoute, taskResponseSchema } from './create';
import type { z } from 'zod';

const createTestServer = async () => {
  const fastify = Fastify();
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);
  applyFrameworkErrorHandler({ fastify });
  await registerRoutes({ fastify, routes: [taskCreateRoute] });
  return fastify;
};

describe('POST /tasks route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rateLimitCallCount = 0;

    mockAuthorize.mockResolvedValue({ userId: 'user-1' });
    mockCreateTask.mockResolvedValue({ task: TASK_RESPONSE });
    mockAssertUserRateLimit.mockImplementation(() => {
      rateLimitCallCount += 1;
      if (rateLimitCallCount > 5) {
        throw new TooManyRequestsError('Too many requests. Please try again later.', {
          retryAfterSeconds: 42,
        });
      }
    });
  });

  describe('happy path', () => {
    it('should return TaskResponse when body is valid and caller is authenticated', async () => {
      const result = await taskCreateRoute.handler({
        body: VALID_BODY,
        query: {},
        headers: AUTH_HEADERS,
      });

      expect(result).toEqual(TASK_RESPONSE);
    });

    it('should return response with all TaskResponse fields', async () => {
      const result = await taskCreateRoute.handler({
        body: VALID_BODY,
        query: {},
        headers: AUTH_HEADERS,
      });

      expect(result).toMatchObject({
        id: expect.any(String),
        userId: 'user-1',
        description: VALID_BODY.description,
        type: 'user',
        status: 'created',
        agentAssignedId: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should respond with 201 Created over HTTP when request is valid', async () => {
      const fastify = await createTestServer();
      const response = await fastify.inject({
        method: 'POST',
        url: '/',
        headers: AUTH_HEADERS,
        payload: VALID_BODY,
      });

      expect(response.statusCode).toBe(201);
      expect(response.json()).toEqual(TASK_RESPONSE);
      await fastify.close();
    });
  });

  describe('validation errors', () => {
    it('should reject empty request body via schema validation', () => {
      const validateTaskCreateBody = validatorFactory(taskCreateBodySchema);
      const parsed = validateTaskCreateBody({});

      expect(parsed.success).toBe(false);
    });

    it('should reject missing description field via schema validation', () => {
      const validateTaskCreateBody = validatorFactory(taskCreateBodySchema);
      const parsed = validateTaskCreateBody({ description: undefined });

      expect(parsed.success).toBe(false);
    });

    it('should reject description longer than 5000 characters via schema validation', () => {
      const validateTaskCreateBody = validatorFactory(taskCreateBodySchema);
      const parsed = validateTaskCreateBody({
        description: 'd'.repeat(5001),
      });

      expect(parsed.success).toBe(false);
    });

    it('should respond with 400 when request body is empty over HTTP', async () => {
      const fastify = await createTestServer();
      const response = await fastify.inject({
        method: 'POST',
        url: '/',
        headers: AUTH_HEADERS,
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({
        type: 'WRONG_PARAM',
        message: expect.stringContaining('schema'),
      });
      await fastify.close();
    });

    it('should respond with 400 when description exceeds 5000 characters over HTTP', async () => {
      const fastify = await createTestServer();
      const response = await fastify.inject({
        method: 'POST',
        url: '/',
        headers: AUTH_HEADERS,
        payload: {
          description: 'd'.repeat(5001),
        },
      });

      expect(response.statusCode).toBe(400);
      await fastify.close();
    });
  });

  describe('auth errors', () => {
    it('should throw UnauthorizedError when auth token is missing', async () => {
      mockAuthorize.mockRejectedValue(new UnauthorizedError('Unauthorized'));

      await expect(
        taskCreateRoute.handler({
          body: VALID_BODY,
          query: {},
          headers: {},
        }),
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError when auth token is invalid', async () => {
      mockAuthorize.mockRejectedValue(new UnauthorizedError('Unauthorized'));

      await expect(
        taskCreateRoute.handler({
          body: VALID_BODY,
          query: {},
          headers: { authorization: 'Bearer invalid-token' },
        }),
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError when userId is missing from auth context', async () => {
      mockAuthorize.mockResolvedValue({ role: 'user' });

      await expect(
        taskCreateRoute.handler({
          body: VALID_BODY,
          query: {},
          headers: AUTH_HEADERS,
        }),
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should respond with 401 Unauthorized over HTTP when auth fails', async () => {
      mockAuthorize.mockRejectedValue(new UnauthorizedError('Unauthorized'));
      const fastify = await createTestServer();
      const response = await fastify.inject({
        method: 'POST',
        url: '/',
        headers: {},
        payload: VALID_BODY,
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toMatchObject({
        type: 'UNAUTHORIZED',
        message: 'Unauthorized',
      });
      await fastify.close();
    });
  });

  describe('rate limiting', () => {
    it('should allow the first five requests within 60 seconds', async () => {
      for (let requestIndex = 0; requestIndex < 5; requestIndex += 1) {
        const result = await taskCreateRoute.handler({
          body: VALID_BODY,
          query: {},
          headers: AUTH_HEADERS,
        });

        expect(result).toEqual(TASK_RESPONSE);
      }
    });

    it('should throw TooManyRequestsError on the sixth request within 60 seconds', async () => {
      for (let requestIndex = 0; requestIndex < 5; requestIndex += 1) {
        await taskCreateRoute.handler({
          body: VALID_BODY,
          query: {},
          headers: AUTH_HEADERS,
        });
      }

      await expect(
        taskCreateRoute.handler({
          body: VALID_BODY,
          query: {},
          headers: AUTH_HEADERS,
        }),
      ).rejects.toThrow(TooManyRequestsError);
    });

    it('should respond with 429 and Retry-After header when rate limit is exceeded over HTTP', async () => {
      const fastify = await createTestServer();

      for (let requestIndex = 0; requestIndex < 5; requestIndex += 1) {
        const allowedResponse = await fastify.inject({
          method: 'POST',
          url: '/',
          headers: AUTH_HEADERS,
          payload: VALID_BODY,
        });
        expect(allowedResponse.statusCode).toBe(201);
      }

      const limitedResponse = await fastify.inject({
        method: 'POST',
        url: '/',
        headers: AUTH_HEADERS,
        payload: VALID_BODY,
      });

      expect(limitedResponse.statusCode).toBe(429);
      expect(limitedResponse.headers['retry-after']).toBeDefined();
      expect(limitedResponse.json()).toMatchObject({
        type: 'TOO_MANY_REQUESTS',
        message: expect.stringContaining('Too many requests'),
      });
      await fastify.close();
    });

    it('should allow a different user to create tasks when another user is rate limited', async () => {
      for (let requestIndex = 0; requestIndex < 5; requestIndex += 1) {
        await taskCreateRoute.handler({
          body: VALID_BODY,
          query: {},
          headers: AUTH_HEADERS,
        });
      }

      await expect(
        taskCreateRoute.handler({
          body: VALID_BODY,
          query: {},
          headers: AUTH_HEADERS,
        }),
      ).rejects.toThrow(TooManyRequestsError);

      rateLimitCallCount = 0;
      mockAuthorize.mockResolvedValue({ userId: 'user-2' });
      mockCreateTask.mockResolvedValue({
        task: {
          ...TASK_RESPONSE,
          userId: 'user-2',
          id: '507f1f77bcf86cd799439012',
        },
      });

      const result = (await taskCreateRoute.handler({
        body: VALID_BODY,
        query: {},
        headers: { authorization: 'Bearer other-user-token' },
      })) as z.infer<typeof taskResponseSchema>;

      expect(result.userId).toBe('user-2');
    });
  });

  describe('error handling', () => {
    it('should propagate domain ValidationError from service handler', async () => {
      mockCreateTask.mockRejectedValue(new ValidationError('Validation failed'));

      await expect(
        taskCreateRoute.handler({
          body: VALID_BODY,
          query: {},
          headers: AUTH_HEADERS,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('should respond with 422 Unprocessable Entity when domain validation fails over HTTP', async () => {
      mockCreateTask.mockRejectedValue(new ValidationError('Validation failed'));
      const fastify = await createTestServer();
      const response = await fastify.inject({
        method: 'POST',
        url: '/',
        headers: AUTH_HEADERS,
        payload: VALID_BODY,
      });

      expect(response.statusCode).toBe(422);
      expect(response.json()).toMatchObject({
        type: 'VALIDATION',
        message: 'Validation failed',
      });
      await fastify.close();
    });

    it('should respond with 500 Internal Server Error when an uncaught error occurs over HTTP', async () => {
      mockCreateTask.mockRejectedValue(new Error('Unexpected failure'));
      const fastify = await createTestServer();
      const response = await fastify.inject({
        method: 'POST',
        url: '/',
        headers: AUTH_HEADERS,
        payload: VALID_BODY,
      });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toMatchObject({
        type: 'INTERNAL_ERROR',
        message: 'Internal Server Error',
      });
      await fastify.close();
    });

    it('should propagate InternalError from service without masking details at handler level', async () => {
      mockCreateTask.mockRejectedValue(new InternalError('Service unavailable'));

      await expect(
        taskCreateRoute.handler({
          body: VALID_BODY,
          query: {},
          headers: AUTH_HEADERS,
        }),
      ).rejects.toThrow(InternalError);
    });
  });
});
