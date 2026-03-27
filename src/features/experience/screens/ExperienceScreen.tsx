import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { ScreenContainer } from '../../../shared/ui/layout/ScreenContainer';
import { colors } from '../../../shared/theme/colors';

/**
 * 체험 탭 루트 화면.
 */
export function ExperienceScreen() {
  return (
    <ScreenContainer>
      <Text style={styles.title}>Experience</Text>
      <Text style={styles.description}>Partner experiences and activities will be listed here.</Text>
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
