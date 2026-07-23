import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { ExpandableText } from './ExpandableText';

describe('ExpandableText', () => {
  it('should render short text without show more control', () => {
    render(<ExpandableText text="Short comment" testId="expandable" />);

    expect(screen.getByTestId('expandable')).toHaveTextContent('Short comment');
    expect(screen.queryByTestId('expandable-toggle')).toBeNull();
  });

  it('should expand long text when show more is clicked', async () => {
    const user = userEvent.setup();
    const longText = 'word '.repeat(80);

    render(<ExpandableText text={longText} testId="expandable" />);

    await user.click(screen.getByTestId('expandable-toggle'));

    expect(screen.getByTestId('expandable-toggle')).toHaveTextContent('Show less');
  });
});
