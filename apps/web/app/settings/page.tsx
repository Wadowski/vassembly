'use client';

import { ProtectedAuthRoute } from '../../lib/auth/ProtectedAuthRoute';
import { SettingsAuthenticatedView } from './settingsAuthenticatedView';

const SETTINGS_LOGIN_ROUTE = `/login?returnUrl=${encodeURIComponent('/settings')}`;

export default function SettingsPage(): JSX.Element {
  return (
    <ProtectedAuthRoute requireAuthenticated redirectPath={SETTINGS_LOGIN_ROUTE}>
      <SettingsAuthenticatedView />
    </ProtectedAuthRoute>
  );
}
