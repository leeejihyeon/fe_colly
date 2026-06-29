import React, { useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import X from 'lucide-react-native/dist/cjs/icons/x';
import { requestMagicLink, verifyMagicLink, type LoginResult } from '../api/authApi';
import { colors } from '../../../shared/theme/colors';
import { spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { useToast } from '../../../shared/ui/toast/ToastProvider';

type LoginScreenProps = {
  onLoginSuccess: (session: LoginResult) => void;
  onClose?: () => void;
};

export function LoginScreen({ onLoginSuccess, onClose }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [showManualToken, setShowManualToken] = useState(false);
  const { showToast } = useToast();

  const requestToken = async () => {
    const normalized = email.trim();

    if (!normalized) {
      showToast({ message: 'Please enter your email.', tone: 'error' });
      return;
    }

    try {
      setRequestLoading(true);

      const result = await requestMagicLink(normalized);
      showToast({
        message: `Magic link sent to ${result.email}. Check your inbox and open the sign-in button.`,
        tone: 'success',
      });
    } catch (e) {
      showToast({ message: e instanceof Error ? e.message : 'Failed to request magic link.', tone: 'error' });
    } finally {
      setRequestLoading(false);
    }
  };

  const login = async () => {
    const trimmedToken = token.trim();

    if (!trimmedToken) {
      showToast({ message: 'Please enter your token.', tone: 'error' });
      return;
    }

    try {
      setVerifyLoading(true);

      const session = await verifyMagicLink(trimmedToken);
      onLoginSuccess(session);
    } catch (e) {
      showToast({ message: e instanceof Error ? e.message : 'Failed to verify login.', tone: 'error' });
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {onClose ? (
          <Pressable style={styles.backButton} onPress={onClose}>
            <X size={16} color={colors.textSecondary} />
            <Text style={styles.backButtonText}>Close</Text>
          </Pressable>
        ) : null}

        <Text style={styles.title}>Colly Login</Text>
        <Text style={styles.subtitle}>Sign in with your email magic link.</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="you@example.com"
          placeholderTextColor={colors.textTertiary}
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />
        <Pressable style={styles.primaryButton} onPress={requestToken} disabled={requestLoading || verifyLoading}>
          {requestLoading ? <ActivityIndicator color={colors.semantic.white} /> : <Text style={styles.buttonText}>Request Magic Link</Text>}
        </Pressable>

        <Pressable
          style={styles.textButton}
          onPress={() => setShowManualToken(prev => !prev)}
          disabled={requestLoading || verifyLoading}
        >
          <Text style={styles.textButtonText}>Manual Token Login (Backup)</Text>
        </Pressable>

        {showManualToken ? (
          <View>
            <Text style={[styles.label, styles.tokenLabel]}>Magic Token</Text>
            <Text style={styles.tokenHint}>Paste the token value from the email and sign in manually.</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="token"
              placeholderTextColor={colors.textTertiary}
              style={styles.input}
              value={token}
              onChangeText={setToken}
            />
            <Pressable style={styles.secondaryButton} onPress={login} disabled={verifyLoading || requestLoading}>
              {verifyLoading ? (
                <ActivityIndicator color={colors.semantic.white} />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </Pressable>
          </View>
        ) : null}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing[20],
  },
  backButton: {
    position: 'absolute',
    top: spacing[20],
    left: spacing[20],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[6],
    paddingHorizontal: spacing[10],
    paddingVertical: spacing[6],
    borderRadius: 999,
    backgroundColor: colors.semantic.alternative,
  },
  backButtonText: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  title: {
    fontSize: typography.size.display,
    lineHeight: typography.lineHeight.display,
    fontWeight: typography.weight.extrabold,
    color: colors.textPrimary,
    marginBottom: spacing[8],
  },
  subtitle: {
    fontSize: typography.size.md,
    lineHeight: typography.lineHeight.md,
    color: colors.textSecondary,
    marginBottom: spacing[24],
  },
  label: {
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing[8],
  },
  tokenLabel: {
    marginTop: spacing[16],
  },
  tokenHint: {
    marginTop: -spacing[4],
    marginBottom: spacing[8],
    color: colors.textTertiary,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: spacing[10],
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[12],
    fontSize: typography.size.md,
    color: colors.textPrimary,
    marginBottom: spacing[12],
  },
  primaryButton: {
    minHeight: 46,
    borderRadius: spacing[10],
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[12],
    marginBottom: spacing[12],
  },
  buttonText: {
    fontSize: typography.size.md,
    lineHeight: typography.lineHeight.md,
    fontWeight: typography.weight.bold,
    color: colors.semantic.white,
  },
  textButton: {
    marginTop: spacing[6],
    alignSelf: 'flex-start',
    paddingVertical: spacing[10],
    paddingHorizontal: spacing[12],
    borderRadius: spacing[10],
    backgroundColor: colors.surface,
  },
  textButtonText: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.semibold,
  },
  secondaryButton: {
    minHeight: 46,
    borderRadius: spacing[10],
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
