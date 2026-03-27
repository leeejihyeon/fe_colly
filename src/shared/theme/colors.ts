/**
 * Colly 디자인 시스템 색상 토큰.
 */
const p = {
  50: '#EFEFFB',
  100: '#CFCFF4',
  200: '#AFAFED',
  300: '#8F8FE7',
  400: '#6E6EE1',
  500: '#4C4DDC',
  600: '#2A2AC8',
  700: '#21219A',
  800: '#19196D',
  900: '#0F0F40',
  950: '#050514',
} as const;

const g = {
  50: '#F9FAFB',
  100: '#F3F4F6',
  200: '#E5E7EB',
  300: '#D1D5DB',
  400: '#9CA3AF',
  500: '#6B7280',
  600: '#4B5563',
  700: '#374151',
  800: '#1F2937',
  900: '#111827',
} as const;

const semantic = {
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  black: '#000000',
  white: '#FFFFFF',
  alternative: '#F9F9FA',
  assistive: '#F6F7F8',
} as const;

/**
 * 기존 코드와의 호환을 위해 별칭(alias) 키를 함께 제공한다.
 */
export const colors = {
  p,
  g,
  semantic,

  background: g[100],
  surface: semantic.white,
  textPrimary: g[900],
  textSecondary: g[700],
  textTertiary: g[500],
  primary: p[500],
  primarySoft: p[50],
  border: g[200],
  danger: semantic.error,
  success: semantic.success,
  warning: semantic.warning,
  info: semantic.info,

  gathering: p[600],
  freeFeed: p[700],
} as const;
