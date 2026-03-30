import { env } from '../../config/env';
import { ApiErrorResponse, ApiResponse } from '../../types/api';

/**
 * GET 요청 후 공통 응답의 data를 반환한다.
 */
export async function httpGet<T>(path: string): Promise<T> {
  const response = await fetch(`${env.apiBaseUrl}${path}`);
  const json = (await response.json()) as ApiResponse<T> | ApiErrorResponse;

  if (!response.ok) {
    const error = json as ApiErrorResponse;
    throw new Error(`${error.code}: ${error.message}`);
  }

  return (json as ApiResponse<T>).data;
}

/**
 * POST 요청 후 공통 응답의 data를 반환한다.
 */
export async function httpPost<TResponse, TBody>(path: string, body: TBody): Promise<TResponse> {
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const json = (await response.json()) as ApiResponse<TResponse> | ApiErrorResponse;

  if (!response.ok) {
    const error = json as ApiErrorResponse;
    throw new Error(`${error.code}: ${error.message}`);
  }

  return (json as ApiResponse<TResponse>).data;
}
