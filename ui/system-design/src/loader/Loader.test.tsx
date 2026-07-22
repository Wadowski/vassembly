import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { Loader } from './Loader';

describe('Loader', () => {
  it('has role status', () => {
    render(<Loader />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('uses default accessible name Loading when there are no children', () => {
    render(<Loader />);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('uses custom ariaLabel when there are no children', () => {
    render(<Loader ariaLabel="Fetching data" />);
    expect(screen.getByRole('status', { name: 'Fetching data' })).toBeInTheDocument();
  });

  it('derives accessible name from children in the visually hidden path', () => {
    render(<Loader>Saving documents</Loader>);
    expect(
      screen.getByRole('status', { name: 'Saving documents' }),
    ).toBeInTheDocument();
  });

  it('merges className on the root element', () => {
    render(<Loader className="my-loader" />);
    const root = screen.getByRole('status');
    expect(root.className).toContain('my-loader');
  });
});
