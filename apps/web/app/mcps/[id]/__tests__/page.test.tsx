import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UnauthorizedError } from '@vassembly/errors';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CONFIGURATION_SAVED_MESSAGE,
  CONNECTION_VERIFIED_MESSAGE,
  MOCK_MCP_CONFIGURED,
  MOCK_MCP_ID,
  MOCK_MCP_WITHOUT_SCHEMA,
  MOCK_MCP_WITH_FULL_SCHEMA,
  MOCK_SAVE_CONFIGURATION_RESPONSE,
  MOCK_SAVED_CONFIGURATION,
  MOCK_TEST_CONNECTION_FAILURE,
  MOCK_TEST_CONNECTION_SUCCESS,
  NETWORK_ERROR_MESSAGE,
  NOT_FOUND_MESSAGE,
  NO_CONFIGURATION_MESSAGE,
  PASSWORD_KEEP_HINT,
} from './fixtures/mcpDetailFixtures';

const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockBack = vi.fn();
const mockShowSnackbar = vi.fn();

const mockUseMcp = vi.fn();
const mockUseMcpConfiguration = vi.fn();
const mockUseTestMcpConnection = vi.fn();
const mockUseSaveMcpConfiguration = vi.fn();
const mockUseUpdateMcpConfiguration = vi.fn();
const mockUseDeleteMcpConfiguration = vi.fn();
const mockTestConnection = vi.fn();
const mockSaveConfiguration = vi.fn();
const mockUpdateConfiguration = vi.fn();
const mockDeleteConfiguration = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: vi.fn(),
    back: mockBack,
  }),
  usePathname: (): string => `/mcps/${MOCK_MCP_ID}`,
  useParams: (): Record<string, string> => ({ id: MOCK_MCP_ID }),
  useSearchParams: (): URLSearchParams => new URLSearchParams(),
}));

vi.mock('@vassembly/ui-user-auth', () => ({
  useUserAuth: vi.fn(() => ({
    isAuthenticated: true,
    bootstrapLoading: false,
    role: 'user',
  })),
}));

vi.mock('@vassembly/ui-snackbar', () => ({
  SnackbarProvider: ({ children }: { children: unknown }) => children,
  useSnackbar: vi.fn(() => ({
    show: mockShowSnackbar,
    dismiss: vi.fn(),
  })),
}));

vi.mock('@vassembly/ui-api-hooks', async (importOriginal) => {
  const original = await importOriginal<typeof import('@vassembly/ui-api-hooks')>();

  return {
    ...original,
    useMcp: (...args: unknown[]) => mockUseMcp(...args),
    useMcpConfiguration: (...args: unknown[]) => mockUseMcpConfiguration(...args),
    useTestMcpConnection: (...args: unknown[]) => mockUseTestMcpConnection(...args),
    useSaveMcpConfiguration: (...args: unknown[]) => mockUseSaveMcpConfiguration(...args),
    useUpdateMcpConfiguration: (...args: unknown[]) => mockUseUpdateMcpConfiguration(...args),
    useDeleteMcpConfiguration: (...args: unknown[]) => mockUseDeleteMcpConfiguration(...args),
  };
});

mockUseTestMcpConnection.mockImplementation(() => [
  mockTestConnection,
  { loading: false, error: null },
]);
mockUseSaveMcpConfiguration.mockImplementation(() => [
  mockSaveConfiguration,
  { loading: false, error: null },
]);
mockUseUpdateMcpConfiguration.mockImplementation(() => [
  mockUpdateConfiguration,
  { loading: false, error: null },
]);
mockUseDeleteMcpConfiguration.mockImplementation(() => [
  mockDeleteConfiguration,
  { loading: false, error: null },
]);

import { useSnackbar } from '@vassembly/ui-snackbar';

import McpDetailPage from '../page';

const setupDefaultMocks = (): void => {
  mockUseMcp.mockReturnValue({
    data: { mcp: MOCK_MCP_WITH_FULL_SCHEMA },
    loading: false,
    error: undefined,
  });

  mockUseMcpConfiguration.mockReturnValue({
    data: { configuration: null },
    loading: false,
    error: undefined,
  });

  mockTestConnection.mockResolvedValue(MOCK_TEST_CONNECTION_SUCCESS);
  mockSaveConfiguration.mockResolvedValue(MOCK_SAVE_CONFIGURATION_RESPONSE);
  mockUpdateConfiguration.mockResolvedValue(MOCK_SAVE_CONFIGURATION_RESPONSE);
  mockDeleteConfiguration.mockResolvedValue({ success: true });
};

