import React, { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/radius';
import { shadows } from '../../theme/shadows';
import { spacing } from '../../theme/spacing';

type AppCardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  padding?: keyof typeof cardPadding;
  tone?: 'default' | 'soft';
}>;

const cardPadding = {
  none: 0,
  sm: spacing[16],
  md: spacing[20],
  lg: spacing[24],
} as const;

export function AppCard({ children, style, padding = 'md', tone = 'default' }: AppCardProps) {
  return <View style={[styles.base, tone === 'soft' ? styles.soft : styles.default, { padding: cardPadding[padding] }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.medium,
  },
  default: {
    backgroundColor: colors.surface,
  },
  soft: {
    backgroundColor: colors.primarySoftest,
  },
});
