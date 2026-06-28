export interface ConfirmEmailVerificationInput {
  userId: string;
  token: string;
}

export interface ConfirmEmailVerificationOutput {
  success: boolean;
}
