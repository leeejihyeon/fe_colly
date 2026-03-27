import { Platform } from 'react-native';

/**
 * 앱 실행 환경 타입.
 */
export type AppEnv = 'dev' | 'stage' | 'prod';

declare global {
  var __COLLY_APP_ENV__: AppEnv | undefined;
}

/**
 * 실행 환경 문자열을 계산한다.
 */
function resolveAppEnv(): AppEnv {
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

const APP_ENV = resolveAppEnv();

const API_BASE_URL_BY_ENV: Record<AppEnv, string> = {
  dev: resolveDevApiBaseUrl(),
  stage: 'https://stg-api.colly.app',
  prod: 'https://api.colly.app',
};

/**
 * 앱 공통 환경 변수 집합.
 */
export const env = {
  appEnv: APP_ENV,
  apiBaseUrl: API_BASE_URL_BY_ENV[APP_ENV],
} as const;
