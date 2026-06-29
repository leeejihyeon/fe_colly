import { env } from '../../config/env';
import { ApiErrorResponse, ApiResponse } from '../../types/api';
import { clearSession, getAccessToken, getRefreshToken, persistSession } from '../auth/sessionStore';

type ApiEnvelope<T> = ApiResponse<T> | ApiErrorResponse;

async function buildAuthHeaders(): Promise<Record<string, string>> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return {};
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

async function parseApiResponse<T>(response: Response): Promise<ApiEnvelope<T>> {
  const payload = (await response.json()) as ApiEnvelope<T>;
  if (payload && typeof payload === 'object') {
    return payload;
  }

  throw new Error('Invalid server response format');
}

function createApiError(json: ApiErrorResponse): Error {
  return new Error(`${json.code}: ${json.message}`);
}

async function requestWithAutoRefresh<T>(
  request: () => Promise<Response>,
  allowRefreshRetry: boolean,
): Promise<T> {
  const response = await request();
  const json = (await parseApiResponse<T>(response));

  if (response.ok) {
    return (json as ApiResponse<T>).data;
  }

  if (response.status === 401 && allowRefreshRetry) {
    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
      await clearSession();
      throw createApiError(json as ApiErrorResponse);
    }

    const refreshResponse = await fetch(`${env.apiBaseUrl}/api/auth/token/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    const refreshJson = await parseApiResponse<LoginResult>(refreshResponse);

    if (!refreshResponse.ok) {
      await clearSession();
      throw createApiError(refreshJson as ApiErrorResponse);
    }

    const { data } = refreshJson as ApiResponse<LoginResult>;
    await persistSession({
      userId: data.userId,
      email: data.email,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });

    return requestWithAutoRefresh<T>(request, false);
  }

  throw createApiError(json as ApiErrorResponse);
}

/**
 * GET 요청 후 공통 응답의 data를 반환한다.
 */
export async function httpGet<T>(path: string): Promise<T> {
  return requestWithAutoRefresh(async () => {
    const authHeaders = await buildAuthHeaders();
    return fetch(`${env.apiBaseUrl}${path}`, {
      headers: authHeaders,
    });
  }, true);
}

/**
 * POST 요청 후 공통 응답의 data를 반환한다.
 */
export async function httpPost<TResponse, TBody>(path: string, body: TBody): Promise<TResponse> {
  return requestWithAutoRefresh(async () => {
    const authHeaders = await buildAuthHeaders();
    return fetch(`${env.apiBaseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(body),
    });
  }, true);
}

type LoginResult = {
  userId: number;
  email: string;
  accessToken: string;
  refreshToken: string;
};
