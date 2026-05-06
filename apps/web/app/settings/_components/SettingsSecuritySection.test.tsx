import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as UiUserAuthNamespace from '@vassembly/ui-user-auth';

import { SettingsSecuritySection } from './SettingsSecuritySection';

describe('SettingsSecuritySection', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('suppresses credential controls whenever the authenticated subject is SSO only', () => {
    vi.spyOn(UiUserAuthNamespace, 'useUserAuth').mockReturnValue({
      user: { id: 'sso-demo', isSsoOnly: true },
    } as unknown as ReturnType<typeof UiUserAuthNamespace.useUserAuth>);

    const hiddenSecurityView = render(<SettingsSecuritySection />);
    expect(hiddenSecurityView.container.firstChild).toBeNull();
  });
});
