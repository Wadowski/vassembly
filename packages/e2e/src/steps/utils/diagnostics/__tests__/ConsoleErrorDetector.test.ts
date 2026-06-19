import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Page, ConsoleMessage as PlaywrightConsoleMessage } from '@playwright/test';
import { ConsoleErrorDetector } from '../ConsoleErrorDetector';

describe('ConsoleErrorDetector', () => {
  let detector: ConsoleErrorDetector;
  let mockPage: Partial<Page>;
  let consoleListeners: Map<string, (msg: PlaywrightConsoleMessage) => void>;

  beforeEach(() => {
    detector = new ConsoleErrorDetector();
    consoleListeners = new Map();

    mockPage = {
      on: vi.fn((event: string, listener: (msg: PlaywrightConsoleMessage) => void) => {
        if (event === 'console') {
          consoleListeners.set('console', listener);
        }
        return mockPage as Page;
      }) as unknown as Page['on'],
    };
  });

  describe('attachListener', () => {
    it('should attach listener to page console events', () => {
      detector.attachListener(mockPage as Page);

      expect(mockPage.on).toHaveBeenCalledWith('console', expect.any(Function));
      expect(consoleListeners.has('console')).toBe(true);
    });

    it('should initialize empty messages array', () => {
      detector.attachListener(mockPage as Page);

      expect(detector.messages).toEqual([]);
      expect(Array.isArray(detector.messages)).toBe(true);
    });
  });

  describe('message collection', () => {
    it('should collect log messages', () => {
      detector.attachListener(mockPage as Page);
      const listener = consoleListeners.get('console')!;

      const mockConsoleMsg = {
        type: () => 'log',
        text: () => 'Test log message',
        location: () => ({ url: 'http://localhost:3000/page' }),
        args: () => [],
      } as unknown as PlaywrightConsoleMessage;

      listener(mockConsoleMsg);

      expect(detector.messages).toHaveLength(1);
      expect(detector.messages[0]).toEqual({
        type: 'log',
        text: 'Test log message',
        timestamp: expect.any(Number),
        location: 'http://localhost:3000/page',
      });
    });

    it('should collect warn messages', () => {
      detector.attachListener(mockPage as Page);
      const listener = consoleListeners.get('console')!;

      const mockConsoleMsg = {
        type: () => 'warn',
        text: () => 'Test warning',
        location: () => ({ url: 'http://localhost:3000' }),
        args: () => [],
      } as unknown as PlaywrightConsoleMessage;

      listener(mockConsoleMsg);

      expect(detector.messages[0]!.type).toBe('warn');
      expect(detector.messages[0]!.text).toBe('Test warning');
    });

    it('should collect error messages', () => {
      detector.attachListener(mockPage as Page);
      const listener = consoleListeners.get('console')!;

      const mockConsoleMsg = {
        type: () => 'error',
        text: () => 'Maximum update depth exceeded',
        location: () => ({ url: 'http://localhost:3000' }),
        args: () => [],
      } as unknown as PlaywrightConsoleMessage;

      listener(mockConsoleMsg);

      expect(detector.messages[0]!.type).toBe('error');
      expect(detector.messages[0]!.text).toBe('Maximum update depth exceeded');
    });

    it('should collect debug messages', () => {
      detector.attachListener(mockPage as Page);
      const listener = consoleListeners.get('console')!;

      const mockConsoleMsg = {
        type: () => 'debug',
        text: () => 'Debug info',
        location: () => ({ url: 'http://localhost:3000' }),
        args: () => [],
      } as unknown as PlaywrightConsoleMessage;

      listener(mockConsoleMsg);

      expect(detector.messages[0]!.type).toBe('debug');
    });

    it('should handle messages without location', () => {
      detector.attachListener(mockPage as Page);
      const listener = consoleListeners.get('console')!;

      const mockConsoleMsg = {
        type: () => 'log',
        text: () => 'No location message',
        location: () => undefined,
        args: () => [],
      } as unknown as PlaywrightConsoleMessage;

      listener(mockConsoleMsg);

      expect(detector.messages).toHaveLength(1);
      expect(detector.messages[0]!.location).toBeUndefined();
    });

    it('should collect multiple messages in order', () => {
      detector.attachListener(mockPage as Page);
      const listener = consoleListeners.get('console')!;

      const msg1 = {
        type: () => 'log',
        text: () => 'First message',
        location: () => ({ url: 'http://localhost' }),
        args: () => [],
      } as unknown as PlaywrightConsoleMessage;

      const msg2 = {
        type: () => 'error',
        text: () => 'Error message',
        location: () => ({ url: 'http://localhost' }),
        args: () => [],
      } as unknown as PlaywrightConsoleMessage;

      listener(msg1);
      listener(msg2);

      expect(detector.messages).toHaveLength(2);
      expect(detector.messages[0]!.text).toBe('First message');
      expect(detector.messages[1]!.text).toBe('Error message');
    });
  });

  describe('getErrorsMatching', () => {
    beforeEach(() => {
      detector.attachListener(mockPage as Page);
      const listener = consoleListeners.get('console')!;

      const messages = [
        {
          type: () => 'error' as const,
          text: () => 'Maximum update depth exceeded in component',
          location: () => ({ url: 'http://localhost' }),
          args: () => [],
        },
        {
          type: () => 'warn' as const,
          text: () => 'Warning message',
          location: () => ({ url: 'http://localhost' }),
          args: () => [],
        },
        {
          type: () => 'error' as const,
          text: () => 'Too many re-renders',
          location: () => ({ url: 'http://localhost' }),
          args: () => [],
        },
        {
          type: () => 'log' as const,
          text: () => 'Application started',
          location: () => ({ url: 'http://localhost' }),
          args: () => [],
        },
      ];

      messages.forEach((msg) => {
        listener(msg as unknown as PlaywrightConsoleMessage);
      });
    });

    it('should return messages matching exact pattern', () => {
      const pattern = ['Maximum update depth exceeded'];
      const matches = detector.getErrorsMatching(pattern);

      expect(matches).toHaveLength(1);
      expect(matches[0]!.text).toBe('Maximum update depth exceeded in component');
    });

    it('should return messages matching partial pattern', () => {
      const pattern = ['update depth'];
      const matches = detector.getErrorsMatching(pattern);

      expect(matches).toHaveLength(1);
      expect(matches[0]!.text).toContain('update depth');
    });

    it('should match multiple patterns', () => {
      const patterns = ['Maximum update depth exceeded', 'Too many re-renders'];
      const matches = detector.getErrorsMatching(patterns);

      expect(matches).toHaveLength(2);
      expect(matches.map((m) => m.text)).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Maximum update depth'),
          expect.stringContaining('Too many re-renders'),
        ])
      );
    });

    it('should be case-insensitive for pattern matching', () => {
      const pattern = ['maximum update'];
      const matches = detector.getErrorsMatching(pattern);

      expect(matches).toHaveLength(1);
      expect(matches[0]!.text).toContain('Maximum update');
    });

    it('should return empty array when no matches found', () => {
      const pattern = ['Non-existent error pattern'];
      const matches = detector.getErrorsMatching(pattern);

      expect(matches).toEqual([]);
    });

    it('should return empty array for empty pattern list', () => {
      const matches = detector.getErrorsMatching([]);

      expect(matches).toEqual([]);
    });

    it('should match across multiple collected messages', () => {
      const pattern = ['Maximum update', 'Too many re-renders'];
      const matches = detector.getErrorsMatching(pattern);

      // Should match: "Maximum update depth exceeded in component" and "Too many re-renders"
      expect(matches.length).toBeGreaterThanOrEqual(2);
    });

    it('should preserve message metadata when filtering', () => {
      const pattern = ['Maximum update'];
      const matches = detector.getErrorsMatching(pattern);

      expect(matches[0]).toEqual({
        type: 'error',
        text: 'Maximum update depth exceeded in component',
        timestamp: expect.any(Number),
        location: 'http://localhost',
      });
    });

    it('should filter out messages that do not match any pattern', () => {
      const pattern = ['Maximum update depth exceeded'];
      const matches = detector.getErrorsMatching(pattern);

      // Should NOT include warning or log messages
      expect(matches.every((msg) => msg.type === 'error' || msg.type === 'log')).toBe(true);
      expect(matches.every((msg) => msg.text.includes('Maximum update'))).toBe(true);
    });
  });

  describe('timestamps', () => {
    it('should record timestamp when message is collected', () => {
      detector.attachListener(mockPage as Page);
      const listener = consoleListeners.get('console')!;
      const beforeTime = Date.now();

      const mockConsoleMsg = {
        type: () => 'log',
        text: () => 'Timestamped message',
        location: () => ({ url: 'http://localhost' }),
        args: () => [],
      } as unknown as PlaywrightConsoleMessage;

      listener(mockConsoleMsg);
      const afterTime = Date.now();

      expect(detector.messages[0]!.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(detector.messages[0]!.timestamp).toBeLessThanOrEqual(afterTime);
    });
  });
});
