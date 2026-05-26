import { describe, expect, it } from 'vitest';

import { getSystemAgentErrorMessage } from './getSystemAgentErrorMessage';

describe('getSystemAgentErrorMessage', () => {
  it('should map known system agent error codes to user-facing messages', () => {
    const message = getSystemAgentErrorMessage(
      { message: 'raw', error: { code: 'SYSTEM_AGENT_CONNECTION_REQUIRED' } },
      'fallback',
    );

    expect(message).toBe('Add an AI connection before using platform agents.');
  });

  it('should fall back to the server message when code is unknown', () => {
    const message = getSystemAgentErrorMessage({ message: 'Server rejected request.' }, 'fallback');

    expect(message).toBe('Server rejected request.');
  });
});
