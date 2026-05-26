import type { SystemAgentPreferenceResponse } from '@vassembly/domain-system-agent';

import type { ToPreferenceResponseParams } from './types';

export const toPreferenceResponse = ({
  preference,
}: ToPreferenceResponseParams): SystemAgentPreferenceResponse => {
  if (preference.userId === undefined) {
    throw new Error('Preference userId is required');
  }

  if (preference.integrationCredentialId === undefined) {
    throw new Error('Preference integrationCredentialId is required');
  }

  if (preference.updatedAt === undefined) {
    throw new Error('Preference updatedAt is required');
  }

  return {
    userId: preference.userId,
    integrationCredentialId: preference.integrationCredentialId,
    updatedAt:
      preference.updatedAt instanceof Date
        ? preference.updatedAt.toISOString()
        : preference.updatedAt,
  };
};
