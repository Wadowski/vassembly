import type { BddWorld } from '../../../fixtures/types';
import type { E2eEnvironment } from '../../../config/types';

/**
 * Reports and asserts on diagnostic errors detected during e2e test execution.
 *
 * Analyzes collected console messages and request patterns to identify
 * infinite update loops (console errors) and request loops (repetitive API calls).
 * Fails the test if violations are found, unless diagnostics are disabled or
 * the test uses the @skip-diagnostic-checks tag.
 *
 * Configured by environment variables:
 * - E2E_CONSOLE_ERROR_PATTERNS: pipe-separated error patterns to match
 * - E2E_REQUEST_LOOP_THRESHOLD: request count threshold (default: 20)
 * - E2E_ENABLE_DIAGNOSTICS: enable/disable all checks (default: true)
 *
 * @example
 * DiagnosticsReporter.assertNoDiagnosticErrors(world, environment);
 */
export class DiagnosticsReporter {
  /**
   * Asserts that no diagnostic errors (console errors or request loops) were detected.
   * Throws an Error with a detailed message if violations are found.
   *
   * Respects the @skip-diagnostic-checks tag and E2E_ENABLE_DIAGNOSTICS setting.
   * If no violations are found, assertion passes silently.
   *
   * @param world - BDD test world containing collected diagnostics
   * @param environment - E2E environment config with detection patterns and thresholds
   * @throws Error with details of all violations if any are found
   */
  static assertNoDiagnosticErrors(world: BddWorld, environment: E2eEnvironment): void {
    if (!environment.enableDiagnostics || world.skipDiagnosticAssertions) {
      return;
    }

    if (!world.diagnostics) {
      return;
    }

    const consoleErrors = this.findConsoleViolations(world, environment);
    const requestLoops = this.findRequestViolations(world, environment);

    if (consoleErrors.length === 0 && requestLoops.length === 0) {
      return;
    }

    const errorMessage = this.formatErrorMessage(consoleErrors, requestLoops, environment);
    throw new Error(errorMessage);
  }

  private static findConsoleViolations(world: BddWorld, environment: E2eEnvironment): string[] {
    const violations: string[] = [];
    const messages = world.diagnostics?.consoleMessages ?? [];

    messages.forEach((msg) => {
      environment.consoleErrorPatterns.forEach((pattern) => {
        if (msg.text.toLowerCase().includes(pattern.toLowerCase())) {
          violations.push(`${pattern} (at ${msg.location || 'unknown location'})`);
        }
      });
    });

    return [...new Set(violations)];
  }

  private static findRequestViolations(world: BddWorld, environment: E2eEnvironment): Array<{
    url: string;
    count: number;
  }> {
    const violations: Array<{ url: string; count: number }> = [];
    const threshold = environment.requestLoopThreshold;

    world.diagnostics?.requestCountByUrl.forEach((count, url) => {
      if (count > threshold) {
        violations.push({ url, count });
      }
    });

    world.diagnostics?.requestCountByOperation.forEach((count, operation) => {
      if (count > threshold) {
        violations.push({ url: operation, count });
      }
    });

    violations.sort((a, b) => b.count - a.count);

    return violations;
  }

  private static formatErrorMessage(
    consoleErrors: string[],
    requestLoops: Array<{ url: string; count: number }>,
    environment: E2eEnvironment
  ): string {
    const sections: string[] = ['E2E Diagnostic Errors Detected:'];

    if (consoleErrors.length > 0) {
      sections.push('\nConsole Error Patterns Matched:');
      consoleErrors.forEach((error) => {
        sections.push(`  - ${error}`);
      });
    }

    if (requestLoops.length > 0) {
      sections.push(
        `\nRequest Loop Violations (threshold: ${environment.requestLoopThreshold}):`,
        requestLoops.map((loop) => `  - ${loop.url}: ${loop.count} requests`).join('\n')
      );
    }

    sections.push(
      '\nRun test with @skip-diagnostic-checks tag to bypass these checks for intentional error testing.'
    );

    return sections.join('\n');
  }
}
