import { describe, it, expect } from 'vitest';
import { validateForgotPasswordForm } from './validateForgotPasswordForm';

describe('validateForgotPasswordForm', () => {
  it('should return valid result for a correct email', () => {
    const result = validateForgotPasswordForm({ email: 'user@example.com' });
    expect(result).toEqual({ isValid: true });
  });

  it('should return error when email is empty', () => {
    const result = validateForgotPasswordForm({ email: '' });
    expect(result.isValid).toBe(false);
    if (result.isValid) {
      throw new Error('expected invalid');
    }
    expect(result.message).toMatch(/email/i);
  });

  it('should return error for invalid email format', () => {
    const result = validateForgotPasswordForm({ email: 'not-an-email' });
    expect(result.isValid).toBe(false);
    if (result.isValid) {
      throw new Error('expected invalid');
    }
    expect(result.message.length).toBeGreaterThan(0);
  });

  it('should return error for email without domain', () => {
    const result = validateForgotPasswordForm({ email: 'user@' });
    expect(result.isValid).toBe(false);
    if (result.isValid) {
      throw new Error('expected invalid');
    }
    expect(result.message.length).toBeGreaterThan(0);
  });

  it('should treat trimmed email as valid when only surrounding whitespace', () => {
    const result = validateForgotPasswordForm({ email: '  user@example.com  ' });
    expect(result).toEqual({ isValid: true });
  });

  it('should return error if email is only whitespace after trimming', () => {
    const result = validateForgotPasswordForm({ email: '   ' });
    expect(result.isValid).toBe(false);
    if (result.isValid) {
      throw new Error('expected invalid');
    }
    expect(result.message.length).toBeGreaterThan(0);
  });
});
