import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { ScreenContainer } from '../../../shared/ui/layout/ScreenContainer';
import { colors } from '../../../shared/theme/colors';

/**
 * 마이페이지 탭 루트 화면.
 */
export function MyPageScreen() {
  return (
    <ScreenContainer>
      <Text style={styles.title}>My</Text>
      <Text style={styles.description}>Your accommodation, activity history, and settings will appear here.</Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
  },
});
