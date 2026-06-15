import type { Page, ConsoleMessage as PlaywrightConsoleMessage } from '@playwright/test';
import type { ConsoleMessage } from './types';

/**
 * Detects React and JavaScript console errors during e2e tests.
 *
 * Captures all browser console messages and provides methods to filter for
 * patterns matching common errors like "Maximum update depth exceeded" or
 * "Too many re-renders". Used to fail tests that generate console errors
 * caused by infinite update loops or similar issues.
 *
 * @example
 * const detector = new ConsoleErrorDetector();
 * detector.attachListener(page);
 * const errors = detector.getErrorsMatching(['Maximum update depth exceeded']);
 */
export class ConsoleErrorDetector {
  messages: ConsoleMessage[] = [];

  /**
   * Attaches a listener to the page's console events.
   * Automatically records all console messages (log, warn, error, debug).
   */
  attachListener(page: Page): void {
    page.on('console', (message: PlaywrightConsoleMessage) => {
      this.messages.push({
        type: message.type() as 'log' | 'warn' | 'error' | 'debug',
        text: message.text(),
        timestamp: Date.now(),
        location: message.location()?.url,
      });
    });
  }

  /**
   * Filters recorded console messages by pattern matching.
   * @param patterns - Array of strings to match (case-insensitive) in console text
   * @returns Array of console messages matching any of the provided patterns
   */
  getErrorsMatching(patterns: string[]): ConsoleMessage[] {
    if (patterns.length === 0) {
      return [];
    }

    return this.messages.filter((message) => {
      return patterns.some((pattern) =>
        message.text.toLowerCase().includes(pattern.toLowerCase())
      );
    });
  }
}
