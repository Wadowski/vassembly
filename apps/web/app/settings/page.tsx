'use client';

import { ProtectedAuthRoute } from '../../lib/auth/ProtectedAuthRoute';
import { SettingsAuthenticatedView } from './settingsAuthenticatedView';
import { SettingsSkeleton } from './_components/SettingsSkeleton';

const SETTINGS_LOGIN_ROUTE = `/login?returnUrl=${encodeURIComponent('/settings')}`;

export default function SettingsPage(): JSX.Element {
  return (
    <ProtectedAuthRoute requireAuthenticated redirectPath={SETTINGS_LOGIN_ROUTE} loadingFallback={<SettingsSkeleton />}>
      <SettingsAuthenticatedView />
    </ProtectedAuthRoute>
  );
}
