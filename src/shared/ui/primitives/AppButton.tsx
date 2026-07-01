import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { buttonHeights } from '../../theme/controlSizes';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/radius';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type AppButtonProps = {
  label: string;
  onPress?: () => void;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  iconPosition?: 'left' | 'right';
};

export function AppButton({
  label,
  onPress,
  icon,
  style,
  disabled = false,
  variant = 'secondary',
  size = 'medium',
  iconPosition = 'left',
}: AppButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[size],
        styles[variant],
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.row}>
        <View style={styles.sideSlot}>{iconPosition === 'left' ? icon : null}</View>
        <View style={styles.centerSlot}>
          <Text
            style={[
              styles.label,
              styles[`${size}Label`],
              styles[`${variant}Label`],
              disabled && styles.disabledLabel,
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
        <View style={styles.sideSlot}>{iconPosition === 'right' ? icon : null}</View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.button,
    borderWidth: 1,
    paddingHorizontal: spacing[16],
    justifyContent: 'center',
  },
  small: { height: buttonHeights.small },
  medium: { height: buttonHeights.medium },
  large: { height: buttonHeights.large },
  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
  },
  ghost: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.82 },
  disabled: {
    backgroundColor: colors.grayScale[100],
    borderColor: colors.grayScale[200],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  sideSlot: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
  },
  label: {
    textAlign: 'center',
    fontWeight: typography.weight.semibold,
    includeFontPadding: false,
  },
  smallLabel: {
    fontSize: typography.size.small,
    lineHeight: 16,
  },
  mediumLabel: {
    fontSize: typography.size.caption,
    lineHeight: 18,
  },
  largeLabel: {
    fontSize: typography.size.caption,
    lineHeight: 18,
  },
  primaryLabel: { color: colors.semantic.white },
  secondaryLabel: { color: colors.primary },
  ghostLabel: { color: colors.textSecondary },
  disabledLabel: { color: colors.textDisabled },
});
