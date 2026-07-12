'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

import { ConflictError } from '@vassembly/errors';
import { useCreateSkill, useSpecialization } from '@vassembly/ui-api-hooks';
import { Text } from '@vassembly/ui-text';

import { SkillForm, SkillFormMode, useSkillForm } from '../../_components/SkillForm';
import styles from './SkillCreatePage.module.scss';

export const SkillCreatePage = (): JSX.Element => {
  const params = useParams();
  const router = useRouter();
  const specializationId = typeof params?.id === 'string' ? params.id : '';
  const form = useSkillForm();
  const { mutate: createSkill, isLoading } = useCreateSkill();
  const { data: specializationData } = useSpecialization({
    specializationId,
    skip: specializationId === '',
  });
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);

  const specializationName = specializationData?.specialization?.name ?? 'specialization';
  const backHref = `/specialization/${specializationId}`;

  const handleSubmit = async (): Promise<void> => {
    setSubmitError(undefined);

    try {
      const result = await createSkill({
        body: {
          specializationId,
          name: form.values.name.trim(),
          description: form.values.description.trim(),
          rule: form.values.rule.trim(),
          scripts: form.values.scripts.map((script) => ({
            filename: script.filename.trim(),
            language: script.language,
            content: script.content,
          })),
          usesSkillIds: form.values.usesSkillIds,
        },
      });

      const skillId = result?.skill.id;

      if (skillId !== undefined) {
        router.push(`/specialization/${specializationId}/skills/${skillId}`);
      }
    } catch (error) {
      if (error instanceof ConflictError) {
        setSubmitError('A skill with this name already exists for this specialization.');
        return;
      }

      setSubmitError('Unable to create skill. Please try again.');
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href={backHref} className={styles.backLink}>
          {`← Back to ${specializationName}`}
        </Link>
        <Text variant="h1" as="h1">
          Create skill
        </Text>
      </header>
      <SkillForm
        mode={SkillFormMode.Create}
        form={form}
        specializationId={specializationId}
        isSubmitting={isLoading}
        submitError={submitError}
        onSubmit={() => {
          void handleSubmit();
        }}
        onCancel={() => {
          router.push(backHref);
        }}
      />
    </main>
  );
};
