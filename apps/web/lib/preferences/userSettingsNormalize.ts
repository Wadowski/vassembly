import { z } from 'zod';

import type { UserSettingsV1 } from './types';

const STORED_SETTINGS_SCHEMA = z.object({
  schemaVersion: z.literal(1),
  notifications: z.object({
    masterEnabled: z.boolean(),
    categories: z.record(z.string(), z.boolean()),
    channels: z.object({
      inApp: z.boolean(),
      email: z.boolean(),
      push: z.boolean(),
      sms: z.boolean(),
    }),
  }),
  privacy: z.object({
    analyticsEnabled: z.boolean(),
    crashReportingEnabled: z.boolean(),
    marketingOptIn: z.boolean(),
  }),
});

export const parseStoredUserSettingsJson = ({
  rawJson,
}: {
  rawJson: string;
}): UserSettingsV1 | null => {
  try {
    const parsedUnknown = JSON.parse(rawJson) as unknown;
    const parsed = STORED_SETTINGS_SCHEMA.safeParse(parsedUnknown);
    if (!parsed.success) {
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
};
