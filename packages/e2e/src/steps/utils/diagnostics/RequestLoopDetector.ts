import type { Page, Request } from '@playwright/test';
import type { RequestLog, RequestViolation } from './types';

interface GraphQLRequest {
  operationName?: string;
  [key: string]: unknown;
}

/**
 * Detects API request loops and repetitive requests during e2e tests.
 *
 * Tracks all network requests made by the page (both REST and GraphQL) and
 * counts occurrences by URL and GraphQL operation name. Used to identify
 * infinite request loops caused by state management issues or polling bugs.
 *
 * A request exceeds the threshold when its count surpasses the configured
 * limit (default: 20). Violations are reported as errors to fail the test.
 *
 * @example
 * const detector = new RequestLoopDetector();
 * detector.attachListener(page);
 * const violations = detector.getViolations(20); // Find URLs/operations with >20 requests
 */
export class RequestLoopDetector {
  requests: RequestLog[] = [];
  requestCountByUrl: Map<string, number> = new Map();
  requestCountByOperation: Map<string, number> = new Map();

  /**
   * Attaches a listener to the page's network request events.
   * Automatically tracks all requests and counts them by URL and GraphQL operation.
   */
  attachListener(page: Page): void {
    page.on('request', (request: Request) => {
      const url = request.url();
      const method = request.method();
      const postData = request.postData();

      this.requests.push({
        method,
        url,
        body: postData ?? undefined,
        timestamp: Date.now(),
      });

      this.trackRequestCount(url);
      this.parseGraphQLOperation(postData ?? undefined);
    });
  }

  private trackRequestCount(url: string): void {
    const currentCount = this.requestCountByUrl.get(url) ?? 0;
    this.requestCountByUrl.set(url, currentCount + 1);
  }

  private parseGraphQLOperation(postData: string | undefined): void {
    if (!postData) {
      return;
    }

    try {
      const parsed = JSON.parse(postData) as GraphQLRequest;
      if (parsed.operationName && typeof parsed.operationName === 'string') {
        const currentCount = this.requestCountByOperation.get(parsed.operationName) ?? 0;
        this.requestCountByOperation.set(parsed.operationName, currentCount + 1);
      }
    } catch {
      // Silently ignore JSON parsing errors (not a GraphQL request or malformed)
    }
  }

  /**
   * Identifies request violations that exceed the threshold.
   * @param threshold - Maximum allowed request count (default: 20)
   * @returns Array of violations sorted by count (highest first), each containing URL/operation name and count
   */
  getViolations(threshold: number): RequestViolation[] {
    const violations: RequestViolation[] = [];

    this.requestCountByUrl.forEach((count, url) => {
      if (count > threshold) {
        violations.push({ url, count, type: 'url' });
      }
    });

    this.requestCountByOperation.forEach((count, operation) => {
      if (count > threshold) {
        violations.push({ url: operation, count, type: 'operation' });
      }
    });

    violations.sort((a, b) => b.count - a.count);

    return violations;
  }
}
