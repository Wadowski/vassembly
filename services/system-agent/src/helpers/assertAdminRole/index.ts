import { AuthTokenRole } from '@vassembly/domain-auth-token';
import { ForbiddenError } from '@vassembly/errors';

import type { AssertAdminRoleParams } from './types';

export const assertAdminRole = ({ role }: AssertAdminRoleParams): void => {
  if (role !== AuthTokenRole.ADMIN) {
    throw new ForbiddenError('Admin access required');
  }
};
