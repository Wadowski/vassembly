import { decodeJwtPayload } from './decodeJwtPayload';

export interface ParseOnboardingCompletedParams {
  authToken: string;
}

export const parseOnboardingCompleted = ({
  authToken,
}: ParseOnboardingCompletedParams): boolean => {
  const payload = decodeJwtPayload(authToken);
  if (payload === null) {
    return false;
  }

  return payload.onb !== false;
};
