import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';
import { HttpClientProvider } from '@vassembly/ui-api-hooks';
import { SnackbarProvider } from '@vassembly/ui-system-design/snackbar';
import { ForgotPasswordForm } from './ForgotPasswordForm';

const meta: Meta<typeof ForgotPasswordForm> = {
  title: 'Components/ForgotPasswordForm',
  component: ForgotPasswordForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (story) => (
      <HttpClientProvider config={{ baseUrl: 'http://localhost:5000' }}>
        <SnackbarProvider position="bottom-left">{story()}</SnackbarProvider>
      </HttpClientProvider>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    titleId: 'forgot-password-title',
  },
};

export const WithTitle: Story = {
  args: {
    title: 'Reset your access',
    titleId: 'forgot-password-title',
  },
};

export const WithCustomLabel: Story = {
  args: {
    titleId: 'forgot-password-title',
    submitLabel: 'Email me a link',
  },
};

export const WithSuccessCallback: Story = {
  args: {
    titleId: 'forgot-password-title',
    onSuccess: action('onSuccess called'),
  },
};
