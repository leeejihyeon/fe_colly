import { httpGet, httpPost } from '../../../shared/lib/http/httpClient';

export type MagicLinkIssueResult = {
  email: string;
  expiresInSeconds: number;
};

export type AuthProvider = 'EMAIL_MAGIC_LINK' | 'GOOGLE' | 'APPLE';

export type LoginResult = {
  userId: number;
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  refreshExpiresInSeconds: number;
  provider: AuthProvider;
};

export type RefreshTokenRequestBody = {
  refreshToken: string;
};

export type SignOutRequestBody = {
  refreshToken: string;
};

export type CurrentUserResult = {
  userId: number;
  email: string;
  provider: AuthProvider;
};

export async function requestMagicLink(email: string): Promise<MagicLinkIssueResult> {
  return httpPost<MagicLinkIssueResult, { email: string }>('/api/auth/magic-link/request', { email });
}

export async function verifyMagicLink(token: string): Promise<LoginResult> {
  return httpPost<LoginResult, { token: string }>('/api/auth/magic-link/verify', { token });
}

export async function refreshMagicToken(refreshToken: string): Promise<LoginResult> {
  return httpPost<LoginResult, RefreshTokenRequestBody>('/api/auth/token/refresh', { refreshToken });
}

export async function signOutMagic(refreshToken: string): Promise<void> {
  await httpPost<void, SignOutRequestBody>('/api/auth/signout', { refreshToken });
}

export async function signOutAllMagic(): Promise<void> {
  await httpPost<void, Record<string, never>>('/api/auth/signout-all', {});
}

export async function loginWithGoogle(idToken: string): Promise<LoginResult> {
  return httpPost<LoginResult, { idToken: string }>('/api/auth/social/google', { idToken });
}

export async function loginWithApple(identityToken: string, authorizationCode?: string | null, name?: string | null): Promise<LoginResult> {
  return httpPost<LoginResult, { identityToken: string; authorizationCode?: string | null; name?: string | null }>(
    '/api/auth/social/apple',
    {
      identityToken,
      authorizationCode: authorizationCode ?? null,
      name: name ?? null,
    },
  );
}

export async function getCurrentUser(): Promise<CurrentUserResult> {
  return httpGet<CurrentUserResult>('/api/auth/me');
}
