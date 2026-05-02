import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { GraphQLProvider, HttpClientProvider } from '@vassembly/ui-api-hooks';
import { SnackbarProvider } from '@vassembly/ui-snackbar';
import { UserAuthProvider } from '@vassembly/ui-user-auth';
import { RegisterForm } from './RegisterForm';

const meta: Meta<typeof RegisterForm> = {
  title: 'Components/RegisterForm',
  component: RegisterForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (story) => (
      <HttpClientProvider config={{ baseUrl: 'http://localhost:5000' }}>
        <GraphQLProvider config={{ endpoint: 'http://localhost:5000/graphql' }}>
          <UserAuthProvider>
            <SnackbarProvider position="bottom-left">{story()}</SnackbarProvider>
          </UserAuthProvider>
        </GraphQLProvider>
      </HttpClientProvider>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    titleId: 'register-title',
    fallbackPath: '/',
    onRedirect: (href) => {
      console.log('Redirecting to:', href);
    },
  },
};

export const Loading: Story = {
  args: {
    titleId: 'register-title',
    fallbackPath: '/',
    onRedirect: (href) => {
      console.log('Redirecting to:', href);
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Submit the form to observe loading state on controls.',
      },
    },
  },
};

export const WithValidationErrors: Story = {
  args: {
    titleId: 'register-title',
    fallbackPath: '/',
    onRedirect: (href) => {
      console.log('Redirecting to:', href);
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Submit with empty fields to see validation via snackbar.',
      },
    },
  },
};

export const Filled: Story = {
  args: {
    titleId: 'register-title',
    submitLabel: 'Create account',
    fallbackPath: '/',
    onRedirect: (href) => {
      console.log('Redirecting to:', href);
    },
  },
};
