import { describe, expect, it } from 'vitest';

import { resolveScriptFilename } from './resolveScriptFilename';

const SCRIPTS = [{ filename: 'scripts/check-reachability.py' }];

describe('resolveScriptFilename', () => {
  it('should resolve an exact filename match', () => {
    const result = resolveScriptFilename({
      scriptRef: 'scripts/check-reachability.py',
      scripts: SCRIPTS,
    });

    expect(result).toBe('scripts/check-reachability.py');
  });

  it('should resolve underscore variants of the script basename', () => {
    const result = resolveScriptFilename({
      scriptRef: 'scripts/check_reachability.py',
      scripts: SCRIPTS,
    });

    expect(result).toBe('scripts/check-reachability.py');
  });

  it('should resolve a basename-only reference', () => {
    const result = resolveScriptFilename({
      scriptRef: 'check_reachability',
      scripts: SCRIPTS,
    });

    expect(result).toBe('scripts/check-reachability.py');
  });

  it('should return null when multiple scripts match', () => {
    const result = resolveScriptFilename({
      scriptRef: 'check',
      scripts: [
        { filename: 'scripts/check-host.py' },
        { filename: 'scripts/check-port.py' },
      ],
    });

    expect(result).toBeNull();
  });

  it('should return null when no script matches', () => {
    const result = resolveScriptFilename({
      scriptRef: 'scripts/missing.py',
      scripts: SCRIPTS,
    });

    expect(result).toBeNull();
  });
});
