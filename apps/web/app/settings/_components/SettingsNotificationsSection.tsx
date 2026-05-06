'use client';

import { Alert } from '@vassembly/ui-alert';
import { Switch } from '@vassembly/ui-switch';
import { Text } from '@vassembly/ui-text';
import { useSearchParams } from 'next/navigation';

import {
  SHOULD_SHOW_NOTIFICATION_CHANNEL_PUSH,
  SHOULD_SHOW_NOTIFICATION_CHANNEL_SMS,
} from '../featureVisibility';
import { useNotificationPreferences } from '../../../lib/preferences';
import styles from '../SettingsSections.module.scss';

interface SettingsNotificationsSectionProps {
  subjectUserId: string;
}

export const SettingsNotificationsSection = ({
  subjectUserId,
}: SettingsNotificationsSectionProps): JSX.Element => {
  const searchParameters = useSearchParams();
  const requestedCategoryId = searchParameters.get('category');
  const {
    masterEnabled,
    categories,
    channels,
    update,
    isLoading,
    error,
    visibleCategories,
  } = useNotificationPreferences(subjectUserId);

  const visibleCategoryIdList = visibleCategories.map((definition) => definition.id);
  const shouldSurfaceRoleGap =
    typeof requestedCategoryId === 'string' &&
    requestedCategoryId.length > 0 &&
    !visibleCategoryIdList.includes(requestedCategoryId);

  return (
    <section id="notifications" className={styles.sectionCard}>
      <Text variant="h2">Notifications</Text>
      {error ? (
        <Alert variant="warning" message={`Local notifications preference issue: ${error}`} />
      ) : null}
      {shouldSurfaceRoleGap ? (
        <Alert
          variant="info"
          message="That notification category is not available for your role."
        />
      ) : null}
      <div className={styles.preferenceStack}>
        <Switch
          label="In-app notifications (master)"
          helperText="Turn off to silence every category tied to your role."
          isChecked={masterEnabled}
          isDisabled={isLoading}
          onChange={(nextToggle) => {
            update.setMasterEnabled(nextToggle);
          }}
        />

        <Text variant="h3">Categories</Text>
        {visibleCategories.map((definitionRecord) => (
          <Switch
            key={definitionRecord.id}
            label={definitionRecord.label}
            isChecked={categories[definitionRecord.id] ?? true}
            isDisabled={isLoading || !masterEnabled}
            onChange={(nextCategoryState) => {
              update.setCategory(definitionRecord.id, nextCategoryState);
            }}
          />
        ))}

        <Text variant="h3">Delivery channels</Text>
        <Switch
          label="In-app banners"
          isChecked={channels.inApp}
          isDisabled={isLoading || !masterEnabled}
          onChange={(nextChannelState) => {
            update.setChannel('inApp', nextChannelState);
          }}
        />
        <Switch
          label="Email"
          isChecked={channels.email}
          isDisabled={isLoading || !masterEnabled}
          onChange={(nextChannelState) => {
            update.setChannel('email', nextChannelState);
          }}
        />
        {SHOULD_SHOW_NOTIFICATION_CHANNEL_PUSH ? (
          <Switch
            label="Push"
            isChecked={channels.push}
            isDisabled={isLoading || !masterEnabled}
            onChange={(nextChannelState) => {
              update.setChannel('push', nextChannelState);
            }}
          />
        ) : null}
        {SHOULD_SHOW_NOTIFICATION_CHANNEL_SMS ? (
          <Switch
            label="SMS"
            isChecked={channels.sms}
            isDisabled={isLoading || !masterEnabled}
            onChange={(nextChannelState) => {
              update.setChannel('sms', nextChannelState);
            }}
          />
        ) : null}
      </div>
    </section>
  );
};
