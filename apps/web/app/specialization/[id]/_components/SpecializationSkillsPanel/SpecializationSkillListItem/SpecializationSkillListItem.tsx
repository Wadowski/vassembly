'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useArchiveSkill, useUpdateSkill } from '@vassembly/ui-api-hooks';
import { Button } from '@vassembly/ui-system-design/button';
import { Switch } from '@vassembly/ui-system-design/switch';
import { Text } from '@vassembly/ui-system-design/text';

import { SkillArchiveDialog } from '../SkillArchiveDialog/SkillArchiveDialog';
import styles from './SpecializationSkillListItem.module.scss';
import type { SpecializationSkillListItemProps } from '../types';

const DESCRIPTION_MAX_LENGTH = 120;

const truncateDescription = (description: string): string => {
  if (description.length <= DESCRIPTION_MAX_LENGTH) {
    return description;
  }

  return `${description.slice(0, DESCRIPTION_MAX_LENGTH).trimEnd()}…`;
};

export const SpecializationSkillListItem = ({
  skill,
  specializationId,
  onSkillUpdated,
  onSkillArchived,
}: SpecializationSkillListItemProps): JSX.Element => {
  const router = useRouter();
  const { mutate: updateSkill, isLoading: isUpdating } = useUpdateSkill();
  const { mutate: archiveSkill, isLoading: isArchiving } = useArchiveSkill();
  const [enabled, setEnabled] = useState(skill.enabled);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const detailHref = `/specialization/${specializationId}/skills/${skill.id}`;
  const editHref = `/specialization/${specializationId}/skills/${skill.id}/edit`;

  const handleToggle = async (nextEnabled: boolean): Promise<void> => {
    const previousEnabled = enabled;
    setEnabled(nextEnabled);

    try {
      await updateSkill({
        skillId: skill.id,
        body: { enabled: nextEnabled },
      });
      onSkillUpdated?.();
    } catch {
      setEnabled(previousEnabled);
    }
  };

  const handleArchive = async (): Promise<void> => {
    await archiveSkill({ skillId: skill.id });
    onSkillArchived?.();
  };

  return (
    <div className={styles.row} data-enabled={enabled}>
      <Link href={detailHref} className={styles.contentLink} aria-label={`View skill ${skill.name}`}>
        <div className={styles.content}>
          <Text variant="body1" className={styles.name}>
            {skill.name}
          </Text>
          {skill.description !== '' ? (
            <Text variant="body2" className={styles.description}>
              {truncateDescription(skill.description)}
            </Text>
          ) : null}
        </div>
      </Link>
      <div className={styles.actions}>
        <Button
          variant="outlined"
          size="small"
          text="Edit"
          isDisabled={isUpdating || isArchiving}
          onClick={() => {
            router.push(editHref);
          }}
        />
        <Button
          variant="outlined"
          color="danger"
          size="small"
          text={`Archive`}
          aria-label={`Archive skill ${skill.name}`}
          isDisabled={isUpdating || isArchiving}
          onClick={() => {
            setArchiveOpen(true);
          }}
        />
        <Switch
          isChecked={enabled}
          label={enabled ? 'Enabled' : 'Disabled'}
          isDisabled={isUpdating || isArchiving}
          onChange={(nextChecked) => {
            void handleToggle(nextChecked);
          }}
        />
      </div>
      <SkillArchiveDialog
        name={skill.name}
        open={archiveOpen}
        onClose={() => {
          setArchiveOpen(false);
        }}
        onConfirm={handleArchive}
        isConfirmBusy={isArchiving}
      />
    </div>
  );
};
