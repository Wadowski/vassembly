'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { config } from '@vassembly/config';
import { useSkill, useSpecialization } from '@vassembly/ui-api-hooks';
import type { SkillScriptItem } from '@vassembly/ui-api-hooks';

import { getAuthTokenForHeader } from '../../../../../../lib/auth/sessionStorage';

import { SCRIPT_CONTENT_ERROR_MESSAGE } from './constants';
import type { UseSkillDetailArgs, UseSkillDetailResult } from './types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? `http://localhost:${config.services.api.port}`;

const sortScriptsByFilename = (scripts: SkillScriptItem[]): SkillScriptItem[] => {
  return [...scripts].sort((left, right) => left.filename.localeCompare(right.filename));
};

const fetchScriptContent = async ({
  skillId,
  filename,
}: {
  skillId: string;
  filename: string;
}): Promise<string> => {
  const token = await getAuthTokenForHeader();
  const headers: Record<string, string> = {};

  if (token !== undefined && token !== '') {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_BASE_URL}/skills/${skillId}/scripts/${encodeURIComponent(filename)}`,
    { headers },
  );

  if (!response.ok) {
    throw new Error(SCRIPT_CONTENT_ERROR_MESSAGE);
  }

  return response.text();
};

export const useSkillDetail = ({
  specializationId,
  skillId,
}: UseSkillDetailArgs): UseSkillDetailResult => {
  const {
    data: skillData,
    loading: skillLoading,
    error: skillError,
    refetch: refetchSkill,
  } = useSkill({ skillId });

  const { data: specializationData } = useSpecialization({
    specializationId,
    skip: specializationId === '',
  });

  const skill = skillData?.skill ?? undefined;
  const specializationName = specializationData?.specialization?.name;

  const sortedScripts = useMemo(() => {
    if (skill === undefined) {
      return [];
    }

    return sortScriptsByFilename(skill.scripts);
  }, [skill]);

  const [activeScript, setActiveScript] = useState<SkillScriptItem | null>(null);
  const [scriptContent, setScriptContent] = useState<string | null>(null);
  const [scriptLoading, setScriptLoading] = useState(false);
  const [scriptError, setScriptError] = useState<string | null>(null);

  useEffect(() => {
    if (sortedScripts.length === 0) {
      setActiveScript(null);
      setScriptContent(null);
      setScriptError(null);
      return;
    }

    setActiveScript((current) => {
      if (current !== null && sortedScripts.some((script) => script.filename === current.filename)) {
        return current;
      }

      return sortedScripts[0] ?? null;
    });
  }, [sortedScripts]);

  const loadScriptContent = useCallback(async (): Promise<void> => {
    if (activeScript === null || skillId === '') {
      setScriptContent(null);
      setScriptError(null);
      return;
    }

    setScriptLoading(true);
    setScriptError(null);

    try {
      const content = await fetchScriptContent({
        skillId,
        filename: activeScript.filename,
      });
      setScriptContent(content);
    } catch {
      setScriptContent(null);
      setScriptError(SCRIPT_CONTENT_ERROR_MESSAGE);
    } finally {
      setScriptLoading(false);
    }
  }, [activeScript, skillId]);

  useEffect(() => {
    void loadScriptContent();
  }, [loadScriptContent]);

  const isNotFound = !skillLoading && skillData !== undefined && skill === null;

  const handleRetry = useCallback((): void => {
    refetchSkill();
  }, [refetchSkill]);

  const handleScriptRetry = useCallback((): void => {
    void loadScriptContent();
  }, [loadScriptContent]);

  return {
    skill,
    specializationName,
    loading: skillLoading,
    error: skillError,
    isNotFound,
    activeScript,
    setActiveScript,
    scriptContent,
    scriptLoading,
    scriptError,
    handleRetry,
    handleScriptRetry,
  };
};