const fillValidForm = async (user: ReturnType<typeof userEvent.setup>): Promise<void> => {
  await user.type(screen.getByLabelText(/client id/i), 'new-client-id');
  await user.type(screen.getByLabelText(/client secret/i), 'new-client-secret');
  await user.selectOptions(screen.getByLabelText(/region/i), 'us-east-1');
  await user.type(screen.getByLabelText(/webhook url/i), 'https://hooks.example.com/gmail');
  await user.type(screen.getByLabelText(/contact email/i), 'admin@example.com');
};

describe('McpDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
    vi.mocked(useSnackbar).mockReturnValue({
      show: mockShowSnackbar,
      dismiss: vi.fn(),
    });
  });

  describe('page load and display', () => {
    it('should load MCP by id with configSchema', () => {
      render(<McpDetailPage />);

      expect(screen.getByRole('heading', { name: /gmail mcp/i })).not.toBeNull();
      expect(screen.getByLabelText(/client id/i)).not.toBeNull();
      expect(screen.getByLabelText(/region/i)).not.toBeNull();
    });

    it('should show MCP header with icon, name, status pill, description, tags, and external links', () => {
      render(<McpDetailPage />);

      expect(screen.getByRole('img', { name: /gmail mcp/i })).not.toBeNull();
      expect(screen.getByLabelText(/status: pending/i)).not.toBeNull();
      expect(screen.getByText(/connect gmail to your workspace/i)).not.toBeNull();
      expect(screen.getByText(/email/i)).not.toBeNull();
      expect(screen.getByRole('link', { name: /documentation/i })).not.toBeNull();
      expect(screen.getByRole('link', { name: /repository/i })).not.toBeNull();
    });

    it('should show 404 message when MCP is not found', () => {
      mockUseMcp.mockReturnValue({
        data: { mcp: null },
        loading: false,
        error: undefined,
      });

      render(<McpDetailPage />);

      expect(screen.getByText(NOT_FOUND_MESSAGE)).not.toBeNull();
      expect(screen.getByRole('link', { name: /back to mcps/i })).not.toBeNull();
    });

    it('should show no-configuration message when configSchema is empty', () => {
      mockUseMcp.mockReturnValue({
        data: { mcp: MOCK_MCP_WITHOUT_SCHEMA },
        loading: false,
        error: undefined,
      });

      render(<McpDetailPage />);

      expect(screen.getByText(NO_CONFIGURATION_MESSAGE)).not.toBeNull();
      expect(screen.queryByRole('button', { name: /test connection/i })).toBeNull();
    });
  });

  describe('form rendering', () => {
    it('should render text fields for text-type schema fields', () => {
      render(<McpDetailPage />);

      const clientIdField = screen.getByLabelText(/client id/i);
      expect(clientIdField).toHaveAttribute('type', 'text');
    });

    it('should render password fields masked with show and hide toggle', async () => {
      const user = userEvent.setup();
      render(<McpDetailPage />);

      const secretField = screen.getByLabelText(/client secret/i);
      expect(secretField).toHaveAttribute('type', 'password');

      await user.click(screen.getByRole('button', { name: /show/i }));
      expect(screen.getByLabelText(/client secret/i)).toHaveAttribute('type', 'text');
    });

    it('should render select dropdowns with options from schema', () => {
      render(<McpDetailPage />);

      const regionField = screen.getByLabelText(/region/i);
      expect(regionField.tagName).toBe('SELECT');
      expect(screen.getByRole('option', { name: /us east \(n\. virginia\)/i })).not.toBeNull();
    });

    it('should render checkboxes with labels and descriptions', () => {
      render(<McpDetailPage />);

      expect(screen.getByRole('checkbox', { name: /enable read-only mode/i })).not.toBeNull();
      expect(screen.getByText(/restrict actions to read-only operations/i)).not.toBeNull();
    });

    it('should mark required fields with an asterisk', () => {
      render(<McpDetailPage />);

      expect(screen.getByText(/client id \*/i)).not.toBeNull();
      expect(screen.getByLabelText(/client id/i)).toHaveAttribute('aria-required', 'true');
    });
  });

  describe('form pre-fill', () => {
    it('should pre-fill form with saved config values when configuration exists', () => {
      mockUseMcp.mockReturnValue({
        data: { mcp: MOCK_MCP_CONFIGURED },
        loading: false,
        error: undefined,
      });
      mockUseMcpConfiguration.mockReturnValue({
        data: { configuration: MOCK_SAVED_CONFIGURATION },
        loading: false,
        error: undefined,
      });

      render(<McpDetailPage />);

      expect(screen.getByLabelText(/client id/i)).toHaveValue('saved-client-id');
      expect(screen.getByLabelText(/region/i)).toHaveValue('us-east-1');
      expect(screen.getByRole('checkbox', { name: /enable read-only mode/i })).toBeChecked();
    });

    it('should show empty password fields with keep-existing hint on edit', () => {
      mockUseMcp.mockReturnValue({
        data: { mcp: MOCK_MCP_CONFIGURED },
        loading: false,
        error: undefined,
      });
      mockUseMcpConfiguration.mockReturnValue({
        data: { configuration: MOCK_SAVED_CONFIGURATION },
        loading: false,
        error: undefined,
      });

      render(<McpDetailPage />);

      expect(screen.getByLabelText(/client secret/i)).toHaveValue('');
      expect(screen.getByText(PASSWORD_KEEP_HINT)).not.toBeNull();
    });

    it('should never display plaintext saved password values in the form', () => {
      mockUseMcp.mockReturnValue({
        data: { mcp: MOCK_MCP_CONFIGURED },
        loading: false,
        error: undefined,
      });
      mockUseMcpConfiguration.mockReturnValue({
        data: { configuration: MOCK_SAVED_CONFIGURATION },
        loading: false,
        error: undefined,
      });

      render(<McpDetailPage />);

      expect(screen.getByLabelText(/client secret/i)).toHaveValue('');
      expect(screen.queryByDisplayValue('super-secret-value')).toBeNull();
    });
  });

  describe('validation', () => {
    it('should show inline validation errors on blur', async () => {
      const user = userEvent.setup();
      render(<McpDetailPage />);

      const clientIdField = screen.getByLabelText(/client id/i);
      await user.click(clientIdField);
      await user.tab();

      expect(await screen.findByText(/client id is required/i)).not.toBeNull();
    });

    it('should prevent submit when required fields are missing', async () => {
      const user = userEvent.setup();
      render(<McpDetailPage />);

      await user.click(screen.getByRole('button', { name: /test connection/i }));

      expect(screen.getByRole('button', { name: /save configuration/i })).toBeDisabled();
      expect(mockTestConnection).not.toHaveBeenCalled();
    });

    it('should enforce URL and email format validation', async () => {
      const user = userEvent.setup();
      render(<McpDetailPage />);

      await user.type(screen.getByLabelText(/webhook url/i), 'not-a-url');
      await user.tab();
      expect(await screen.findByText(/enter a valid url/i)).not.toBeNull();

      await user.clear(screen.getByLabelText(/contact email/i));
      await user.type(screen.getByLabelText(/contact email/i), 'invalid-email');
      await user.tab();
      expect(await screen.findByText(/enter a valid email/i)).not.toBeNull();
    });

    it('should disable test and save buttons while validation fails', async () => {
      render(<McpDetailPage />);

      expect(screen.getByRole('button', { name: /test connection/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /save configuration/i })).toBeDisabled();
    });
  });

  describe('test connection flow', () => {
    it('should enable test button only after client validation passes', async () => {
      const user = userEvent.setup();
      render(<McpDetailPage />);

      await fillValidForm(user);

      expect(screen.getByRole('button', { name: /test connection/i })).not.toBeDisabled();
    });

    it('should show loading spinner on test button during test', async () => {
      const user = userEvent.setup();
      mockTestConnection.mockImplementation(
        () => new Promise((resolve) => {
          setTimeout(() => resolve(MOCK_TEST_CONNECTION_SUCCESS), 100);
        }),
      );

      render(<McpDetailPage />);
      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: /test connection/i }));

      expect(screen.getByRole('button', { name: /testing connection/i })).toHaveAttribute('aria-busy', 'true');
    });

    it('should show connection verified success message after successful test', async () => {
      const user = userEvent.setup();
      render(<McpDetailPage />);
      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: /test connection/i }));

      expect(await screen.findByText(new RegExp(CONNECTION_VERIFIED_MESSAGE, 'i'))).not.toBeNull();
      expect(screen.getByTestId('connection-success-indicator')).toHaveClass('successIndicator');
    });

    it('should show error alert with API message when test fails', async () => {
      const user = userEvent.setup();
      mockTestConnection.mockResolvedValue(MOCK_TEST_CONNECTION_FAILURE);

      render(<McpDetailPage />);
      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: /test connection/i }));

      expect(await screen.findByRole('alert')).toHaveTextContent(/invalid api key/i);
    });

    it('should keep save button disabled until test succeeds', async () => {
      const user = userEvent.setup();
      render(<McpDetailPage />);
      await fillValidForm(user);

      expect(screen.getByRole('button', { name: /save configuration/i })).toBeDisabled();

      await user.click(screen.getByRole('button', { name: /test connection/i }));
      expect(await screen.findByText(new RegExp(CONNECTION_VERIFIED_MESSAGE, 'i'))).not.toBeNull();
      expect(screen.getByRole('button', { name: /save configuration/i })).not.toBeDisabled();
    });
  });

  describe('save configuration', () => {
    it('should keep save button disabled until test connection succeeds', async () => {
      const user = userEvent.setup();
      render(<McpDetailPage />);
      await fillValidForm(user);

      expect(screen.getByRole('button', { name: /save configuration/i })).toBeDisabled();
    });

    it('should show configuration saved snackbar on success', async () => {
      const user = userEvent.setup();
      render(<McpDetailPage />);
      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: /test connection/i }));
      await screen.findByText(new RegExp(CONNECTION_VERIFIED_MESSAGE, 'i'));
      await user.click(screen.getByRole('button', { name: /save configuration/i }));

      await waitFor(() => {
        expect(mockShowSnackbar).toHaveBeenCalledWith(
          expect.objectContaining({ message: CONFIGURATION_SAVED_MESSAGE }),
        );
      });
    });

    it('should redirect to mcps list after a 2-second delay on successful save', async () => {
      render(<McpDetailPage />);

      const fillUser = userEvent.setup();
      await fillValidForm(fillUser);
      await fillUser.click(screen.getByRole('button', { name: /test connection/i }));
      await screen.findByText(new RegExp(CONNECTION_VERIFIED_MESSAGE, 'i'));

      vi.useFakeTimers();

      try {
        fireEvent.click(screen.getByRole('button', { name: /save configuration/i }));
        await vi.advanceTimersByTimeAsync(2000);

        expect(mockPush).toHaveBeenCalledWith('/mcps');
      } finally {
        vi.useRealTimers();
      }
    });

    it('should show error alert and preserve form state when save fails', async () => {
      const user = userEvent.setup();
      mockSaveConfiguration.mockRejectedValue(new Error('Save failed'));

      render(<McpDetailPage />);
      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: /test connection/i }));
      await screen.findByText(new RegExp(CONNECTION_VERIFIED_MESSAGE, 'i'));
      await user.click(screen.getByRole('button', { name: /save configuration/i }));

      expect(await screen.findByRole('alert')).toHaveTextContent(/save failed/i);
      expect(screen.getByLabelText(/client id/i)).toHaveValue('new-client-id');
    });
  });

  describe('delete configuration', () => {
    it('should show delete button only when configuration exists', () => {
      mockUseMcpConfiguration.mockReturnValue({
        data: { configuration: MOCK_SAVED_CONFIGURATION },
        loading: false,
        error: undefined,
      });

      render(<McpDetailPage />);
      expect(screen.getByRole('button', { name: /remove configuration/i })).not.toBeNull();
    });

    it('should delete configuration on confirm and redirect to mcps list', async () => {
      const user = userEvent.setup();
      mockUseMcpConfiguration.mockReturnValue({
        data: { configuration: MOCK_SAVED_CONFIGURATION },
        loading: false,
        error: undefined,
      });

      render(<McpDetailPage />);
      await user.click(screen.getByRole('button', { name: /remove configuration/i }));
      await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /confirm/i }));

      expect(mockDeleteConfiguration).toHaveBeenCalledWith({ mcpId: MOCK_MCP_ID });
      expect(mockPush).toHaveBeenCalledWith('/mcps');
    });
  });

  describe('cancel and dirty form guard', () => {
    it('should navigate back immediately when cancel is clicked on a clean form', async () => {
      const user = userEvent.setup();
      render(<McpDetailPage />);

      await user.click(screen.getByRole('button', { name: /^cancel$/i }));
      expect(mockPush).toHaveBeenCalledWith('/mcps');
    });

    it('should show confirmation modal when cancel is clicked on a dirty form', async () => {
      const user = userEvent.setup();
      render(<McpDetailPage />);

      await user.type(screen.getByLabelText(/client id/i), 'dirty-value');
      await user.click(screen.getByRole('button', { name: /^cancel$/i }));

      expect(screen.getByRole('dialog', { name: /discard changes/i })).not.toBeNull();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should show dirty guard when browser back is triggered', async () => {
      const user = userEvent.setup();
      render(<McpDetailPage />);

      await user.type(screen.getByLabelText(/client id/i), 'dirty-value');
      window.dispatchEvent(new PopStateEvent('popstate'));

      expect(screen.getByRole('dialog', { name: /discard changes/i })).not.toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should redirect to login with returnUrl on session timeout', () => {
      mockUseMcp.mockReturnValue({
        data: undefined,
        loading: false,
        error: new UnauthorizedError('Session expired'),
      });

      render(<McpDetailPage />);

      expect(mockReplace).toHaveBeenCalledWith(`/login?returnUrl=${encodeURIComponent('/mcps/mcp-gmail')}`);
    });

    it('should show friendly network error with retry on test failure', async () => {
      const user = userEvent.setup();
      mockTestConnection.mockRejectedValue(new Error('Network error'));

      render(<McpDetailPage />);
      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: /test connection/i }));

      expect(await screen.findByText(NETWORK_ERROR_MESSAGE)).not.toBeNull();
      expect(screen.getByRole('button', { name: /retry/i })).not.toBeNull();
    });

    it('should show error alert and preserve form on network error during save', async () => {
      const user = userEvent.setup();
      mockSaveConfiguration.mockRejectedValue(new Error('Network error'));

      render(<McpDetailPage />);
      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: /test connection/i }));
      await screen.findByText(new RegExp(CONNECTION_VERIFIED_MESSAGE, 'i'));
      await user.click(screen.getByRole('button', { name: /save configuration/i }));

      expect(await screen.findByText(NETWORK_ERROR_MESSAGE)).not.toBeNull();
      expect(screen.getByLabelText(/client id/i)).toHaveValue('new-client-id');
    });

    it('should retain existing secret when password field is left blank on update', async () => {
      const user = userEvent.setup();
      mockUseMcp.mockReturnValue({
        data: { mcp: MOCK_MCP_CONFIGURED },
        loading: false,
        error: undefined,
      });
      mockUseMcpConfiguration.mockReturnValue({
        data: { configuration: MOCK_SAVED_CONFIGURATION },
        loading: false,
        error: undefined,
      });

      render(<McpDetailPage />);
      await user.click(screen.getByRole('button', { name: /test connection/i }));
      await screen.findByText(new RegExp(CONNECTION_VERIFIED_MESSAGE, 'i'));
      await user.click(screen.getByRole('button', { name: /save configuration/i }));

      expect(mockUpdateConfiguration).toHaveBeenCalledWith(
        expect.objectContaining({
          mcpId: MOCK_MCP_ID,
          fieldValues: expect.not.objectContaining({ clientSecret: expect.any(String) }),
        }),
      );
    });

    it('should show empty form with Pending status when MCP has no saved config', () => {
      render(<McpDetailPage />);

      expect(screen.getByLabelText(/status: pending/i)).not.toBeNull();
      expect(screen.getByLabelText(/client id/i)).toHaveValue('');
    });
  });

  describe('hook calls', () => {
    it('should call useMcp with mcpId and render header data', () => {
      render(<McpDetailPage />);

      expect(mockUseMcp).toHaveBeenCalledWith(MOCK_MCP_ID);
      expect(screen.getByRole('heading', { name: /gmail mcp/i })).not.toBeNull();
    });

    it('should call useMcpConfiguration with mcpId and pre-fill form', () => {
      mockUseMcpConfiguration.mockReturnValue({
        data: { configuration: MOCK_SAVED_CONFIGURATION },
        loading: false,
        error: undefined,
      });

      render(<McpDetailPage />);

      expect(mockUseMcpConfiguration).toHaveBeenCalledWith(MOCK_MCP_ID);
      expect(screen.getByLabelText(/client id/i)).toHaveValue('saved-client-id');
    });

    it('should call useTestMcpConnection when test button is clicked', async () => {
      const user = userEvent.setup();
      render(<McpDetailPage />);
      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: /test connection/i }));

      expect(mockUseTestMcpConnection).toHaveBeenCalled();
      expect(mockTestConnection).toHaveBeenCalled();
    });

    it('should call useSaveMcpConfiguration for new configuration', async () => {
      const user = userEvent.setup();
      render(<McpDetailPage />);
      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: /test connection/i }));
      await screen.findByText(new RegExp(CONNECTION_VERIFIED_MESSAGE, 'i'));
      await user.click(screen.getByRole('button', { name: /save configuration/i }));

      expect(mockUseSaveMcpConfiguration).toHaveBeenCalled();
      expect(mockSaveConfiguration).toHaveBeenCalled();
    });

    it('should call useUpdateMcpConfiguration for existing configuration', async () => {
      const user = userEvent.setup();
      mockUseMcpConfiguration.mockReturnValue({
        data: { configuration: MOCK_SAVED_CONFIGURATION },
        loading: false,
        error: undefined,
      });

      render(<McpDetailPage />);
      await user.click(screen.getByRole('button', { name: /test connection/i }));
      await screen.findByText(new RegExp(CONNECTION_VERIFIED_MESSAGE, 'i'));
      await user.click(screen.getByRole('button', { name: /save configuration/i }));

      expect(mockUseUpdateMcpConfiguration).toHaveBeenCalled();
      expect(mockUpdateConfiguration).toHaveBeenCalled();
    });

    it('should call useDeleteMcpConfiguration when delete is confirmed', async () => {
      const user = userEvent.setup();
      mockUseMcpConfiguration.mockReturnValue({
        data: { configuration: MOCK_SAVED_CONFIGURATION },
        loading: false,
        error: undefined,
      });

      render(<McpDetailPage />);
      await user.click(screen.getByRole('button', { name: /remove configuration/i }));
      await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /confirm/i }));

      expect(mockUseDeleteMcpConfiguration).toHaveBeenCalled();
      expect(mockDeleteConfiguration).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should associate form labels with input fields', () => {
      render(<McpDetailPage />);

      expect(screen.getByLabelText(/client id/i)).toHaveAttribute('id');
      expect(screen.getByLabelText(/client secret/i)).toHaveAccessibleName(/client secret/i);
    });

    it('should announce validation errors to screen readers via aria-live', async () => {
      const user = userEvent.setup();
      render(<McpDetailPage />);

      const clientIdField = screen.getByLabelText(/client id/i);
      await user.click(clientIdField);
      await user.tab();

      const liveRegion = await screen.findByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveTextContent(/client id is required/i);
    });

    it('should move focus into modal on open and restore focus on close', async () => {
      const user = userEvent.setup();
      render(<McpDetailPage />);

      const cancelButton = screen.getByRole('button', { name: /^cancel$/i });
      await user.type(screen.getByLabelText(/client id/i), 'dirty-value');
      await user.click(cancelButton);

      const dialog = screen.getByRole('dialog', { name: /discard changes/i });
      const confirmButton = within(dialog).getByRole('button', { name: /stay/i });
      expect(confirmButton).toHaveFocus();

      await user.click(confirmButton);
      expect(cancelButton).toHaveFocus();
    });
  });

  describe('responsive design', () => {
    it('should adapt layout for mobile viewport under 768px', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        configurable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query.includes('max-width: 767px'),
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
          dispatchEvent: vi.fn(),
          onchange: null,
        })),
      });

      render(<McpDetailPage />);

      expect(screen.getByTestId('mcp-detail-mobile-layout')).toHaveAttribute('data-layout', 'mobile');
    });

    it('should use touch-friendly sizing for buttons and inputs on small screens', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        configurable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query.includes('max-width: 767px'),
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
          dispatchEvent: vi.fn(),
          onchange: null,
        })),
      });

      render(<McpDetailPage />);

      expect(screen.getByRole('button', { name: /test connection/i })).toHaveClass('touchTarget');
      expect(screen.getByLabelText(/client id/i)).toHaveClass('touchTarget');
    });
  });
});
