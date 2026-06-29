import { httpPost } from '../../../shared/lib/http/httpClient';

export type MagicLinkIssueResult = {
  email: string;
  expiresInSeconds: number;
};

export type LoginResult = {
  userId: number;
  email: string;
  accessToken: string;
  refreshToken: string;
};

export type RefreshTokenRequestBody = {
  refreshToken: string;
};

export type SignOutRequestBody = {
  refreshToken: string;
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
