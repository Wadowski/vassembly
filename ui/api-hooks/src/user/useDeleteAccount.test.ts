import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useDeleteAccount } from './useDeleteAccount';

const hoisted = vi.hoisted(() => ({
  post: vi.fn(),
}));

vi.mock('../http/useHttpClient', () => ({
  useHttpClient: () => ({
    post: hoisted.post,
    get: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  }),
}));

describe('useDeleteAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call delete-account endpoint and expose success data', async () => {
    hoisted.post.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useDeleteAccount());

    await act(async () => {
      await result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toEqual({ deleteAccount: { success: true } });
    });

    expect(hoisted.post).toHaveBeenCalledWith({
      path: '/user/delete-account',
      body: {},
      withAuth: true,
    });
  });
});
