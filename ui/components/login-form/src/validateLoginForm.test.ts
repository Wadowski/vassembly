import { describe, it, expect } from 'vitest';
import { validateLoginForm } from './validateLoginForm';

describe('validateLoginForm', () => {
  it('should return valid result for correct email and non-empty password', () => {
    const result = validateLoginForm({
      email: 'user@example.com',
      password: 'password123',
    });
    expect(result).toEqual({ isValid: true });
  });

  it('should return error when email is empty', () => {
    const result = validateLoginForm({ email: '', password: 'password123' });
    expect(result.isValid).toBe(false);
    if (result.isValid) {
      throw new Error('expected invalid');
    }
    expect(result.message).toMatch(/email/i);
  });

  it('should return error for invalid email format', () => {
    const result = validateLoginForm({ email: 'not-an-email', password: 'password123' });
    expect(result.isValid).toBe(false);
    if (result.isValid) {
      throw new Error('expected invalid');
    }
    expect(result.message).toBeTruthy();
  });

  it('should return error for email without domain', () => {
    const result = validateLoginForm({ email: 'user@', password: 'password123' });
    expect(result.isValid).toBe(false);
    if (result.isValid) {
      throw new Error('expected invalid');
    }
    expect(result.message).toBeTruthy();
  });

  it('should return error when password is empty', () => {
    const result = validateLoginForm({ email: 'user@example.com', password: '' });
    expect(result.isValid).toBe(false);
    if (result.isValid) {
      throw new Error('expected invalid');
    }
    expect(result.message).toMatch(/password/i);
  });

  it('should treat trimmed email and password as valid when only surrounding whitespace', () => {
    const result = validateLoginForm({
      email: '  user@example.com  ',
      password: '  password123  ',
    });
    expect(result).toEqual({ isValid: true });
  });

  it('should return error if email is only whitespace after trimming', () => {
    const result = validateLoginForm({ email: '   ', password: 'password123' });
    expect(result.isValid).toBe(false);
    if (result.isValid) {
      throw new Error('expected invalid');
    }
    expect(result.message).toBeTruthy();
  });

  it('should return error if password is only whitespace after trimming', () => {
    const result = validateLoginForm({ email: 'user@example.com', password: '   ' });
    expect(result.isValid).toBe(false);
    if (result.isValid) {
      throw new Error('expected invalid');
    }
    expect(result.message).toBeTruthy();
  });
});
