'use client';

import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useMemo } from 'react';

import { useSkillsBySpecialization } from '@vassembly/ui-api-hooks';
import { Alert } from '@vassembly/ui-system-design/alert';
import { Button } from '@vassembly/ui-system-design/button';
import { Dropdown } from '@vassembly/ui-system-design/dropdown';
import { MultiSelect } from '@vassembly/ui-system-design/multi-select';
import { Text } from '@vassembly/ui-system-design/text';
import { TextField } from '@vassembly/ui-system-design/text-field';

import {
  SKILL_DESCRIPTION_MAX,
  SKILL_RULE_MAX,
  SKILL_RULE_MIN_ROWS,
  SKILL_SCRIPT_CONTENT_MIN_ROWS,
  SKILL_SCRIPT_LANGUAGE_OPTIONS,
  SKILL_SCRIPT_MAX_COUNT,
} from './constants';
import styles from './SkillForm.module.scss';
import { SkillFormMode, type SkillFormProps } from './types';

const SUBMIT_LABEL = {
  [SkillFormMode.Create]: 'Create skill',
  [SkillFormMode.Edit]: 'Save changes',
} as const;

export const SkillForm = ({
  mode,
  form,
  specializationId,
  excludeSkillId,
  isSubmitting = false,
  submitError,
  onSubmit,
  onCancel,
}: SkillFormProps): JSX.Element => {
  const { data: skillsData, execute: fetchSkills } = useSkillsBySpecialization();

  useEffect(() => {
    if (specializationId !== '') {
      void fetchSkills({ specializationId, size: 200 });
    }
  }, [fetchSkills, specializationId]);

  const usesSkillOptions = useMemo(
    () =>
      (skillsData?.items ?? [])
        .filter((skill) => skill.id !== excludeSkillId)
        .map((skill) => ({
          value: skill.id,
          label: skill.name,
        })),
    [excludeSkillId, skillsData?.items],
  );

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault();

    if (!form.validate()) {
      return;
    }

    onSubmit();
  };

  const isNameDisabled = mode === SkillFormMode.Edit || isSubmitting;

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <TextField
        label="Name"
        value={form.values.name}
        errorMessage={form.getFieldErrorMessage('name')}
        isDisabled={isNameDisabled}
        isFullWidth
        onChange={(event: ChangeEvent<HTMLInputElement>) => form.setField('name', event.target.value)}
        onBlur={() => form.blurField('name')}
      />
      <Text variant="body2">
        Hyphenated identifier for this skill. Name cannot be changed after creation.
      </Text>
      <TextField
        label="Description"
        value={form.values.description}
        errorMessage={form.getFieldErrorMessage('description')}
        isDisabled={isSubmitting}
        isFullWidth
        isMultiline
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          form.setField('description', event.target.value)
        }
        onBlur={() => form.blurField('description')}
      />
      <Text variant="body2">{`${form.descriptionCharCount}/${SKILL_DESCRIPTION_MAX}`}</Text>
      <TextField
        label="Rule"
        value={form.values.rule}
        errorMessage={form.getFieldErrorMessage('rule')}
        isDisabled={isSubmitting}
        isFullWidth
        isMultiline
        minRows={SKILL_RULE_MIN_ROWS}
        onChange={(event: ChangeEvent<HTMLInputElement>) => form.setField('rule', event.target.value)}
        onBlur={() => form.blurField('rule')}
      />
      <Text variant="body2">{`${form.ruleCharCount}/${SKILL_RULE_MAX}`}</Text>
      <section className={styles.usesSkillsSection} aria-label="Uses skills">
        <Text variant="h3" as="h3">
          Uses skills
        </Text>
        <Text variant="body2">
          Optional skills this skill composes. Stored by id; names appear in rule directives.
        </Text>
        <MultiSelect
          id="skill-uses-skills"
          placeholder="Select skills"
          options={usesSkillOptions}
          values={form.values.usesSkillIds}
          isDisabled={isSubmitting}
          isFullWidth
          onValuesChange={(values) => form.setField('usesSkillIds', values)}
        />
      </section>
      <section className={styles.scriptsSection} aria-label="Scripts">
        <Text variant="h3" as="h3">
          Scripts
        </Text>
        <Text variant="body2">
          {`Optional script files bundled with this skill (max ${SKILL_SCRIPT_MAX_COUNT}).`}
        </Text>
        {form.values.scripts.map((script, index) => (
          <div key={`script-${index}`} className={styles.scriptCard}>
            <div className={styles.scriptHeader}>
              <Text variant="body1">{`Script ${index + 1}`}</Text>
              <Button
                variant="text"
                text="Remove"
                isDisabled={isSubmitting}
                onClick={() => form.removeScript(index)}
              />
            </div>
            <div className={styles.scriptFields}>
              <TextField
                label="Filename"
                value={script.filename}
                errorMessage={form.getScriptFieldErrorMessage(index, 'filename')}
                isDisabled={isSubmitting}
                isFullWidth
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  form.updateScript(index, { filename: event.target.value })
                }
              />
              <Dropdown
                id={`skill-script-language-${index}`}
                label="Language"
                options={[...SKILL_SCRIPT_LANGUAGE_OPTIONS]}
                value={script.language}
                isDisabled={isSubmitting}
                onValueChange={(value) => {
                  if (value === 'python' || value === 'nodejs' || value === 'bash') {
                    form.updateScript(index, { language: value });
                  }
                }}
              />
              <TextField
                label="Content"
                value={script.content}
                errorMessage={form.getScriptFieldErrorMessage(index, 'content')}
                isDisabled={isSubmitting}
                isFullWidth
                isMultiline
                minRows={SKILL_SCRIPT_CONTENT_MIN_ROWS}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  form.updateScript(index, { content: event.target.value })
                }
              />
            </div>
          </div>
        ))}
        <Button
          variant="outlined"
          text="Add script"
          isDisabled={isSubmitting || form.values.scripts.length >= SKILL_SCRIPT_MAX_COUNT}
          onClick={() => form.addScript()}
        />
      </section>
      {submitError !== undefined ? <Alert variant="error" message={submitError} /> : null}
      <div className={styles.actions}>
        <Button
          variant="contained"
          text={SUBMIT_LABEL[mode]}
          type="submit"
          isDisabled={isSubmitting}
          isLoading={isSubmitting}
        />
        <Button variant="outlined" text="Cancel" isDisabled={isSubmitting} onClick={onCancel} />
      </div>
    </form>
  );
};
