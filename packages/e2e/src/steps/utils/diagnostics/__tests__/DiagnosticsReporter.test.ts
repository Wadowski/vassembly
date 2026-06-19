import { describe, it, expect, beforeEach } from 'vitest';
import type { BddWorld } from '../../../../fixtures/types';
import type { E2eEnvironment } from '../../../../config/types';
import { DiagnosticsReporter } from '../DiagnosticsReporter';

describe('DiagnosticsReporter', () => {
  let world: BddWorld;
  let environment: E2eEnvironment;

  beforeEach(() => {
    environment = {
      webBaseUrl: 'http://localhost:3000',
      apiBaseUrl: 'http://localhost:3001',
      mongoUrl: 'mongodb://localhost',
      mongoDatabase: 'test',
      jwtSecret: 'secret',
      consoleErrorPatterns: ['Maximum update depth exceeded', 'Too many re-renders'],
      requestLoopThreshold: 20,
      enableDiagnostics: true,
    };

    world = {
      page: undefined,
      request: undefined,
      baseURL: 'http://localhost:3000',
      diagnostics: {
        consoleMessages: [],
        requests: [],
        requestCountByUrl: new Map(),
        requestCountByOperation: new Map(),
      },
    };
  });

  describe('assertNoDiagnosticErrors', () => {
    it('should not throw when diagnostics are clean', () => {
      expect(() => {
        DiagnosticsReporter.assertNoDiagnosticErrors(world, environment);
      }).not.toThrow();
    });

    it('should skip assertion when skipDiagnosticAssertions is true', () => {
      world.skipDiagnosticAssertions = true;
      world.diagnostics!.consoleMessages = [
        {
          type: 'error',
          text: 'Maximum update depth exceeded',
          timestamp: Date.now(),
          location: 'http://localhost',
        },
      ];

      expect(() => {
        DiagnosticsReporter.assertNoDiagnosticErrors(world, environment);
      }).not.toThrow();
    });

    it('should skip assertion when enableDiagnostics is false', () => {
      environment.enableDiagnostics = false;
      world.diagnostics!.consoleMessages = [
        {
          type: 'error',
          text: 'Maximum update depth exceeded',
          timestamp: Date.now(),
          location: 'http://localhost',
        },
      ];

      expect(() => {
        DiagnosticsReporter.assertNoDiagnosticErrors(world, environment);
      }).not.toThrow();
    });

    it('should throw when console error pattern is detected', () => {
      world.diagnostics!.consoleMessages = [
        {
          type: 'error',
          text: 'Maximum update depth exceeded in component',
          timestamp: Date.now(),
          location: 'http://localhost:3000/page',
        },
      ];

      expect(() => {
        DiagnosticsReporter.assertNoDiagnosticErrors(world, environment);
      }).toThrow();
    });

    it('should throw with message containing matched error pattern', () => {
      world.diagnostics!.consoleMessages = [
        {
          type: 'error',
          text: 'Maximum update depth exceeded in component',
          timestamp: Date.now(),
          location: 'http://localhost:3000/page',
        },
      ];

      expect(() => {
        DiagnosticsReporter.assertNoDiagnosticErrors(world, environment);
      }).toThrow(/Maximum update depth exceeded/);
    });

    it('should throw with location information', () => {
      world.diagnostics!.consoleMessages = [
        {
          type: 'error',
          text: 'Too many re-renders',
          timestamp: Date.now(),
          location: 'http://localhost:3000/agents/form',
        },
      ];

      expect(() => {
        DiagnosticsReporter.assertNoDiagnosticErrors(world, environment);
      }).toThrow(/http:\/\/localhost:3000\/agents\/form/);
    });

    it('should throw when request loop violation detected', () => {
      world.diagnostics!.requestCountByUrl.set('http://localhost/api/users', 25);

      expect(() => {
        DiagnosticsReporter.assertNoDiagnosticErrors(world, environment);
      }).toThrow();
    });

    it('should throw with URL and count for request violations', () => {
      world.diagnostics!.requestCountByUrl.set('http://localhost/api/users', 25);

      expect(() => {
        DiagnosticsReporter.assertNoDiagnosticErrors(world, environment);
      }).toThrow(/http:\/\/localhost\/api\/users/);
    });

    it('should throw with count information for request violations', () => {
      world.diagnostics!.requestCountByUrl.set('http://localhost/api/users', 25);

      expect(() => {
        DiagnosticsReporter.assertNoDiagnosticErrors(world, environment);
      }).toThrow(/25/);
    });

    it('should not throw for requests at exact threshold', () => {
      world.diagnostics!.requestCountByUrl.set('http://localhost/api/users', 20);

      expect(() => {
        DiagnosticsReporter.assertNoDiagnosticErrors(world, environment);
      }).not.toThrow();
    });

    it('should report multiple console errors', () => {
      world.diagnostics!.consoleMessages = [
        {
          type: 'error',
          text: 'Maximum update depth exceeded',
          timestamp: Date.now(),
          location: 'http://localhost:3000/page1',
        },
        {
          type: 'error',
          text: 'Too many re-renders',
          timestamp: Date.now(),
          location: 'http://localhost:3000/page2',
        },
      ];

      expect(() => {
        DiagnosticsReporter.assertNoDiagnosticErrors(world, environment);
      }).toThrow();
    });

    it('should report multiple request loop violations', () => {
      world.diagnostics!.requestCountByUrl.set('http://localhost/api/users', 25);
      world.diagnostics!.requestCountByUrl.set('http://localhost/api/tasks', 30);

      expect(() => {
        DiagnosticsReporter.assertNoDiagnosticErrors(world, environment);
      }).toThrow();
    });

    it('should report combined console and request violations', () => {
      world.diagnostics!.consoleMessages = [
        {
          type: 'error',
          text: 'Maximum update depth exceeded',
          timestamp: Date.now(),
          location: 'http://localhost:3000/page',
        },
      ];
      world.diagnostics!.requestCountByUrl.set('http://localhost/api/users', 25);

      expect(() => {
        DiagnosticsReporter.assertNoDiagnosticErrors(world, environment);
      }).toThrow();
    });

    it('should ignore console messages that do not match patterns', () => {
      world.diagnostics!.consoleMessages = [
        {
          type: 'log',
          text: 'Application started successfully',
          timestamp: Date.now(),
          location: 'http://localhost:3000',
        },
        {
          type: 'warn',
          text: 'Deprecation warning',
          timestamp: Date.now(),
          location: 'http://localhost:3000',
        },
      ];

      expect(() => {
        DiagnosticsReporter.assertNoDiagnosticErrors(world, environment);
      }).not.toThrow();
    });

    it('should handle missing diagnostics gracefully', () => {
      world.diagnostics = undefined;

      expect(() => {
        DiagnosticsReporter.assertNoDiagnosticErrors(world, environment);
      }).not.toThrow();
    });
  });

  describe('error message formatting', () => {
    it('should include descriptive error message title', () => {
      world.diagnostics!.consoleMessages = [
        {
          type: 'error',
          text: 'Maximum update depth exceeded',
          timestamp: Date.now(),
          location: 'http://localhost',
        },
      ];

      try {
        DiagnosticsReporter.assertNoDiagnosticErrors(world, environment);
      } catch (error) {
        const message = (error as Error).message;
        expect(message.toLowerCase()).toContain('diagnostic');
        expect(message.toLowerCase()).toContain('error');
      }
    });

    it('should list matched console error patterns', () => {
      world.diagnostics!.consoleMessages = [
        {
          type: 'error',
          text: 'Maximum update depth exceeded in component',
          timestamp: Date.now(),
          location: 'http://localhost:3000/page',
        },
      ];

      try {
        DiagnosticsReporter.assertNoDiagnosticErrors(world, environment);
      } catch (error) {
        const message = (error as Error).message;
        expect(message).toContain('Maximum update');
      }
    });

    it('should list URLs with violation counts', () => {
      world.diagnostics!.requestCountByUrl.set('http://localhost/api/users', 25);

      try {
        DiagnosticsReporter.assertNoDiagnosticErrors(world, environment);
      } catch (error) {
        const message = (error as Error).message;
        expect(message).toContain('http://localhost/api/users');
        expect(message).toContain('25');
      }
    });

    it('should include context about threshold', () => {
      world.diagnostics!.requestCountByUrl.set('http://localhost/api/users', 25);

      try {
        DiagnosticsReporter.assertNoDiagnosticErrors(world, environment);
      } catch (error) {
        const message = (error as Error).message;
        expect(message).toContain('20'); // threshold value
      }
    });
  });

  describe('edge cases', () => {
    it('should handle console message with special characters', () => {
      world.diagnostics!.consoleMessages = [
        {
          type: 'error',
          text: 'Maximum update depth exceeded [Error: "Special \\"chars\\""]',
          timestamp: Date.now(),
          location: 'http://localhost',
        },
      ];

      expect(() => {
        DiagnosticsReporter.assertNoDiagnosticErrors(world, environment);
      }).toThrow();
    });

    it('should handle very long error messages', () => {
      const longText = 'Maximum update depth exceeded ' + 'x'.repeat(1000);
      world.diagnostics!.consoleMessages = [
        {
          type: 'error',
          text: longText,
          timestamp: Date.now(),
          location: 'http://localhost',
        },
      ];

      expect(() => {
        DiagnosticsReporter.assertNoDiagnosticErrors(world, environment);
      }).toThrow();
    });

    it('should handle multiple pattern matches in single message', () => {
      world.diagnostics!.consoleMessages = [
        {
          type: 'error',
          text: 'Maximum update depth exceeded and Too many re-renders',
          timestamp: Date.now(),
          location: 'http://localhost',
        },
      ];

      expect(() => {
        DiagnosticsReporter.assertNoDiagnosticErrors(world, environment);
      }).toThrow();
    });

    it('should be case-insensitive when matching error patterns', () => {
      world.diagnostics!.consoleMessages = [
        {
          type: 'error',
          text: 'maximum update depth exceeded',
          timestamp: Date.now(),
          location: 'http://localhost',
        },
      ];

      expect(() => {
        DiagnosticsReporter.assertNoDiagnosticErrors(world, environment);
      }).toThrow();
    });

    it('should handle empty error patterns list', () => {
      environment.consoleErrorPatterns = [];
      world.diagnostics!.consoleMessages = [
        {
          type: 'error',
          text: 'Some error',
          timestamp: Date.now(),
          location: 'http://localhost',
        },
      ];

      expect(() => {
        DiagnosticsReporter.assertNoDiagnosticErrors(world, environment);
      }).not.toThrow();
    });
  });
});
