import systemAgentDomain from '@vassembly/domain-system-agent';
import { ValidationError } from '@vassembly/errors';

export interface ResolveSystemCallCredentialIdParams {
  userId: string;
}

export const resolveSystemCallCredentialId = async ({
  userId,
}: ResolveSystemCallCredentialIdParams): Promise<string> => {
  const preference = (await systemAgentDomain.queries.getPreferenceByUserId({ userId })).data;
  const credentialId = preference?.integrationCredentialId;

  if (!credentialId) {
    throw new ValidationError(
      'Configure a "preferred for system calls" AI credential in Settings.',
    );
  }

  return credentialId;
};
