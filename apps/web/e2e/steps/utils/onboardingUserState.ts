import { requireWorkspaceModule } from '@vassembly/e2e';
import type { SeedContext } from '@vassembly/e2e';

import { ensureDomainInfrastructure } from './initDomainContext';

const getEncoder = (): typeof import('@vassembly/client-encoder') =>
  requireWorkspaceModule<typeof import('@vassembly/client-encoder')>({
    moduleName: '@vassembly/client-encoder',
  });

export interface OnboardingUserState {
  startedAt?: Date;
  completedAt?: Date | null;
  verifiedAt?: Date | null;
  emailVerificationToken?: string | null;
  emailVerificationExpiresAt?: Date | null;
  emailVerificationIssuedAt?: Date | null;
  isGrandfathered?: boolean;
}

export interface UpdateUserOnboardingStateParams {
  context: SeedContext;
  userId: string;
  state: OnboardingUserState;
}

export const updateUserOnboardingState = async ({
  context,
  userId,
  state,
}: UpdateUserOnboardingStateParams): Promise<void> => {
  await ensureDomainInfrastructure({ context });

  const { mongoDb } = requireWorkspaceModule<typeof import('@vassembly/client-mongodb')>({
    moduleName: '@vassembly/client-mongodb',
  });
  const { ObjectId } = requireWorkspaceModule<typeof import('mongodb')>({
    moduleName: 'mongodb',
  });

  const updates: Record<string, unknown> = {};

  if (state.isGrandfathered) {
    updates.onboarding = { version: 1, completedAt: new Date('2026-06-27T00:00:00.000Z') };
  } else {
    updates.onboarding = {
      version: 1,
      startedAt: state.startedAt ?? new Date(),
      completedAt: state.completedAt ?? null,
    };
  }

  if (state.verifiedAt !== undefined) {
    updates.verifiedAt = state.verifiedAt;
  }
  if (state.emailVerificationToken !== undefined) {
    updates.emailVerificationToken = state.emailVerificationToken;
  }
  if (state.emailVerificationExpiresAt !== undefined) {
    updates.emailVerificationExpiresAt = state.emailVerificationExpiresAt;
  }
  if (state.emailVerificationIssuedAt !== undefined) {
    updates.emailVerificationIssuedAt = state.emailVerificationIssuedAt;
  }

  await mongoDb.db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $set: updates });
};

export interface IssueVerificationTokenParams {
  context: SeedContext;
  userId: string;
  expiresAt?: Date;
  issuedAt?: Date;
}

export interface IssueVerificationTokenResult {
  plaintextToken: string;
}

export const issueVerificationTokenForUser = async ({
  context,
  userId,
  expiresAt,
  issuedAt,
}: IssueVerificationTokenParams): Promise<IssueVerificationTokenResult> => {
  const { randomString, encode } = getEncoder();
  const plaintextToken = randomString(32);
  const encodedToken = encode(plaintextToken);
  const expiry = expiresAt ?? new Date(Date.now() + 48 * 60 * 60 * 1000);

  await updateUserOnboardingState({
    context,
    userId,
    state: {
      completedAt: null,
      verifiedAt: null,
      emailVerificationToken: encodedToken,
      emailVerificationExpiresAt: expiry,
      emailVerificationIssuedAt: issuedAt ?? new Date(),
    },
  });

  return { plaintextToken };
};
