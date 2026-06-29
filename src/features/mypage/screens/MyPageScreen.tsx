import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { ScreenContainer } from '../../../shared/ui/layout/ScreenContainer';
import { colors } from '../../../shared/theme/colors';
import { spacing } from '../../../shared/theme/spacing';
import { useAuthGate } from '../../../shared/lib/auth/authGate';

/**
 * 마이페이지 탭 루트 화면.
 */
export function MyPageScreen() {
  const { session, logout, openLogin } = useAuthGate();

  return (
    <ScreenContainer>
      <Text style={styles.title}>My</Text>
      <Text style={styles.description}>Your accommodation, activity history, and settings will appear here.</Text>
      <Text style={styles.status}>Status: {session ? `Signed in as ${session.email}` : 'Guest'}</Text>

      {session ? (
        <Pressable onPress={logout} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Log Out</Text>
        </Pressable>
      ) : (
        <Pressable onPress={openLogin} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Sign In</Text>
        </Pressable>
      )}
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
  status: {
    marginTop: spacing[16],
    fontSize: 14,
    color: colors.textSecondary,
  },
  primaryButton: {
    marginTop: spacing[12],
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: spacing[10],
    paddingHorizontal: spacing[14],
    paddingVertical: spacing[10],
  },
  primaryButtonText: {
    color: colors.semantic.white,
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryButton: {
    marginTop: spacing[12],
    alignSelf: 'flex-start',
    backgroundColor: colors.semantic.alternative,
    borderRadius: spacing[10],
    paddingHorizontal: spacing[14],
    paddingVertical: spacing[10],
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
});
