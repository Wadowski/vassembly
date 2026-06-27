'use client';

import { config } from '@vassembly/config';
import { getAuthTokenForHeader } from '../../../../../lib/auth/sessionStorage';

export const fetchSkillScriptContent = async ({
  skillId,
  filename,
}: {
  skillId: string;
  filename: string;
}): Promise<string> => {
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? `http://localhost:${config.services.api.port}`;
  const token = await getAuthTokenForHeader();
  const headers: Record<string, string> = {};

  if (token !== undefined && token !== '') {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `${apiBaseUrl}/skills/${skillId}/scripts/${encodeURIComponent(filename)}`,
    { headers },
  );

  if (!response.ok) {
    throw new Error('Unable to load script content.');
  }

  return response.text();
};
