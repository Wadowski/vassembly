import type { AuthTokenRole } from '@vassembly/domain-auth-token';

export interface AssertAdminRoleParams {
  role: AuthTokenRole;
}
