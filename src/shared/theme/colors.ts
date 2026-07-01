const primary = {
  default: '#3182F6',
  hover: '#1B64DA',
  pressed: '#195CC5',
  light: '#E8F3FF',
  extraLight: '#F4F9FF',
} as const;

const gray = {
  900: '#191F28',
  800: '#333D4B',
  700: '#4E5968',
  600: '#6B7684',
  500: '#8B95A1',
  400: '#B0B8C1',
  300: '#D1D6DB',
  200: '#E5E8EB',
  100: '#F2F4F6',
  50: '#F9FAFB',
} as const;

const semantic = {
  success: '#16C47F',
  warning: '#FFB020',
  error: '#F04452',
  info: primary.default,
  black: '#000000',
  white: '#FFFFFF',
  alternative: '#F9FAFB',
  assistive: '#F2F4F6',
} as const;

export const colors = {
  primaryScale: primary,
  grayScale: gray,
  semantic,

  p: {
    50: primary.extraLight,
    100: primary.light,
    200: '#CFE5FF',
    300: '#A9CEFF',
    400: '#6AA6FF',
    500: primary.default,
    600: primary.hover,
    700: primary.pressed,
    800: '#1447A6',
    900: '#0D2F6C',
    950: '#081D42',
  },
  g: gray,

  background: gray[50],
  surface: semantic.white,
  surfaceAlt: primary.extraLight,
  textPrimary: gray[900],
  textSecondary: gray[800],
  textTertiary: gray[600],
  textDisabled: gray[400],
  primary: primary.default,
  primaryHover: primary.hover,
  primaryPressed: primary.pressed,
  primarySoft: primary.light,
  primarySoftest: primary.extraLight,
  border: gray[200],
  borderStrong: gray[300],
  danger: semantic.error,
  success: semantic.success,
  warning: semantic.warning,
  info: semantic.info,

  gathering: semantic.success,
  freeFeed: primary.default,
} as const;
