import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import X from 'lucide-react-native/dist/cjs/icons/x';
import { env } from '../../../shared/config/env';
import { colors } from '../../../shared/theme/colors';
import { spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { useToast } from '../../../shared/ui/toast/ToastProvider';
import { loginWithApple, loginWithGoogle, requestMagicLink, verifyMagicLink, type LoginResult } from '../api/authApi';

type LoginScreenProps = {
  onLoginSuccess: (session: LoginResult) => void;
  onClose?: () => void;
};

const googleConfigured = env.isGoogleSignInConfigured;

export function LoginScreen({ onLoginSuccess, onClose }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [showManualToken, setShowManualToken] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!env.googleWebClientId) {
      return;
    }

    GoogleSignin.configure({
      scopes: ['email', 'profile'],
      webClientId: env.googleWebClientId,
      iosClientId: env.googleIosClientId || undefined,
    });
  }, []);

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

  const handleGoogleLogin = async () => {
    if (!googleConfigured) {
      showToast({ message: 'Google Sign-In is not configured. Add the missing native client IDs first.', tone: 'error' });
      return;
    }

    try {
      setGoogleLoading(true);
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();

      if (response.type !== 'success') {
        showToast({ message: 'Google sign-in was cancelled.', tone: 'info' });
        return;
      }

      const idToken = response.data.idToken;
      if (!idToken) {
        showToast({ message: 'Google did not return an ID token.', tone: 'error' });
        return;
      }

      const session = await loginWithGoogle(idToken);
      onLoginSuccess(session);
      showToast({ message: 'Signed in with Google.', tone: 'success' });
    } catch (e) {
      showToast({ message: e instanceof Error ? e.message : 'Google sign-in failed.', tone: 'error' });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    if (Platform.OS !== 'ios' || !appleAuth.isSupported) {
      showToast({ message: 'Apple Sign In is not available on this device.', tone: 'error' });
      return;
    }

    try {
      setAppleLoading(true);
      const response = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      if (!response.identityToken) {
        showToast({ message: 'Apple did not return an identity token.', tone: 'error' });
        return;
      }

      const fullName = [response.fullName?.givenName, response.fullName?.familyName].filter(Boolean).join(' ').trim();
      const session = await loginWithApple(
        response.identityToken,
        response.authorizationCode,
        fullName || null,
      );
      onLoginSuccess(session);
      showToast({ message: 'Signed in with Apple.', tone: 'success' });
    } catch (e) {
      showToast({ message: e instanceof Error ? e.message : 'Apple sign-in failed.', tone: 'error' });
    } finally {
      setAppleLoading(false);
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

        <Text style={styles.title}>Welcome to Colly</Text>
        <Text style={styles.subtitle}>Sign in to create posts, join gatherings, and connect with people around your stay.</Text>

        <Pressable style={styles.socialButton} onPress={handleGoogleLogin} disabled={googleLoading || requestLoading || verifyLoading || appleLoading}>
          {googleLoading ? <ActivityIndicator color={colors.textPrimary} /> : <Text style={styles.socialButtonText}>Continue with Google</Text>}
        </Pressable>

        {Platform.OS === 'ios' ? (
          <Pressable style={[styles.socialButton, styles.appleButton]} onPress={handleAppleLogin} disabled={appleLoading || googleLoading || requestLoading || verifyLoading}>
            {appleLoading ? <ActivityIndicator color={colors.semantic.white} /> : <Text style={styles.appleButtonText}>Continue with Apple</Text>}
          </Pressable>
        ) : null}

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or use email</Text>
          <View style={styles.dividerLine} />
        </View>

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
        <Pressable style={styles.primaryButton} onPress={requestToken} disabled={requestLoading || verifyLoading || googleLoading || appleLoading}>
          {requestLoading ? <ActivityIndicator color={colors.semantic.white} /> : <Text style={styles.buttonText}>Request Magic Link</Text>}
        </Pressable>

        <Text style={styles.helperText}>We will send a secure sign-in link to your inbox. Open it on this device to continue automatically.</Text>

        <Pressable
          style={styles.textButton}
          onPress={() => setShowManualToken(prev => !prev)}
          disabled={requestLoading || verifyLoading || googleLoading || appleLoading}
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
            <Pressable style={styles.secondaryButton} onPress={login} disabled={verifyLoading || requestLoading || googleLoading || appleLoading}>
              {verifyLoading ? <ActivityIndicator color={colors.semantic.white} /> : <Text style={styles.buttonText}>Sign In</Text>}
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
    marginBottom: spacing[20],
  },
  socialButton: {
    minHeight: 48,
    borderRadius: spacing[10],
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[12],
    marginBottom: spacing[10],
  },
  socialButtonText: {
    color: colors.textPrimary,
    fontSize: typography.size.md,
    lineHeight: typography.lineHeight.md,
    fontWeight: typography.weight.semibold,
  },
  appleButton: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  appleButtonText: {
    color: colors.semantic.white,
    fontSize: typography.size.md,
    lineHeight: typography.lineHeight.md,
    fontWeight: typography.weight.semibold,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[10],
    marginVertical: spacing[16],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textTertiary,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: typography.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
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
    marginBottom: spacing[10],
  },
  helperText: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  buttonText: {
    fontSize: typography.size.md,
    lineHeight: typography.lineHeight.md,
    fontWeight: typography.weight.bold,
    color: colors.semantic.white,
  },
  textButton: {
    marginTop: spacing[10],
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
