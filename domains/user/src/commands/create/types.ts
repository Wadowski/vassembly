export interface CreateDbUserCommand {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}