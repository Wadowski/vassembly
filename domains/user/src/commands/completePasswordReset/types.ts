export interface CompletePasswordResetCommand {
  userId: string;
  plainToken: string;
  newPassword: string;
}
