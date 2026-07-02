import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/radius';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type BadgeChipProps = {
  label: string;
  tone?: 'blue' | 'green' | 'softBlue' | 'softGray';
};

export function BadgeChip({ label, tone = 'blue' }: BadgeChipProps) {
  return (
    <View style={[styles.base, toneStyles[tone].container]}>
      <Text style={[styles.label, toneStyles[tone].label]}>{label}</Text>
    </View>
  );
}

const toneStyles = {
  blue: {
    container: { backgroundColor: colors.primarySoftest },
    label: { color: colors.primary },
  },
  green: {
    container: { backgroundColor: '#ECFBF4' },
    label: { color: colors.success },
  },
  softBlue: {
    container: { backgroundColor: colors.primarySoft },
    label: { color: colors.textSecondary },
  },
  softGray: {
    container: { backgroundColor: colors.grayScale[100] },
    label: { color: colors.textTertiary },
  },
} as const;

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing[10],
    paddingVertical: spacing[6],
  },
  label: {
    fontSize: typography.size.small,
    lineHeight: typography.lineHeight.small,
    fontWeight: typography.weight.semibold,
    textTransform: 'uppercase',
  },
});
