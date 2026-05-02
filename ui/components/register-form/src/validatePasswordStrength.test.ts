import { describe, it, expect } from 'vitest';
import { validatePasswordStrength } from './validatePasswordStrength';

describe('validatePasswordStrength', () => {
  it('should return weak with no criteria satisfied when password is empty', () => {
    const result = validatePasswordStrength('');
    expect(result.level).toBe('weak');
    expect(result.hasMinLength).toBe(false);
    expect(result.hasUppercase).toBe(false);
    expect(result.hasLowercase).toBe(false);
    expect(result.hasNumber).toBe(false);
    expect(result.hasSpecialChar).toBe(false);
  });

  it('should return weak when password is shorter than eight characters regardless of character classes', () => {
    const result = validatePasswordStrength('Ab1!');
    expect(result.level).toBe('weak');
    expect(result.hasMinLength).toBe(false);
  });

  it('should mark minimum length met for eight or more characters', () => {
    const result = validatePasswordStrength('abcdefgh');
    expect(result.hasMinLength).toBe(true);
  });

  it('should return fair when eight lowercase letters only', () => {
    const result = validatePasswordStrength('abcdefgh');
    expect(result.level).toBe('fair');
    expect(result.hasMinLength).toBe(true);
    expect(result.hasLowercase).toBe(true);
    expect(result.hasUppercase).toBe(false);
    expect(result.hasNumber).toBe(false);
    expect(result.hasSpecialChar).toBe(false);
  });

  it('should return fair when eight digits only', () => {
    const result = validatePasswordStrength('12345678');
    expect(result.level).toBe('fair');
    expect(result.hasNumber).toBe(true);
    expect(result.hasLowercase).toBe(false);
    expect(result.hasUppercase).toBe(false);
    expect(result.hasSpecialChar).toBe(false);
  });

  it('should return fair when length is met and exactly two character classes are present', () => {
    const result = validatePasswordStrength('Abcdefgh');
    expect(result.level).toBe('fair');
    expect(result.hasUppercase).toBe(true);
    expect(result.hasLowercase).toBe(true);
    expect(result.hasNumber).toBe(false);
    expect(result.hasSpecialChar).toBe(false);
  });

  it('should return good when length is met and three character classes are present', () => {
    const result = validatePasswordStrength('Abcdef1h');
    expect(result.level).toBe('good');
    expect(result.hasUppercase).toBe(true);
    expect(result.hasLowercase).toBe(true);
    expect(result.hasNumber).toBe(true);
    expect(result.hasSpecialChar).toBe(false);
  });

  it('should return strong when length is met and all four character classes are present', () => {
    const result = validatePasswordStrength('Abcdef1!');
    expect(result.level).toBe('strong');
    expect(result.hasUppercase).toBe(true);
    expect(result.hasLowercase).toBe(true);
    expect(result.hasNumber).toBe(true);
    expect(result.hasSpecialChar).toBe(true);
  });

  it('should detect uppercase letters only in ASCII range by default', () => {
    const result = validatePasswordStrength('ABCDEFGH');
    expect(result.hasUppercase).toBe(true);
    expect(result.hasLowercase).toBe(false);
  });

  it('should detect lowercase letters in mixed eight-character password', () => {
    const result = validatePasswordStrength('abcdeFGH');
    expect(result.hasLowercase).toBe(true);
    expect(result.hasUppercase).toBe(true);
  });

  it('should detect numeric digits', () => {
    const result = validatePasswordStrength('abcdefg1');
    expect(result.hasNumber).toBe(true);
  });

  it('should detect common special characters', () => {
    const result = validatePasswordStrength('abcdefgh!');
    expect(result.hasSpecialChar).toBe(true);
  });

  it('should return weak when length is met but zero character classes match beyond length', () => {
    const result = validatePasswordStrength('        ');
    expect(result.hasMinLength).toBe(true);
    expect(result.level).toBe('weak');
    expect(result.hasLowercase).toBe(false);
    expect(result.hasUppercase).toBe(false);
    expect(result.hasNumber).toBe(false);
    expect(result.hasSpecialChar).toBe(false);
  });

  it('should classify long passwords with all classes as strong', () => {
    const long = `${'a'.repeat(120)}B1!`;
    const result = validatePasswordStrength(long);
    expect(result.level).toBe('strong');
    expect(result.hasMinLength).toBe(true);
  });

  it('should not downgrade strength for very long passwords that satisfy all rules', () => {
    const longStrong = `${'x'.repeat(500)}YZ9@`;
    const result = validatePasswordStrength(longStrong);
    expect(result.level).toBe('strong');
  });

  it('should return weak when only special characters are present but length is below eight', () => {
    const result = validatePasswordStrength('!@#$%');
    expect(result.level).toBe('weak');
    expect(result.hasMinLength).toBe(false);
    expect(result.hasSpecialChar).toBe(true);
  });

  it('should return weak when uppercase and numbers are present but length is below eight', () => {
    const result = validatePasswordStrength('AB12');
    expect(result.level).toBe('weak');
    expect(result.hasMinLength).toBe(false);
    expect(result.hasUppercase).toBe(true);
    expect(result.hasNumber).toBe(true);
  });

  it('should return good when lowercase number and special are present with length eight', () => {
    const result = validatePasswordStrength('abcdef1!');
    expect(result.level).toBe('good');
    expect(result.hasLowercase).toBe(true);
    expect(result.hasNumber).toBe(true);
    expect(result.hasSpecialChar).toBe(true);
    expect(result.hasUppercase).toBe(false);
  });
});
