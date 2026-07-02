const primary = {
  default: '#6C4DFF',
  hover: '#5B3FF0',
  pressed: '#5036D6',
  light: '#EEE9FF',
  extraLight: '#F7F4FF',
} as const;

const accent = {
  blue: '#4F8CFF',
  lavender: '#8B7BFF',
} as const;

const gray = {
  900: '#191F28',
  800: '#333D4B',
  700: '#4E5968',
  600: '#6B7684',
  500: '#8B95A1',
  400: '#B0B8C1',
  300: '#D6DAE3',
  200: '#E8EAF2',
  100: '#F2F3F8',
  50: '#F8F9FC',
} as const;

const semantic = {
  success: '#16C47F',
  warning: '#FFB020',
  error: '#F04452',
  info: primary.default,
  black: '#000000',
  white: '#FFFFFF',
  alternative: '#F8F9FC',
  assistive: '#F2F3F8',
} as const;

export const colors = {
  primaryScale: primary,
  accentScale: accent,
  grayScale: gray,
  semantic,

  p: {
    50: primary.extraLight,
    100: primary.light,
    200: '#DDD5FF',
    300: '#C0B3FF',
    400: '#9A85FF',
    500: primary.default,
    600: primary.hover,
    700: primary.pressed,
    800: '#4128B8',
    900: '#2F1B87',
    950: '#1C0F52',
  },
  g: gray,

  background: gray[50],
  surface: semantic.white,
  surfaceAlt: primary.extraLight,
  surfaceSoft: '#F7F5FF',
  textPrimary: gray[900],
  textSecondary: gray[800],
  textTertiary: gray[600],
  textDisabled: gray[400],
  primary: primary.default,
  primaryHover: primary.hover,
  primaryPressed: primary.pressed,
  primarySoft: primary.light,
  primarySoftest: primary.extraLight,
  primarySecondary: accent.lavender,
  primaryAccentBlue: accent.blue,
  gradientStart: primary.default,
  gradientEnd: accent.lavender,
  gradientSoft: primary.extraLight,
  border: gray[200],
  borderStrong: gray[300],
  borderSoft: '#F0F2F8',
  danger: semantic.error,
  success: semantic.success,
  warning: semantic.warning,
  info: semantic.info,

  gathering: semantic.success,
  freeFeed: primary.default,
} as const;
