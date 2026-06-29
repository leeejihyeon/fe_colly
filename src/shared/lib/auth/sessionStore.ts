import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginResult } from '../../../features/auth/api/authApi';

const AUTH_SESSION_KEY = 'colly.auth.session';

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

  const raw = await AsyncStorage.getItem(AUTH_SESSION_KEY);
  memorySession = parseSession(raw);
  return memorySession;
}

export async function persistSession(session: LoginResult): Promise<void> {
  memorySession = session;
  await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

export async function clearSession(): Promise<void> {
  memorySession = null;
  await AsyncStorage.removeItem(AUTH_SESSION_KEY);
}

export async function getAccessToken(): Promise<string | null> {
  const session = await hydrateSession();
  return session?.accessToken ?? null;
}

export async function getRefreshToken(): Promise<string | null> {
  const session = await hydrateSession();
  return session?.refreshToken ?? null;
}
