import { useEffect, useState } from 'react';

import type { GetUserData } from '@vassembly/ui-api-hooks';

interface UseProfileDraftStateParams {
  remoteUserPayload: GetUserData['user'] | undefined;
}

interface UseProfileDraftStateResult {
  draftFirstName: string;
  draftLastName: string;
  handleDraftFirstNameChange: (nextFirstName: string) => void;
  handleDraftLastNameChange: (nextLastName: string) => void;
  resetDraftBaseline: () => void;
}

interface BaselineNames {
  firstName: string;
  lastName: string;
}

const resolveBaselineNames = ({
  remoteUserPayload,
}: {
  remoteUserPayload: GetUserData['user'] | undefined;
}): BaselineNames => {
  return {
    firstName: remoteUserPayload?.firstName?.trim() ?? '',
    lastName: remoteUserPayload?.lastName?.trim() ?? '',
  };
};

export const useProfileDraftState = ({
  remoteUserPayload,
}: UseProfileDraftStateParams): UseProfileDraftStateResult => {
  const [draftFirstName, setDraftFirstName] = useState('');
  const [draftLastName, setDraftLastName] = useState('');

  useEffect(() => {
    const baseline = resolveBaselineNames({
      remoteUserPayload,
    });
    setDraftFirstName(baseline.firstName);
    setDraftLastName(baseline.lastName);
  }, [
    remoteUserPayload,
    remoteUserPayload?.firstName,
    remoteUserPayload?.lastName,
  ]);

  const handleDraftFirstNameChange = (nextFirstName: string): void => {
    setDraftFirstName(nextFirstName);
  };

  const handleDraftLastNameChange = (nextLastName: string): void => {
    setDraftLastName(nextLastName);
  };

  const resetDraftBaseline = (): void => {
    const baseline = resolveBaselineNames({ remoteUserPayload });
    setDraftFirstName(baseline.firstName);
    setDraftLastName(baseline.lastName);
  };

  return {
    draftFirstName,
    draftLastName,
    handleDraftFirstNameChange,
    handleDraftLastNameChange,
    resetDraftBaseline,
  };
};
