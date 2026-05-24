import type { RouteDefinition } from '@vassembly/server';

import { changePasswordRoute } from './changePassword';
import { deleteAccountRoute } from './deleteAccount';
import { forgotPasswordRoute } from './forgotPassword';
import { loginRoute } from './login';
import { registerRoute } from './register';
import { resetPasswordRoute } from './resetPassword';
import { updateProfileRoute } from './updateProfile';

export const routes: RouteDefinition[] = [
  loginRoute,
  registerRoute,
  forgotPasswordRoute,
  resetPasswordRoute,
  changePasswordRoute,
  deleteAccountRoute,
  updateProfileRoute,
];
