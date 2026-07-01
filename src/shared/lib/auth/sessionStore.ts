import * as Keychain from 'react-native-keychain';
import { LoginResult } from '../../../features/auth/api/authApi';

const AUTH_SESSION_SERVICE = 'colly.auth.session';

let memorySession: LoginResult | null | undefined;

function parseSession(raw: string | null): LoginResult | null {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as LoginResult;
  } catch {
    return null;
  }
}

export async function hydrateSession(): Promise<LoginResult | null> {
  if (memorySession !== undefined) {
    return memorySession;
  }

  const credentials = await Keychain.getGenericPassword({ service: AUTH_SESSION_SERVICE });
  const raw = credentials ? credentials.password : null;
  memorySession = parseSession(raw);
  return memorySession;
}

export async function persistSession(session: LoginResult): Promise<void> {
  memorySession = session;
  await Keychain.setGenericPassword('colly', JSON.stringify(session), {
    service: AUTH_SESSION_SERVICE,
  });
}

export async function clearSession(): Promise<void> {
  memorySession = null;
  await Keychain.resetGenericPassword({ service: AUTH_SESSION_SERVICE });
}

export async function getAccessToken(): Promise<string | null> {
  const session = await hydrateSession();
  return session?.accessToken ?? null;
}

export async function getRefreshToken(): Promise<string | null> {
  const session = await hydrateSession();
  return session?.refreshToken ?? null;
}
