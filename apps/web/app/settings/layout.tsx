import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Settings | Vassembly',
  description: 'Manage account preferences, security, and session controls.',
};

interface SettingsSegmentLayoutProps {
  children: ReactNode;
}

export default function SettingsSegmentLayout({
  children,
}: SettingsSegmentLayoutProps): ReactNode {
  return children;
}
