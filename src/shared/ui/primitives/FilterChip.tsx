import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/radius';
import { shadows } from '../../theme/shadows';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type FilterChipProps = {
  label: string;
  active?: boolean;
  onPress?: () => void;
};

export function FilterChip({ label, active = false, onPress }: FilterChipProps) {
  return (
    <Pressable onPress={onPress} style={[styles.base, active ? styles.active : styles.idle]}>
      <Text style={[styles.label, active ? styles.activeLabel : styles.idleLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.button,
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[10],
    borderWidth: 1,
    ...shadows.small,
  },
  idle: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  active: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    fontSize: typography.size.caption,
    lineHeight: typography.lineHeight.caption,
    fontWeight: typography.weight.medium,
  },
  idleLabel: {
    color: colors.textSecondary,
  },
  activeLabel: {
    color: colors.semantic.white,
  },
});
