import { describe, expect, it } from 'vitest';

import {
  CURRENT_DATE_TIME_SECTION_HEADING,
  formatCurrentDateTimeSection,
} from './formatCurrentDateTimeSection';
import { appendCurrentDateTimeSection } from './appendCurrentDateTimeSection';

const FIXED_NOW = new Date('2026-06-28T09:31:00.000Z');

describe('formatCurrentDateTimeSection', () => {
  it('should format UTC date and time with the section heading', () => {
    const result = formatCurrentDateTimeSection({ now: FIXED_NOW });

    expect(result).toBe(
      '## Current Date & Time\nSunday, June 28, 2026 · 09:31 UTC',
    );
    expect(CURRENT_DATE_TIME_SECTION_HEADING).toBe('## Current Date & Time');
  });

  it('should zero-pad single-digit minutes', () => {
    const result = formatCurrentDateTimeSection({
      now: new Date('2026-01-05T14:05:00.000Z'),
    });

    expect(result).toContain('14:05 UTC');
  });
});

describe('appendCurrentDateTimeSection', () => {
  it('should append the datetime section after the system message', () => {
    const result = appendCurrentDateTimeSection({
      systemMessage: 'Base rule.',
      now: FIXED_NOW,
    });

    expect(result).toBe(
      'Base rule.\n\n## Current Date & Time\nSunday, June 28, 2026 · 09:31 UTC',
    );
  });
});
