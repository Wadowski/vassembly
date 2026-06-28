import type { FormatCurrentDateTimeSectionParams } from './types';

export const CURRENT_DATE_TIME_SECTION_HEADING = '## Current Date & Time';

const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const pad = (value: number): string => String(value).padStart(2, '0');

export const formatCurrentDateTimeSection = ({
  now = new Date(),
}: FormatCurrentDateTimeSectionParams = {}): string => {
  const day = DAYS[now.getUTCDay()];
  const month = MONTHS[now.getUTCMonth()];
  const date = now.getUTCDate();
  const year = now.getUTCFullYear();
  const hours = pad(now.getUTCHours());
  const minutes = pad(now.getUTCMinutes());

  return `${CURRENT_DATE_TIME_SECTION_HEADING}\n${day}, ${month} ${date}, ${year} · ${hours}:${minutes} UTC`;
};
