import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Apple from 'lucide-react-native/dist/cjs/icons/apple';
import ChevronRight from 'lucide-react-native/dist/cjs/icons/chevron-right';
import Mail from 'lucide-react-native/dist/cjs/icons/mail';
import Send from 'lucide-react-native/dist/cjs/icons/send';
import Shield from 'lucide-react-native/dist/cjs/icons/shield';
import X from 'lucide-react-native/dist/cjs/icons/x';
import { env } from '../../../shared/config/env';
import { buttonHeights, inputHeights } from '../../../shared/theme/controlSizes';
import { colors } from '../../../shared/theme/colors';
import { iconSizes } from '../../../shared/theme/iconSizes';
import { radius } from '../../../shared/theme/radius';
import { shadows } from '../../../shared/theme/shadows';
import { spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { AppButton } from '../../../shared/ui/primitives/AppButton';
import { AppCard } from '../../../shared/ui/primitives/AppCard';
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

  const busy = requestLoading || verifyLoading || googleLoading || appleLoading;

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
      const session = await loginWithApple(response.identityToken, response.authorizationCode, fullName || null);
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
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {onClose ? (
          <Pressable style={styles.closeButton} onPress={onClose}>
            <X size={iconSizes.lg} color={colors.textPrimary} />
          </Pressable>
        ) : null}

        <View style={styles.heroBlock}>
          <Text style={styles.heroTitle}>
            <Text style={styles.heroTitleDark}>Welcome to </Text>
            <Text style={styles.heroTitleAccent}>Colly</Text>
          </Text>
          <Text style={styles.heroSubtitle}>A global co-living community.</Text>
          <Text style={styles.heroSubtitle}>Stay, connect, and belong anywhere.</Text>
        </View>

        <View style={styles.actionStack}>
          <SocialButton
            label="Continue with Google"
            onPress={handleGoogleLogin}
            disabled={busy}
            loading={googleLoading}
            leading={
              <View style={styles.googleMarkWrap}>
                <Text style={styles.googleMark}>G</Text>
              </View>
            }
          />

          {Platform.OS === 'ios' ? (
            <SocialButton
              label="Continue with Apple"
              onPress={handleAppleLogin}
              disabled={busy}
              loading={appleLoading}
              leading={<Apple size={iconSizes.lg} color={colors.textPrimary} />}
            />
          ) : null}
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR USE EMAIL</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrap}>
            <Mail size={iconSizes.lg} color={colors.textTertiary} />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="name@domain.com"
              placeholderTextColor={colors.textDisabled}
              style={styles.input}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <AppButton
            label="Request Magic Link"
            variant="primary"
            size="medium"
            onPress={requestToken}
            disabled={busy}
            style={styles.primaryAction}
            icon={requestLoading ? <ActivityIndicator color={colors.semantic.white} /> : <Send size={iconSizes.sm} color={colors.semantic.white} />}
            iconPosition="right"
          />
        </View>

        <AppCard style={styles.infoCard} tone="soft" padding="md">
          <View style={styles.infoIconWrap}>
            <Mail size={iconSizes.md} color={colors.primary} />
          </View>
          <View style={styles.infoCopy}>
            <Text style={styles.infoTitle}>We&apos;ll email you a secure link.</Text>
            <Text style={styles.infoBody}>Tap the link in your inbox to sign in or create your account. No password needed.</Text>
          </View>
        </AppCard>

        <Pressable style={styles.manualRow} onPress={() => setShowManualToken(prev => !prev)} disabled={busy}>
          <View style={styles.manualIconWrap}>
            <Shield size={iconSizes.md} color={colors.textTertiary} />
          </View>
          <View style={styles.manualCopyRow}>
            <Text style={styles.manualLead}>Have a code?</Text>
            <Text style={styles.manualAction}>Use Manual Token Login</Text>
          </View>
          <ChevronRight size={iconSizes.md} color={colors.textTertiary} />
        </Pressable>

        {showManualToken ? (
          <View style={styles.manualPanel}>
            <Text style={styles.label}>Magic Token</Text>
            <Text style={styles.manualHint}>Paste the token value from the email and finish sign-in manually.</Text>
            <View style={styles.inputWrap}>
              <Shield size={iconSizes.lg} color={colors.textTertiary} />
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Paste your token"
                placeholderTextColor={colors.textDisabled}
                style={styles.input}
                value={token}
                onChangeText={setToken}
              />
            </View>
            <AppButton
              label="Sign In"
              variant="secondary"
              size="medium"
              onPress={login}
              disabled={busy}
              style={styles.secondaryAction}
              icon={verifyLoading ? <ActivityIndicator color={colors.primary} /> : undefined}
            />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

type SocialButtonProps = {
  label: string;
  onPress: () => void;
  disabled: boolean;
  loading: boolean;
  leading: React.ReactNode;
};

function SocialButton({ label, onPress, disabled, loading, leading }: SocialButtonProps) {
  return (
    <Pressable style={[styles.socialButton, disabled && styles.socialDisabled]} onPress={onPress} disabled={disabled}>
      <View style={styles.socialLeading}>{leading}</View>
      <View style={styles.socialLabelWrap}>
        {loading ? <ActivityIndicator color={colors.textPrimary} /> : <Text style={styles.socialLabel} numberOfLines={1}>{label}</Text>}
      </View>
      <View style={styles.socialTrailing} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    paddingHorizontal: spacing[16],
    paddingTop: spacing[8],
    flexGrow: 1,
    paddingBottom: spacing[40],
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.medium,
    marginTop: spacing[8],
    marginBottom: spacing[28],
  },
  heroBlock: {
    gap: spacing[8],
    marginBottom: spacing[16],
  },
  heroTitle: {
    fontSize: typography.size.titleM,
    lineHeight: typography.lineHeight.titleM,
    fontWeight: typography.weight.bold,
    letterSpacing: -1,
  },
  heroTitleDark: {
    color: colors.textPrimary,
  },
  heroTitleAccent: {
    color: colors.primary,
  },
  heroSubtitle: {
    color: colors.textTertiary,
    fontSize: typography.size.bodyS,
    lineHeight: typography.lineHeight.bodyS,
    fontWeight: typography.weight.medium,
  },
  actionStack: {
    gap: spacing[12],
    marginBottom: spacing[16],
  },
  socialButton: {
    height: buttonHeights.medium,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[16],
    ...shadows.medium,
  },
  socialDisabled: {
    opacity: 0.6,
  },
  socialLeading: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialLabelWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialTrailing: {
    width: 24,
  },
  socialLabel: {
    color: colors.textPrimary,
    fontSize: typography.size.small,
    lineHeight: typography.lineHeight.small,
    fontWeight: typography.weight.semibold,
    textAlign: 'center',
    includeFontPadding: false,
  },
  googleMarkWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleMark: {
    fontSize: 24,
    lineHeight: 26,
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[10],
    marginBottom: spacing[16],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textTertiary,
    fontSize: typography.size.small,
    lineHeight: typography.lineHeight.small,
    fontWeight: typography.weight.semibold,
    letterSpacing: 0.8,
  },
  formSection: {
    gap: spacing[12],
    marginBottom: spacing[20],
  },
  label: {
    color: colors.textPrimary,
    fontSize: typography.size.caption,
    lineHeight: typography.lineHeight.caption,
    fontWeight: typography.weight.semibold,
  },
  inputWrap: {
    minHeight: 44,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    ...shadows.small,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.size.bodyS,
    lineHeight: typography.lineHeight.bodyS,
    paddingVertical: spacing[10],
  },
  primaryAction: {
    justifyContent: 'space-between',
    paddingHorizontal: spacing[16],
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[12],
    marginBottom: spacing[16],
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoftest,
  },
  infoCopy: {
    flex: 1,
    gap: spacing[8],
  },
  infoTitle: {
    color: colors.textPrimary,
    fontSize: typography.size.bodyS,
    lineHeight: typography.lineHeight.bodyS,
    fontWeight: typography.weight.bold,
  },
  infoBody: {
    color: colors.textTertiary,
    fontSize: typography.size.caption,
    lineHeight: typography.lineHeight.caption,
    fontWeight: typography.weight.regular,
  },
  manualRow: {
    minHeight: 48,
    borderRadius: radius.card,
    backgroundColor: 'rgba(255,255,255,0.86)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    paddingHorizontal: spacing[16],
    marginBottom: spacing[20],
  },
  manualIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.grayScale[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualCopyRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: spacing[8],
    rowGap: spacing[4],
  },
  manualLead: {
    color: colors.textTertiary,
    fontSize: typography.size.bodyS,
    lineHeight: typography.lineHeight.bodyS,
    fontWeight: typography.weight.medium,
  },
  manualAction: {
    color: colors.primary,
    fontSize: typography.size.bodyS,
    lineHeight: typography.lineHeight.bodyS,
    fontWeight: typography.weight.semibold,
  },
  manualPanel: {
    gap: spacing[12],
    paddingBottom: spacing[8],
  },
  manualHint: {
    color: colors.textTertiary,
    fontSize: typography.size.small,
    lineHeight: typography.lineHeight.small,
    marginTop: -spacing[4],
  },
  secondaryAction: {
    marginTop: spacing[4],
  },
});
