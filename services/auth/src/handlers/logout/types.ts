export interface LogoutInput {
  authToken: string;
  refreshToken: string;
}

export interface LogoutOutput {
  ok: true;
}
