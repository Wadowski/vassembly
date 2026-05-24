export interface DeleteCredentialHandlerInput {
  userId: string;
  credentialId: string;
}

export interface DeleteCredentialHandlerOutput {
  success: boolean;
  message: string;
}
