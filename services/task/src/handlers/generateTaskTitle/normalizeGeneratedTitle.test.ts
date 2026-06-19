import { describe, expect, it } from 'vitest';

import { normalizeGeneratedTitle } from './normalizeGeneratedTitle';

describe('normalizeGeneratedTitle', () => {
  it('should return valid normalized title when trailing punctuation is stripped', () => {
    const result = normalizeGeneratedTitle({ rawOutput: 'Quarterly sales report.' });

    expect(result).toEqual({ isValid: true, title: 'Quarterly sales report' });
  });

  it('should return valid normalized title when multiple trailing punctuation is stripped', () => {
    const result = normalizeGeneratedTitle({ rawOutput: 'Title!!!' });

    expect(result).toEqual({ isValid: true, title: 'Title' });
  });

  it('should return first line only when raw output contains multiple lines', () => {
    const result = normalizeGeneratedTitle({ rawOutput: 'Line one\nLine two' });

    expect(result).toEqual({ isValid: true, title: 'Line one' });
  });

  it('should strip surrounding double quotes when present', () => {
    const result = normalizeGeneratedTitle({ rawOutput: '"Board report"' });

    expect(result).toEqual({ isValid: true, title: 'Board report' });
  });

  it('should strip surrounding single quotes when present', () => {
    const result = normalizeGeneratedTitle({ rawOutput: "'Dentist appointment'" });

    expect(result).toEqual({ isValid: true, title: 'Dentist appointment' });
  });

  it('should return invalid_output when word count exceeds eight', () => {
    const result = normalizeGeneratedTitle({
      rawOutput: 'This is a very long title that exceeds the maximum',
    });

    expect(result).toEqual({ isValid: false, reason: 'invalid_output' });
  });

  it('should return empty_output when raw output is only whitespace', () => {
    const result = normalizeGeneratedTitle({ rawOutput: '   ' });

    expect(result).toEqual({ isValid: false, reason: 'empty_output' });
  });

  it('should return empty_output when raw output is only punctuation', () => {
    const result = normalizeGeneratedTitle({ rawOutput: '...' });

    expect(result).toEqual({ isValid: false, reason: 'empty_output' });
  });

  it('should return valid when word count is exactly eight', () => {
    const result = normalizeGeneratedTitle({
      rawOutput: 'One two three four five six seven eight',
    });

    expect(result).toEqual({
      isValid: true,
      title: 'One two three four five six seven eight',
    });
  });

  it('should return valid normalized title when input is a single word', () => {
    const result = normalizeGeneratedTitle({ rawOutput: 'Title' });

    expect(result).toEqual({ isValid: true, title: 'Title' });
  });

  it('should strip quotes and trailing punctuation when both are present', () => {
    const result = normalizeGeneratedTitle({ rawOutput: '"Board review."' });

    expect(result).toEqual({ isValid: true, title: 'Board review' });
  });

  it('should trim leading and trailing whitespace without compressing internal spaces', () => {
    const result = normalizeGeneratedTitle({ rawOutput: '  Title   with   spaces  ' });

    expect(result).toEqual({ isValid: true, title: 'Title   with   spaces' });
  });
});
