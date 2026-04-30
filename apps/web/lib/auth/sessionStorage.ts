interface StoredTokens {
  authToken: string;
  refreshToken: string;
}

const STORAGE_KEYS = {
  authToken: 'auth:token',
  refreshToken: 'auth:refreshToken',
} as const;

const COOKIE_KEYS = {
  authToken: 'auth-token',
} as const;

export const getTokens = (): Partial<StoredTokens> => {
  try {
    if (typeof window === 'undefined') return {};

    const authToken = localStorage.getItem(STORAGE_KEYS.authToken);
    const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken);

    return {
      ...(authToken && { authToken }),
      ...(refreshToken && { refreshToken }),
    };
  } catch (error) {
    console.error('Failed to read tokens from storage', error);
    return {};
  }
};

export const setTokens = (tokens: Partial<StoredTokens>): void => {
  try {
    if (typeof window === 'undefined') return;

    if (tokens.authToken) {
      localStorage.setItem(STORAGE_KEYS.authToken, tokens.authToken);
      document.cookie = `${COOKIE_KEYS.authToken}=${tokens.authToken}; path=/; SameSite=Strict`;
    }
    if (tokens.refreshToken) {
      localStorage.setItem(STORAGE_KEYS.refreshToken, tokens.refreshToken);
    }
  } catch (error) {
    console.error('Failed to store tokens', error);
  }
};

export const clearTokens = (): void => {
  try {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(STORAGE_KEYS.authToken);
    localStorage.removeItem(STORAGE_KEYS.refreshToken);
    document.cookie = `${COOKIE_KEYS.authToken}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
  } catch (error) {
    console.error('Failed to clear tokens', error);
  }
};

export const getAuthTokenForHeader = async (): Promise<string | undefined> => {
  const tokens = getTokens();
  console.log("tokens", tokens);
  return tokens.authToken;
};

export const getRefreshTokenForHeader = async (): Promise<string | undefined> => {
  const tokens = getTokens();
  return tokens.refreshToken;
};
