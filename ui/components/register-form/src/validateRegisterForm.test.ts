import { describe, it, expect } from 'vitest';
import { validateRegisterForm } from './validateRegisterForm';

const validStrongPassword = 'Str0ng!Pass';

const baseValidInput = {
  email: 'jane.doe@example.com',
  password: validStrongPassword,
  confirmPassword: validStrongPassword,
  firstName: 'Jane',
  lastName: "O'Brien",
};

describe('validateRegisterForm', () => {
  it('should return valid result when all fields meet requirements including matching strong password', () => {
    const result = validateRegisterForm(baseValidInput);
    expect(result).toEqual({ isValid: true });
  });

  it('should return error when email is empty', () => {
    const result = validateRegisterForm({
      ...baseValidInput,
      email: '',
    });
    expect(result.isValid).toBe(false);
    if (result.isValid) {
      throw new Error('expected invalid');
    }
    expect(result.message).toMatch(/email/i);
  });

  it('should return error for invalid email format', () => {
    const result = validateRegisterForm({
      ...baseValidInput,
      email: 'not-an-email',
    });
    expect(result.isValid).toBe(false);
    if (result.isValid) {
      throw new Error('expected invalid');
    }
    expect(result.message.length).toBeGreaterThan(0);
  });

  it('should return error for email without domain', () => {
    const result = validateRegisterForm({
      ...baseValidInput,
      email: 'user@',
    });
    expect(result.isValid).toBe(false);
    if (result.isValid) {
      throw new Error('expected invalid');
    }
    expect(result.message.length).toBeGreaterThan(0);
  });

  it('should return error when password is empty', () => {
    const result = validateRegisterForm({
      ...baseValidInput,
      password: '',
      confirmPassword: '',
    });
    expect(result.isValid).toBe(false);
    if (result.isValid) {
      throw new Error('expected invalid');
    }
    expect(result.message).toMatch(/password/i);
  });

  it('should return error when password is shorter than minimum length', () => {
    const result = validateRegisterForm({
      ...baseValidInput,
      password: 'Ab1!',
      confirmPassword: 'Ab1!',
    });
    expect(result.isValid).toBe(false);
    if (result.isValid) {
      throw new Error('expected invalid');
    }
    expect(result.message).toMatch(/password|8|length|character/i);
  });

  it('should return error when password does not meet strength requirements', () => {
    const result = validateRegisterForm({
      ...baseValidInput,
      password: 'abcdefgh',
      confirmPassword: 'abcdefgh',
    });
    expect(result.isValid).toBe(false);
    if (result.isValid) {
      throw new Error('expected invalid');
    }
    expect(result.message).toMatch(/password|strength|uppercase|lowercase|number|special/i);
  });

  it('should return error when confirm password is empty', () => {
    const result = validateRegisterForm({
      ...baseValidInput,
      confirmPassword: '',
    });
    expect(result.isValid).toBe(false);
    if (result.isValid) {
      throw new Error('expected invalid');
    }
    expect(result.message).toMatch(/confirm|match|password/i);
  });

  it('should return error when confirm password does not match password', () => {
    const result = validateRegisterForm({
      ...baseValidInput,
      confirmPassword: `${validStrongPassword}x`,
    });
    expect(result.isValid).toBe(false);
    if (result.isValid) {
      throw new Error('expected invalid');
    }
    expect(result.message).toMatch(/match|same|confirm/i);
  });

  it('should return error when first name is empty', () => {
    const result = validateRegisterForm({
      ...baseValidInput,
      firstName: '',
    });
    expect(result.isValid).toBe(false);
    if (result.isValid) {
      throw new Error('expected invalid');
    }
    expect(result.message).toMatch(/first name|first/i);
  });

  it('should return error when first name is only whitespace after trimming', () => {
    const result = validateRegisterForm({
      ...baseValidInput,
      firstName: '   \t  ',
    });
    expect(result.isValid).toBe(false);
    if (result.isValid) {
      throw new Error('expected invalid');
    }
    expect(result.message).toMatch(/first name|first/i);
  });

  it('should return error when last name is empty', () => {
    const result = validateRegisterForm({
      ...baseValidInput,
      lastName: '',
    });
    expect(result.isValid).toBe(false);
    if (result.isValid) {
      throw new Error('expected invalid');
    }
    expect(result.message).toMatch(/last name|last/i);
  });

  it('should return error when last name is only whitespace after trimming', () => {
    const result = validateRegisterForm({
      ...baseValidInput,
      lastName: '   ',
    });
    expect(result.isValid).toBe(false);
    if (result.isValid) {
      throw new Error('expected invalid');
    }
    expect(result.message).toMatch(/last name|last/i);
  });

  it('should treat trimmed email and text fields as valid when only surrounding whitespace', () => {
    const result = validateRegisterForm({
      email: '  jane@example.com  ',
      password: validStrongPassword,
      confirmPassword: validStrongPassword,
      firstName: '  Jane  ',
      lastName: '  Doe  ',
    });
    expect(result).toEqual({ isValid: true });
  });

  it('should allow special characters and unicode in first and last names when non-empty', () => {
    const result = validateRegisterForm({
      ...baseValidInput,
      firstName: "François",
      lastName: '王',
    });
    expect(result).toEqual({ isValid: true });
  });

  it('should return error if email is only whitespace after trimming', () => {
    const result = validateRegisterForm({
      ...baseValidInput,
      email: '     ',
    });
    expect(result.isValid).toBe(false);
    if (result.isValid) {
      throw new Error('expected invalid');
    }
    expect(result.message.length).toBeGreaterThan(0);
  });

  it('should return error if password is only whitespace after trimming', () => {
    const result = validateRegisterForm({
      ...baseValidInput,
      password: '   ',
      confirmPassword: '   ',
    });
    expect(result.isValid).toBe(false);
    if (result.isValid) {
      throw new Error('expected invalid');
    }
    expect(result.message).toMatch(/password/i);
  });
});
