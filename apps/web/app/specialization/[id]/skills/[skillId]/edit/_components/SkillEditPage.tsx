'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useSkill, useSpecialization, useUpdateSkill } from '@vassembly/ui-api-hooks';
import { Loader } from '@vassembly/ui-system-design/loader';
import { Text } from '@vassembly/ui-system-design/text';

import { fetchSkillScriptContent } from '../../../_components/fetchSkillScriptContent';
import { SkillForm, SkillFormMode, useSkillForm } from '../../../_components/SkillForm';
import styles from './SkillEditPage.module.scss';

export const SkillEditPage = (): JSX.Element => {
  const params = useParams();
  const router = useRouter();
  const specializationId = typeof params?.id === 'string' ? params.id : '';
  const skillId = typeof params?.skillId === 'string' ? params.skillId : '';
  const form = useSkillForm();
  const { reset: resetForm } = form;
  const { data: skillData, loading: skillLoading } = useSkill({ skillId });
  const { mutate: updateSkill, isLoading: isSubmitting } = useUpdateSkill();
  const { data: specializationData } = useSpecialization({
    specializationId,
    skip: specializationId === '',
  });
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);
  const [isFormReady, setIsFormReady] = useState(false);

  const skill = skillData?.skill ?? undefined;
  const specializationName = specializationData?.specialization?.name ?? 'specialization';
  const backHref = `/specialization/${specializationId}/skills/${skillId}`;

  useEffect(() => {
    if (skill === undefined) {
      setIsFormReady(false);
      return;
    }

    let cancelled = false;

    const loadScripts = async (): Promise<void> => {
      const scripts = await Promise.all(
        skill.scripts.map(async (script) => {
          try {
            const content = await fetchSkillScriptContent({
              skillId: skill.id,
              filename: script.filename,
            });

            return {
              filename: script.filename,
              language: script.language,
              content,
            };
          } catch {
            return {
              filename: script.filename,
              language: script.language,
              content: '',
            };
          }
        }),
      );

      if (cancelled) {
        return;
      }

      resetForm({
        name: skill.name,
        description: skill.description,
        input: skill.input,
        output: skill.output,
        rule: skill.rule,
        usesSkillIds: skill.usesSkillIds,
        scripts,
      });
      setIsFormReady(true);
    };

    void loadScripts();

    return () => {
      cancelled = true;
    };
  }, [skill, resetForm]);

  const handleSubmit = async (): Promise<void> => {
    setSubmitError(undefined);

    try {
      await updateSkill({
        skillId,
        body: {
          description: form.values.description.trim(),
          input: form.values.input.trim(),
          output: form.values.output.trim(),
          rule: form.values.rule.trim(),
          scripts: form.values.scripts.map((script) => ({
            filename: script.filename.trim(),
            language: script.language,
            content: script.content,
          })),
          usesSkillIds: form.values.usesSkillIds,
        },
      });

      router.push(backHref);
    } catch {
      setSubmitError('Unable to update skill. Please try again.');
    }
  };

  if (skillLoading || !isFormReady) {
    return <Loader ariaLabel="Loading skill" />;
  }

  if (skill === undefined) {
    return (
      <main className={styles.page}>
        <Text variant="body1">Skill not found.</Text>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href={backHref} className={styles.backLink}>
          {`← Back to ${skill.name}`}
        </Link>
        <Text variant="h1" as="h1">
          Edit skill
        </Text>
        <Text variant="body2">{specializationName}</Text>
      </header>
      <SkillForm
        mode={SkillFormMode.Edit}
        form={form}
        specializationId={specializationId}
        excludeSkillId={skillId}
        isSubmitting={isSubmitting}
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
