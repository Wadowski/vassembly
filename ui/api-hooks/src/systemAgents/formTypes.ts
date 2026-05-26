import type {
  SystemAgentAdminItem,
  SystemAgentFormInput,
  SystemAgentInvokeInput,
  SystemAgentInvokeResult,
  SystemAgentPreference,
} from './types';

export interface SystemAgentCreateVariables {
  body: SystemAgentFormInput;
}

export interface SystemAgentUpdateVariables {
  id: string;
  body: Partial<SystemAgentFormInput>;
}

export interface SystemAgentArchiveVariables {
  id: string;
}

export interface SystemAgentRestoreVariables {
  id: string;
}

export interface SystemAgentInvokeVariables {
  id: string;
  body: SystemAgentInvokeInput;
}

export interface SystemAgentPreferenceVariables {
  body: {
    integrationCredentialId: string;
  };
}

export interface SystemAgentCreateMutationData {
  agent: SystemAgentAdminItem;
}

export interface SystemAgentUpdateMutationData {
  agent: SystemAgentAdminItem;
}

export interface SystemAgentArchiveMutationData {
  agent: SystemAgentAdminItem;
}

export interface SystemAgentRestoreMutationData {
  agent: SystemAgentAdminItem;
}

export interface SystemAgentInvokeMutationData {
  result: SystemAgentInvokeResult;
}

export interface SystemAgentPreferenceMutationData {
  preference: SystemAgentPreference;
}
