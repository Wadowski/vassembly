export interface ToPreferenceResponseParams {
  preference: {
    userId?: string;
    integrationCredentialId?: string;
    updatedAt?: Date | string;
  };
}
