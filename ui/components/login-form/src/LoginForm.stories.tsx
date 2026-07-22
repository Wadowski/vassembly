import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { GraphQLProvider, HttpClientProvider } from '@vassembly/ui-api-hooks';
import { SnackbarProvider } from '@vassembly/ui-system-design/snackbar';
import { UserAuthProvider } from '@vassembly/ui-user-auth';
import { LoginForm } from './LoginForm';

const meta: Meta<typeof LoginForm> = {
  title: 'Components/LoginForm',
  component: LoginForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (story) => (
      <HttpClientProvider config={{ baseUrl: "http://localhost:5000" }}>
        <GraphQLProvider config={{ endpoint: "http://localhost:5000/graphql" }}>
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
    titleId: 'login-title',
    fallbackPath: '/',
    onRedirect: (href) => {
      console.log('Redirecting to:', href);
    },
  },
};

export const WithoutTitle: Story = {
  args: {
    fallbackPath: '/',
    onRedirect: (href) => {
      console.log('Redirecting to:', href);
    },
  },
};

export const WithCustomSubmitLabel: Story = {
  args: {
    titleId: 'login-title',
    submitLabel: 'Log In',
    fallbackPath: '/',
    onRedirect: (href) => {
      console.log('Redirecting to:', href);
    },
  },
};

export const WithReturnUrl: Story = {
  args: {
    titleId: 'login-title',
    returnUrl: '/dashboard',
    fallbackPath: '/',
    onRedirect: (href) => {
      console.log('Redirecting to:', href);
    },
  },
};

export const WithCustomClass: Story = {
  args: {
    titleId: 'login-title',
    className: 'custom-login-form',
    fallbackPath: '/',
    onRedirect: (href) => {
      console.log('Redirecting to:', href);
    },
  },
};

export const WithSuccessCallback: Story = {
  args: {
    titleId: 'login-title',
    fallbackPath: '/',
    onRedirect: (href) => {
      console.log('Redirecting to:', href);
    },
    onSuccess: (result) => {
      console.log('Login successful:', {
        user: result.user.email,
        hasToken: !!result.authToken,
      });
    },
  },
};
