import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, it } from 'vitest';
import { Stepper } from './Stepper';
import type { StepperStep } from './types';

const SAMPLE_STEPS: readonly StepperStep[] = [
  {
    id: 'a',
    icon: <span data-testid="icon-a">A</span>,
    title: 'First',
    description: 'First detail',
  },
  {
    id: 'b',
    icon: <span data-testid="icon-b">B</span>,
    title: 'Second',
    description: 'Second detail',
  },
  {
    id: 'c',
    icon: <span data-testid="icon-c">C</span>,
    title: 'Third',
    description: 'Third detail',
  },
];

describe('Stepper', () => {
  it('renders each step title, description, and icon', () => {
    render(<Stepper steps={SAMPLE_STEPS} currentStepIndex={0} />);

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('First detail')).toBeInTheDocument();
    expect(screen.getByTestId('icon-a')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.getByText('Third')).toBeInTheDocument();
  });

  it('sets aria-current to step only on the active index', () => {
    render(<Stepper steps={SAMPLE_STEPS} currentStepIndex={1} ariaLabel="Onboarding" />);

    const list = screen.getByRole('list');
    const items = within(list).getAllByRole('listitem');

    expect(items[0]).not.toHaveAttribute('aria-current');
    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(items[2]).not.toHaveAttribute('aria-current');
  });

  it('uses the custom aria-label on the navigation region', () => {
    render(<Stepper steps={SAMPLE_STEPS} currentStepIndex={0} ariaLabel="Checkout flow" />);

    expect(screen.getByRole('navigation', { name: 'Checkout flow' })).toBeInTheDocument();
  });
});
