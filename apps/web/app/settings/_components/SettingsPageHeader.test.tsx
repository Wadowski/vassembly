import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SettingsPageHeader } from './SettingsPageHeader';

describe('SettingsPageHeader', () => {
  it('shows the curated title duo for authenticated settings context', () => {
    render(<SettingsPageHeader />);
    expect(screen.getByText('Settings')).toBeTruthy();
    expect(screen.getByText('Account and preferences for this device.')).toBeTruthy();
  });
});
