import { CommonError, ErrorTypes, InternalError } from '@vassembly/errors';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { UseApolloMutationState } from '../graphql/types';
import { useHttpMutation } from './useHttpMutation';

interface TestData {
  result: { success: boolean };
}

interface TestVariables {
  input: { id: string };
}

interface TestBody {
  id: string;
}

interface TestHttpResponse {
  success: boolean;
}

const hoisted = vi.hoisted(() => ({
  post: vi.fn(),
  patch: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('./useHttpClient', () => ({
  useHttpClient: () => ({
    post: hoisted.post,
    patch: hoisted.patch,
    put: hoisted.put,
    delete: hoisted.delete,
    get: vi.fn(),
  }),
}));

describe('useHttpMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call endpoint and return mapped data on success', async () => {
    hoisted.post.mockResolvedValue({ success: true });

    const { result } = renderHook(() =>
      useHttpMutation<TestData, TestVariables, TestBody, TestHttpResponse>({
        path: '/test/endpoint',
        method: 'post',
        withAuth: true,
        mapVariablesToBody: (vars) => ({ id: vars?.input.id ?? '' }),
        mapResponse: (res) => ({ result: res }),
        internalErrorMessage: 'Test failed',
      }),
    );

    let mutateResult: TestData | undefined;
    await act(async () => {
      mutateResult = await result.current.mutate({ input: { id: '123' } });
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toEqual({ result: { success: true } });
      expect(mutateResult).toEqual({ result: { success: true } });
    });

    expect(hoisted.post).toHaveBeenCalledWith({
      path: '/test/endpoint',
      body: { id: '123' },
      withAuth: true,
    });
  });

  it('should handle CommonError correctly', async () => {
    const error = new CommonError(400, ErrorTypes.INTERNAL_ERROR, 'Test error');
    hoisted.post.mockRejectedValue(error);

    const { result } = renderHook(() =>
      useHttpMutation<TestData, TestVariables, TestBody, TestHttpResponse>({
        path: '/test/endpoint',
        method: 'post',
        mapVariablesToBody: (vars) => ({ id: vars?.input.id ?? '' }),
        mapResponse: (res) => ({ result: res }),
        internalErrorMessage: 'Test failed',
      }),
    );

    let mutateResult: TestData | undefined;
    await act(async () => {
      mutateResult = await result.current.mutate({ input: { id: '123' } });
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(error);
      expect(mutateResult).toBeUndefined();
    });
  });

  it('should wrap unknown errors in InternalError', async () => {
    const originalError = new Error('Unknown error');
    hoisted.post.mockRejectedValue(originalError);

    const { result } = renderHook(() =>
      useHttpMutation<TestData, TestVariables, TestBody, TestHttpResponse>({
        path: '/test/endpoint',
        method: 'post',
        mapVariablesToBody: (vars) => ({ id: vars?.input.id ?? '' }),
        mapResponse: (res) => ({ result: res }),
        internalErrorMessage: 'Custom error message',
      }),
    );

    await act(async () => {
      await result.current.mutate({ input: { id: '123' } });
    });

    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(InternalError);
      expect(result.current.error?.message).toBe('Custom error message');
    });
  });

  it('should skip request when mapVariablesToBody returns undefined', async () => {
    const { result } = renderHook(() =>
      useHttpMutation<TestData, TestVariables, TestBody, TestHttpResponse>({
        path: '/test/endpoint',
        method: 'post',
        mapVariablesToBody: () => undefined,
        mapResponse: (res) => ({ result: res }),
        internalErrorMessage: 'Test failed',
      }),
    );

    let mutateResult: TestData | undefined;
    await act(async () => {
      mutateResult = await result.current.mutate({ input: { id: '123' } });
    });

    expect(hoisted.post).not.toHaveBeenCalled();
    expect(mutateResult).toBeUndefined();
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeUndefined();
  });

  it('should clear error on new request', async () => {
    const error = new CommonError(400, ErrorTypes.INTERNAL_ERROR, 'First error');
    hoisted.post.mockRejectedValueOnce(error).mockResolvedValueOnce({ success: true });

    const { result } = renderHook(() =>
      useHttpMutation<TestData, TestVariables, TestBody, TestHttpResponse>({
        path: '/test/endpoint',
        method: 'post',
        mapVariablesToBody: (vars) => ({ id: vars?.input.id ?? '' }),
        mapResponse: (res) => ({ result: res }),
        internalErrorMessage: 'Test failed',
      }),
    );

    await act(async () => {
      await result.current.mutate({ input: { id: '123' } });
    });

    await waitFor(() => {
      expect(result.current.error).toBe(error);
    });

    await act(async () => {
      await result.current.mutate({ input: { id: '456' } });
    });

    await waitFor(() => {
      expect(result.current.error).toBeUndefined();
      expect(result.current.data).toEqual({ result: { success: true } });
    });
  });

  it('should use patch method when specified', async () => {
    hoisted.patch.mockResolvedValue({ success: true });

    const { result } = renderHook(() =>
      useHttpMutation<TestData, TestVariables, TestBody, TestHttpResponse>({
        path: '/test/endpoint',
        method: 'patch',
        mapVariablesToBody: (vars) => ({ id: vars?.input.id ?? '' }),
        mapResponse: (res) => ({ result: res }),
        internalErrorMessage: 'Test failed',
      }),
    );

    await act(async () => {
      await result.current.mutate({ input: { id: '123' } });
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(hoisted.patch).toHaveBeenCalledWith({
      path: '/test/endpoint',
      body: { id: '123' },
      withAuth: undefined,
    });
  });

  it('should clear data and error on reset', async () => {
    hoisted.post.mockResolvedValue({ success: true });

    const { result } = renderHook(() =>
      useHttpMutation<TestData, TestVariables, TestBody, TestHttpResponse>({
        path: '/test/endpoint',
        method: 'post',
        mapVariablesToBody: (vars) => ({ id: vars?.input.id ?? '' }),
        mapResponse: (res) => ({ result: res }),
        internalErrorMessage: 'Test failed',
      }),
    );

    await act(async () => {
      await result.current.mutate({ input: { id: '123' } });
    });

    await waitFor(() => {
      expect(result.current.data).toEqual({ result: { success: true } });
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeUndefined();
  });

  it('should default to POST method', async () => {
    hoisted.post.mockResolvedValue({ success: true });

    const { result } = renderHook(() =>
      useHttpMutation<TestData, TestVariables, TestBody, TestHttpResponse>({
        path: '/test/endpoint',
        mapVariablesToBody: (vars) => ({ id: vars?.input.id ?? '' }),
        mapResponse: (res) => ({ result: res }),
        internalErrorMessage: 'Test failed',
      }),
    );

    await act(async () => {
      await result.current.mutate({ input: { id: '123' } });
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(hoisted.post).toHaveBeenCalled();
  });

  it('should pass query and headers to HTTP client', async () => {
    hoisted.post.mockResolvedValue({ success: true });

    const { result } = renderHook(() =>
      useHttpMutation<TestData, TestVariables, TestBody, TestHttpResponse>({
        path: '/test/endpoint',
        method: 'post',
        query: { filter: 'active' },
        headers: { 'X-Custom': 'value' },
        mapVariablesToBody: (vars) => ({ id: vars?.input.id ?? '' }),
        mapResponse: (res) => ({ result: res }),
        internalErrorMessage: 'Test failed',
      }),
    );

    await act(async () => {
      await result.current.mutate({ input: { id: '123' } });
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(hoisted.post).toHaveBeenCalledWith({
      path: '/test/endpoint',
      body: { id: '123' },
      query: { filter: 'active' },
      headers: { 'X-Custom': 'value' },
      withAuth: undefined,
    });
  });

  it('should return UseApolloMutationState shape with all required properties', async () => {
    hoisted.post.mockResolvedValue({ success: true });

    const { result } = renderHook(() =>
      useHttpMutation<TestData, TestVariables, TestBody, TestHttpResponse>({
        path: '/test/endpoint',
        method: 'post',
        mapVariablesToBody: (vars) => ({ id: vars?.input.id ?? '' }),
        mapResponse: (res) => ({ result: res }),
        internalErrorMessage: 'Test failed',
      }),
    );

    const state: UseApolloMutationState<TestData, TestVariables> = result.current;

    expect(state).toHaveProperty('mutate');
    expect(state).toHaveProperty('isLoading');
    expect(state).toHaveProperty('error');
    expect(state).toHaveProperty('data');
    expect(state).toHaveProperty('reset');

    expect(typeof state.mutate).toBe('function');
    expect(typeof state.reset).toBe('function');
    expect(typeof state.isLoading).toBe('boolean');
  });
});
