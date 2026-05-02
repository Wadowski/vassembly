export interface ResolvePostRegisterTargetUrlParams {
  returnUrl: string | null | undefined;
  fallbackPath: string;
  origin: string;
}

export interface ResolvePostRegisterTargetUrlResult {
  href: string;
}

export const resolvePostRegisterTargetUrl = (
  params: ResolvePostRegisterTargetUrlParams,
): ResolvePostRegisterTargetUrlResult => {
  const { returnUrl, fallbackPath, origin } = params;

  if (returnUrl === null || returnUrl === undefined || returnUrl.trim() === '') {
    return { href: fallbackPath };
  }

  try {
    const parsed = new URL(returnUrl, origin);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('Invalid protocol');
    }

    const expectedOrigin = new URL(origin).origin;

    if (parsed.origin !== expectedOrigin) {
      throw new Error('Origin mismatch');
    }

    if (parsed.pathname.startsWith('/:')) {
      throw new Error('Invalid pathname');
    }

    return { href: returnUrl };
  } catch {
    return { href: fallbackPath };
  }
};
