import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Page, Request } from '@playwright/test';
import { RequestLoopDetector } from '../RequestLoopDetector';

describe('RequestLoopDetector', () => {
  let detector: RequestLoopDetector;
  let mockPage: Partial<Page>;
  let requestListeners: Map<string, (request: Request) => void>;

  beforeEach(() => {
    detector = new RequestLoopDetector();
    requestListeners = new Map();

    mockPage = {
      on: vi.fn((event: string, listener: (request: Request) => void) => {
        if (event === 'request') {
          requestListeners.set('request', listener);
        }
        return mockPage as Page;
      }) as unknown as Page['on'],
    };
  });

  describe('attachListener', () => {
    it('should attach listener to page request events', () => {
      detector.attachListener(mockPage as Page);

      expect(mockPage.on).toHaveBeenCalledWith('request', expect.any(Function));
      expect(requestListeners.has('request')).toBe(true);
    });

    it('should initialize empty requests array', () => {
      detector.attachListener(mockPage as Page);

      expect(detector.requests).toEqual([]);
      expect(Array.isArray(detector.requests)).toBe(true);
    });

    it('should initialize empty request count maps', () => {
      detector.attachListener(mockPage as Page);

      expect(detector.requestCountByUrl.size).toBe(0);
      expect(detector.requestCountByOperation.size).toBe(0);
    });
  });

  describe('request collection', () => {
    it('should collect GET requests', () => {
      detector.attachListener(mockPage as Page);
      const listener = requestListeners.get('request')!;

      const mockRequest = {
        method: () => 'GET',
        url: () => 'http://localhost:3000/api/users',
        postData: () => undefined,
      } as unknown as Request;

      listener(mockRequest);

      expect(detector.requests).toHaveLength(1);
      expect(detector.requests[0]).toEqual({
        method: 'GET',
        url: 'http://localhost:3000/api/users',
        timestamp: expect.any(Number),
      });
    });

    it('should collect POST requests', () => {
      detector.attachListener(mockPage as Page);
      const listener = requestListeners.get('request')!;

      const mockRequest = {
        method: () => 'POST',
        url: () => 'http://localhost:3000/api/users',
        postData: () => '{"name":"John"}',
      } as unknown as Request;

      listener(mockRequest);

      expect(detector.requests[0]!.method).toBe('POST');
      expect(detector.requests[0]!.body).toBe('{"name":"John"}');
    });

    it('should collect multiple requests in order', () => {
      detector.attachListener(mockPage as Page);
      const listener = requestListeners.get('request')!;

      const request1 = {
        method: () => 'GET',
        url: () => 'http://localhost/api/users',
        postData: () => undefined,
      } as unknown as Request;

      const request2 = {
        method: () => 'POST',
        url: () => 'http://localhost/api/tasks',
        postData: () => '{"title":"Task"}',
      } as unknown as Request;

      listener(request1);
      listener(request2);

      expect(detector.requests).toHaveLength(2);
      expect(detector.requests[0]!.url).toBe('http://localhost/api/users');
      expect(detector.requests[1]!.url).toBe('http://localhost/api/tasks');
    });
  });

  describe('URL counting', () => {
    beforeEach(() => {
      detector.attachListener(mockPage as Page);
      const listener = requestListeners.get('request')!;

      const sameUrlRequests = Array(5)
        .fill(null)
        .map(() => ({
          method: () => 'GET',
          url: () => 'http://localhost/api/users',
          postData: () => undefined,
        } as unknown as Request));

      sameUrlRequests.forEach((req) => listener(req));
    });

    it('should count identical requests by URL', () => {
      expect(detector.requestCountByUrl.get('http://localhost/api/users')).toBe(5);
    });

    it('should track multiple unique URLs', () => {
      const listener = requestListeners.get('request')!;

      listener({
        method: () => 'GET',
        url: () => 'http://localhost/api/tasks',
        postData: () => undefined,
      } as unknown as Request);

      expect(detector.requestCountByUrl.size).toBe(2);
      expect(detector.requestCountByUrl.get('http://localhost/api/tasks')).toBe(1);
    });

    it('should increment count for duplicate URLs', () => {
      const listener = requestListeners.get('request')!;

      listener({
        method: () => 'GET',
        url: () => 'http://localhost/api/users',
        postData: () => undefined,
      } as unknown as Request);

      expect(detector.requestCountByUrl.get('http://localhost/api/users')).toBe(6);
    });
  });

  describe('GraphQL operation parsing', () => {
    beforeEach(() => {
      detector.attachListener(mockPage as Page);
    });

    it('should parse operationName from GraphQL POST body', () => {
      const listener = requestListeners.get('request')!;

      const graphqlBody = JSON.stringify({
        operationName: 'GetUsers',
        query: 'query GetUsers { users { id name } }',
        variables: {},
      });

      listener({
        method: () => 'POST',
        url: () => 'http://localhost/graphql',
        postData: () => graphqlBody,
      } as unknown as Request);

      expect(detector.requestCountByOperation.get('GetUsers')).toBe(1);
    });

    it('should count multiple identical GraphQL operations', () => {
      const listener = requestListeners.get('request')!;

      const graphqlBody = JSON.stringify({
        operationName: 'GetUsers',
        query: 'query GetUsers { users { id name } }',
        variables: {},
      });

      Array(3)
        .fill(null)
        .forEach(() => {
          listener({
            method: () => 'POST',
            url: () => 'http://localhost/graphql',
            postData: () => graphqlBody,
          } as unknown as Request);
        });

      expect(detector.requestCountByOperation.get('GetUsers')).toBe(3);
    });

    it('should track different GraphQL operations separately', () => {
      const listener = requestListeners.get('request')!;

      const getUsersBody = JSON.stringify({
        operationName: 'GetUsers',
        query: 'query GetUsers { users { id } }',
        variables: {},
      });

      const getTasksBody = JSON.stringify({
        operationName: 'GetTasks',
        query: 'query GetTasks { tasks { id } }',
        variables: {},
      });

      listener({
        method: () => 'POST',
        url: () => 'http://localhost/graphql',
        postData: () => getUsersBody,
      } as unknown as Request);

      listener({
        method: () => 'POST',
        url: () => 'http://localhost/graphql',
        postData: () => getTasksBody,
      } as unknown as Request);

      expect(detector.requestCountByOperation.get('GetUsers')).toBe(1);
      expect(detector.requestCountByOperation.get('GetTasks')).toBe(1);
    });

    it('should not count non-GraphQL POST requests as operations', () => {
      const listener = requestListeners.get('request')!;

      const restBody = JSON.stringify({
        name: 'John',
        email: 'john@example.com',
      });

      listener({
        method: () => 'POST',
        url: () => 'http://localhost/api/users',
        postData: () => restBody,
      } as unknown as Request);

      expect(detector.requestCountByOperation.size).toBe(0);
    });

    it('should handle malformed JSON gracefully', () => {
      const listener = requestListeners.get('request')!;

      listener({
        method: () => 'POST',
        url: () => 'http://localhost/graphql',
        postData: () => 'invalid json {',
      } as unknown as Request);

      // Should not throw and operation count should remain 0
      expect(detector.requestCountByOperation.size).toBe(0);
      expect(detector.requests).toHaveLength(1);
    });

    it('should skip operations with missing operationName field', () => {
      const listener = requestListeners.get('request')!;

      const bodyWithoutOperation = JSON.stringify({
        query: 'query { users { id } }',
        variables: {},
      });

      listener({
        method: () => 'POST',
        url: () => 'http://localhost/graphql',
        postData: () => bodyWithoutOperation,
      } as unknown as Request);

      expect(detector.requestCountByOperation.size).toBe(0);
    });
  });

  describe('getViolations', () => {
    beforeEach(() => {
      detector.attachListener(mockPage as Page);
      const listener = requestListeners.get('request')!;

      // Add 25 requests to /api/users
      Array(25)
        .fill(null)
        .forEach(() => {
          listener({
            method: () => 'GET',
            url: () => 'http://localhost/api/users',
            postData: () => undefined,
          } as unknown as Request);
        });

      // Add 15 requests to /api/tasks
      Array(15)
        .fill(null)
        .forEach(() => {
          listener({
            method: () => 'GET',
            url: () => 'http://localhost/api/tasks',
            postData: () => undefined,
          } as unknown as Request);
        });

      // Add 30 requests to GraphQL operation
      const graphqlBody = JSON.stringify({
        operationName: 'GetData',
        query: 'query GetData { data { id } }',
        variables: {},
      });

      Array(30)
        .fill(null)
        .forEach(() => {
          listener({
            method: () => 'POST',
            url: () => 'http://localhost/graphql',
            postData: () => graphqlBody,
          } as unknown as Request);
        });
    });

    it('should return violations exceeding threshold', () => {
      const violations = detector.getViolations(20);

      // Should return violations for /api/users (25), /api/tasks is at 15 (no violation),
      // and GetData operation (30)
      expect(violations.length).toBeGreaterThanOrEqual(2);
      expect(violations.map((v) => v.url)).toContain('http://localhost/api/users');
    });

    it('should include URL and count in violations', () => {
      const violations = detector.getViolations(20);

      expect(violations[0]).toEqual({
        url: expect.stringContaining('http://localhost'),
        count: expect.any(Number),
        type: 'url',
      });
    });

    it('should return empty array when no violations', () => {
      const violations = detector.getViolations(100);

      expect(violations).toEqual([]);
    });

    it('should not include requests at exact threshold', () => {
      const violations = detector.getViolations(25);

      expect(violations.filter((v) => v.url === 'http://localhost/api/users')).toHaveLength(0);
    });

    it('should include requests exceeding threshold', () => {
      const violations = detector.getViolations(24);

      expect(violations.filter((v) => v.url === 'http://localhost/api/users')).toHaveLength(1);
    });

    it('should return violations sorted by count descending', () => {
      const violations = detector.getViolations(10);

      // Verify violations are sorted by count (highest first)
      for (let i = 0; i < violations.length - 1; i++) {
        expect(violations[i]!.count).toBeGreaterThanOrEqual(violations[i + 1]!.count);
      }
    });

    it('should handle threshold of 0', () => {
      const violations = detector.getViolations(0);

      expect(violations.length).toBeGreaterThan(0);
    });
  });

  describe('timestamps', () => {
    it('should record timestamp when request is collected', () => {
      detector.attachListener(mockPage as Page);
      const listener = requestListeners.get('request')!;
      const beforeTime = Date.now();

      listener({
        method: () => 'GET',
        url: () => 'http://localhost/api/users',
        postData: () => undefined,
      } as unknown as Request);

      const afterTime = Date.now();

      expect(detector.requests[0]!.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(detector.requests[0]!.timestamp).toBeLessThanOrEqual(afterTime);
    });
  });
});
