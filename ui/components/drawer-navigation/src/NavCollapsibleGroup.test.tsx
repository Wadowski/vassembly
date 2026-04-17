import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NavCollapsibleGroup } from './NavCollapsibleGroup';
import type { NavGroupItem } from './types';

const group: NavGroupItem = {
  kind: 'group',
  id: 'g1',
  label: 'Projects',
  children: [
    { kind: 'link', id: 'c1', label: 'Overview', href: '/p/o' },
  ],
};

describe('NavCollapsibleGroup', () => {
  it('toggles aria-expanded when header is activated', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(
      <ul>
        <NavCollapsibleGroup
          item={group}
          isExpanded={false}
          onToggle={onToggle}
          panelId="g1-panel"
          isReducedMotion
        >
          <li>child</li>
        </NavCollapsibleGroup>
      </ul>,
    );

    const header = screen.getByRole('button', { name: /projects/i });
    expect(header).toHaveAttribute('aria-expanded', 'false');

    await user.click(header);
    expect(onToggle).toHaveBeenCalledWith({ groupId: 'g1' });
  });
});
