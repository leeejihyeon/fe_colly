import { NativeModules, Platform } from 'react-native';

/**
 * 앱 실행 환경 타입.
 */
export type AppEnv = 'dev' | 'stage' | 'prod';

type RuntimeConfig = {
  appEnv?: string;
  apiBaseUrl?: string;
  googleWebClientId?: string;
  googleIosClientId?: string;
};

declare global {
  var __COLLY_APP_ENV__: AppEnv | undefined;
}

function readNativeConfig(): RuntimeConfig {
  const config = NativeModules.RuntimeConfig;

  if (!config || typeof config !== 'object') {
    return {};
  }

  return config as RuntimeConfig;
}

function normalizeString(value: string | undefined | null): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * 실행 환경 문자열을 계산한다.
 */
function resolveAppEnv(nativeConfig: RuntimeConfig): AppEnv {
  const configured = normalizeString(nativeConfig.appEnv);

  if (configured === 'dev' || configured === 'stage' || configured === 'prod') {
    return configured;
  }

  if (globalThis.__COLLY_APP_ENV__) {
    return globalThis.__COLLY_APP_ENV__;
  }

  if (__DEV__) {
    return 'dev';
  }

  return 'prod';
}

/**
 * 개발 환경에서 플랫폼별 로컬 API 주소를 계산한다.
 */
function resolveDevApiBaseUrl(): string {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:18080';
  }

  return 'http://localhost:18080';
}

const nativeConfig = readNativeConfig();
const APP_ENV = resolveAppEnv(nativeConfig);

const API_BASE_URL_BY_ENV: Record<AppEnv, string> = {
  dev: resolveDevApiBaseUrl(),
  stage: 'https://stg-api.colly.app',
  prod: 'https://api.colly.app',
};

const googleWebClientId = normalizeString(nativeConfig.googleWebClientId);
const googleIosClientId = normalizeString(nativeConfig.googleIosClientId);
const apiBaseUrl = normalizeString(nativeConfig.apiBaseUrl) || API_BASE_URL_BY_ENV[APP_ENV];

/**
 * 앱 공통 환경 변수 집합.
 */
export const env = {
  appEnv: APP_ENV,
  apiBaseUrl,
  googleWebClientId,
  googleIosClientId,
  isGoogleSignInConfigured: googleWebClientId.length > 0 && (Platform.OS !== 'ios' || googleIosClientId.length > 0),
} as const;
