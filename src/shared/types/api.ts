/**
 * 백엔드 공통 성공 응답 타입.
 */
export type ApiResponse<T> = {
  success: boolean;
  code: string;
  message: string;
  data: T;
  timestamp: string;
};

/**
 * 백엔드 공통 실패 응답 타입.
 */
export type ApiErrorResponse = {
  success: boolean;
  code: string;
  message: string;
  path: string;
  details: Record<string, unknown>;
  timestamp: string;
};
