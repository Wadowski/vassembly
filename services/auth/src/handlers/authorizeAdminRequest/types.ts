export interface AuthorizeAdminRequestInput {
  headers: Record<string, string>;
}

export interface AuthorizeAdminRequestOutput {
  userId: string;
  role: "admin";
}
