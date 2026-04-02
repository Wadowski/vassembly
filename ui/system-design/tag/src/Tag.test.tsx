import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Tag } from './Tag';
import styles from './Tag.module.scss';

describe('Tag', () => {
  describe('Rendering', () => {
    it('renders children', () => {
      render(<Tag data-testid="tag">Tag</Tag>);
      expect(screen.getByText('Tag')).toBeInTheDocument();
    });

    it('merges className prop', () => {
      render(
        <Tag data-testid="tag" className="custom-class">
          Tag
        </Tag>,
      );
      expect(screen.getByTestId('tag').className).toContain('custom-class');
    });
  });

  describe('Variants', () => {
    it('applies stateDefault class by default', () => {
      render(<Tag data-testid="tag">Tag</Tag>);
      expect(screen.getByTestId('tag').className).toContain(styles.stateDefault);
    });

    it('applies statePrimary for variant="primary"', () => {
      render(<Tag data-testid="tag" variant="primary">Tag</Tag>);
      expect(screen.getByTestId('tag').className).toContain(styles.statePrimary);
    });

    it('applies stateSuccess for variant="success"', () => {
      render(<Tag data-testid="tag" variant="success">Tag</Tag>);
      expect(screen.getByTestId('tag').className).toContain(styles.stateSuccess);
    });

    it('applies stateWarning for variant="warning"', () => {
      render(<Tag data-testid="tag" variant="warning">Tag</Tag>);
      expect(screen.getByTestId('tag').className).toContain(styles.stateWarning);
    });

    it('applies stateError for variant="error"', () => {
      render(<Tag data-testid="tag" variant="error">Tag</Tag>);
      expect(screen.getByTestId('tag').className).toContain(styles.stateError);
    });
  });

  describe('Sizes', () => {
    it('applies state sizeMedium by default', () => {
      render(<Tag data-testid="tag">Tag</Tag>);
      expect(screen.getByTestId('tag').className).toContain(styles.sizeMedium);
    });

    it('applies sizeSmall for size="sm"', () => {
      render(<Tag data-testid="tag" size="small">Tag</Tag>);
      expect(screen.getByTestId('tag').className).toContain(styles.sizeSmall);
    });

    it('applies sizeMedium for size="md"', () => {
      render(<Tag data-testid="tag" size="medium">Tag</Tag>);
      expect(screen.getByTestId('tag').className).toContain(styles.sizeMedium);
    });

    it('applies sizeLarge for size="lg"', () => {
      render(<Tag data-testid="tag" size="large">Tag</Tag>);
      expect(screen.getByTestId('tag').className).toContain(styles.sizeLarge);
    });
  });

  describe('Icon', () => {
    it('renders icon to the left of children', () => {
      render(
        <Tag data-testid="tag" icon={<span data-testid="tag-icon">I</span>}>
          Hello
        </Tag>,
      );

      const iconEl = screen.getByTestId('tag-icon');
      const labelEl = screen.getByText('Hello');

      expect(iconEl).toBeInTheDocument();
      const position = iconEl.compareDocumentPosition(labelEl);
      expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('does not render an icon wrapper when icon is not provided', () => {
      render(<Tag data-testid="tag">Hello</Tag>);
      expect(screen.queryByTestId('tag-icon')).not.toBeInTheDocument();
    });
  });

  describe('Remove button', () => {
    it('renders a remove button when onRemove is provided', () => {
      render(<Tag data-testid="tag" onRemove={() => {}}>Closable</Tag>);
      expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
    });

    it('uses removeLabel as aria-label with default value "Remove"', () => {
      render(<Tag onRemove={() => {}}>Closable</Tag>);
      expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
    });

    it('renders removeLabel when provided', () => {
      render(<Tag onRemove={() => {}} removeLabel="Dismiss">Closable</Tag>);
      expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
    });

    it('calls onRemove when remove button is clicked', async () => {
      const onRemove = vi.fn();
      const user = userEvent.setup();

      render(<Tag data-testid="tag" onRemove={onRemove}>Closable</Tag>);
      await user.click(screen.getByRole('button', { name: 'Remove' }));

      expect(onRemove).toHaveBeenCalledTimes(1);
    });

    it('does not render remove button when onRemove is not provided', () => {
      render(<Tag data-testid="tag">Not removable</Tag>);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });
});

