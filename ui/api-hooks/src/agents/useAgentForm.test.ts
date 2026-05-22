import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AgentCategory, AgentStatus } from './types';
import { useAgentForm } from './useAgentForm';

describe('useAgentForm', () => {
  it('should validate required fields before callers submit mutations', () => {
    const { result } = renderHook(() =>
      useAgentForm({
        name: '',
        category: '',
        description: '',
        rule: '',
      }),
    );

    let valid = true;

    act(() => {
      valid = result.current.validate();
    });

    expect(valid).toBe(false);
    expect(result.current.fieldErrors.name).toBe('Name is required.');
    expect(result.current.fieldErrors.category).toBe('Category is required.');
    expect(result.current.fieldErrors.description).toBe('Description is required.');
    expect(result.current.fieldErrors.rule).toBe('Rule is required.');
  });

  it('should enforce upper bounds that mirror PRD copy limits', () => {
    const { result } = renderHook(() =>
      useAgentForm({
        name: 'x'.repeat(101),
        category: AgentCategory.Coding,
        description: 'd'.repeat(501),
        rule: 'r'.repeat(2001),
      }),
    );

    let valid = true;

    act(() => {
      valid = result.current.validate();
    });

    expect(valid).toBe(false);
    expect(result.current.fieldErrors.name).toBe('Name must be at most 100 characters.');
    expect(result.current.fieldErrors.description).toBe('Description must be at most 500 characters.');
    expect(result.current.fieldErrors.rule).toBe('Rule must be at most 2000 characters.');
  });

  it('should track controlled field updates for downstream mutation payloads', () => {
    const { result } = renderHook(() =>
      useAgentForm({
        name: 'Initial',
        category: AgentCategory.Personal,
        description: 'Hello',
        rule: 'Work hard',
      }),
    );

    act(() => {
      result.current.setField('name', 'Renamed');
    });

    expect(result.current.values.name).toBe('Renamed');

    act(() => {
      result.current.reset({
        name: '',
        category: '',
        description: '',
        rule: '',
      });
    });

    expect(result.current.values.name).toBe('');
  });

  it('should clear validation errors once inputs satisfy schema constraints', () => {
    const { result } = renderHook(() =>
      useAgentForm({
        name: '',
        category: '',
        description: '',
        rule: '',
      }),
    );

    act(() => {
      result.current.validate();
    });

    expect(result.current.fieldErrors.name).toBeDefined();

    act(() => {
      result.current.setField('name', 'Good Name');
      result.current.setField('category', AgentCategory.Coding);
      result.current.setField('description', 'Good description');
      result.current.setField('rule', 'Good rule');
    });

    let valid = false;

    act(() => {
      valid = result.current.validate();
    });

    expect(valid).toBe(true);
    expect(Object.keys(result.current.fieldErrors)).toHaveLength(0);
  });
});
