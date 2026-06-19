import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { ProgressDetailModal } from './ProgressDetailModal';

import type { ProgressEvent } from '../types';

vi.mock('@vassembly/ui-modal', () => ({
  Modal: ({
    children,
    title,
    isOpen,
  }: {
    children: React.ReactNode;
    title: string;
    isOpen: boolean;
  }) =>
    isOpen ? (
      <div>
        <h1>{title}</h1>
        {children}
      </div>
    ) : null,
}));

const BASE_EVENT: ProgressEvent = {
  id: 'event-1',
  agentId: 'agent-1',
  agentName: 'Research Agent',
  parentAgentId: null,
  state: 'COMPLETED',
  timestamp: new Date('2026-06-15T10:00:00.000Z'),
  duration: 1200,
  inputMessages: null,
  generatedResponse: null,
  tokenUsage: null,
  errorDetails: null,
  integrationName: null,
  provider: null,
  model: null,
};

describe('ProgressDetailModal', () => {
  it('should render AI Integration section when integration fields are present', () => {
    render(
      <ProgressDetailModal
        isOpen
        event={{
          ...BASE_EVENT,
          integrationName: 'My OpenAI',
          provider: 'chatgpt',
          model: 'gpt-4o',
        }}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('AI Integration')).toBeTruthy();
    expect(screen.getByText('My OpenAI')).toBeTruthy();
    expect(screen.getByText('OpenAI ChatGPT')).toBeTruthy();
    expect(screen.getByText('gpt-4o')).toBeTruthy();
  });

  it('should hide AI Integration section when all integration fields are absent', () => {
    render(<ProgressDetailModal isOpen event={BASE_EVENT} onClose={vi.fn()} />);

    expect(screen.queryByText('AI Integration')).toBeNull();
  });
});
