interface SettingsSectionAnchorDescriptor {
  id: string;
  anchorId: string;
  label: string;
}

export const SETTINGS_SECTION_DESCRIPTOR_LIST: readonly SettingsSectionAnchorDescriptor[] = [
  { id: 'profile', anchorId: 'profile', label: 'Profile' },
  { id: 'security', anchorId: 'security', label: 'Security' },
  { id: 'aiConnections', anchorId: 'ai-connections', label: 'AI Connections' },
  { id: 'notifications', anchorId: 'notifications', label: 'Notifications' },
  { id: 'privacy', anchorId: 'privacy', label: 'Privacy' },
  { id: 'session', anchorId: 'session', label: 'Session' },
  { id: 'accountDeletion', anchorId: 'account-deletion', label: 'Account deletion' },
] as const;
