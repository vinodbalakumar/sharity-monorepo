import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { authPalette, authSpacing } from './authTheme';
import { forgotPassword, resetPassword } from '../../services/authApi';

type ForgotProps = {
  onSignIn: () => void;
};

type ResetProps = {
  onSignIn: () => void;
  resetToken?: string | null;
};

export function ForgotPasswordScreen({ onSignIn }: ForgotProps) {
  const { isMobile, width } = useResponsiveLayout();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const cardWidth = useMemo(() => Math.min(width - 32, 560), [width]);

  async function submit() {
    if (submitting) {
      return;
    }
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Email is required.');
      setMessage(null);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Enter a valid email address.');
      setMessage(null);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await forgotPassword(trimmedEmail);
      setMessage(response.message || 'If your email exists, we sent password reset instructions.');
      if (response.resetToken && Platform.OS === 'web') {
        window.location.assign(`/app/reset-password?token=${encodeURIComponent(response.resetToken)}`);
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to start password recovery.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { width: cardWidth }, isMobile && styles.cardMobile]}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Text style={styles.brandLetter}>S</Text>
            </View>
            <View style={styles.brandCopy}>
              <Text style={styles.brandTitle}>Sharity</Text>
              <Text style={styles.brandSubtitle}>Account recovery</Text>
            </View>
          </View>

          <Text style={styles.title}>Forgot password?</Text>
          <Text style={styles.subtitle}>
            Enter the email address linked to your account. We&apos;ll send a secure reset link if the account exists.
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrap}>
              <Ionicons color={authPalette.textMuted} name="mail-outline" size={18} />
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                keyboardType="email-address"
                onChangeText={(value) => {
                  setEmail(value);
                  setError(null);
                  setMessage(null);
                }}
                onSubmitEditing={submit}
                placeholder="you@example.com"
                placeholderTextColor={authPalette.textMuted}
                style={styles.input}
                value={email}
              />
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {message ? <Text style={styles.successText}>{message}</Text> : null}

          <Pressable
            accessibilityLabel="Send password reset link"
            onPress={submit}
            style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
          >
            {submitting ? <ActivityIndicator color={authPalette.white} /> : <Text style={styles.primaryButtonText}>Send reset link</Text>}
          </Pressable>

          <Pressable accessibilityLabel="Back to sign in" onPress={onSignIn} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Back to sign in</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function ResetPasswordScreen({ onSignIn, resetToken }: ResetProps) {
  const { isMobile, width } = useResponsiveLayout();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const cardWidth = useMemo(() => Math.min(width - 32, 560), [width]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onSignIn();
      }, 1600);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [message, onSignIn]);

  async function submit() {
    if (submitting) {
      return;
    }
    if (!resetToken) {
      setError('This reset link is missing its token. Please request a new one.');
      return;
    }
    if (!password) {
      setError('New password is required.');
      return;
    }
    if (password.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await resetPassword({ newPassword: password, token: resetToken });
      setMessage(response.message || 'Password reset complete. Redirecting to sign in...');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to reset password.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { width: cardWidth }, isMobile && styles.cardMobile]}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Text style={styles.brandLetter}>S</Text>
            </View>
            <View style={styles.brandCopy}>
              <Text style={styles.brandTitle}>Sharity</Text>
              <Text style={styles.brandSubtitle}>Set a new password</Text>
            </View>
          </View>

          <Text style={styles.title}>Reset your password</Text>
          <Text style={styles.subtitle}>Choose a strong password that you have not used elsewhere.</Text>

          {!resetToken ? <Text style={styles.errorText}>Reset token not found. Please request a new password reset link.</Text> : null}

          <View style={styles.field}>
            <Text style={styles.label}>New password</Text>
            <View style={styles.inputWrap}>
              <Ionicons color={authPalette.textMuted} name="lock-closed-outline" size={18} />
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={(value) => {
                  setPassword(value);
                  setError(null);
                  setMessage(null);
                }}
                onSubmitEditing={submit}
                placeholder="Minimum 8 characters"
                placeholderTextColor={authPalette.textMuted}
                secureTextEntry
                style={styles.input}
                value={password}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Confirm password</Text>
            <View style={styles.inputWrap}>
              <Ionicons color={authPalette.textMuted} name="lock-closed-outline" size={18} />
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={(value) => {
                  setConfirmPassword(value);
                  setError(null);
                  setMessage(null);
                }}
                onSubmitEditing={submit}
                placeholder="Re-enter your password"
                placeholderTextColor={authPalette.textMuted}
                secureTextEntry
                style={styles.input}
                value={confirmPassword}
              />
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {message ? <Text style={styles.successText}>{message}</Text> : null}

          <Pressable
            accessibilityLabel="Reset password"
            onPress={submit}
            style={[styles.primaryButton, submitting && styles.primaryButtonDisabled, !resetToken && styles.primaryButtonDisabled]}
            disabled={!resetToken || submitting}
          >
            {submitting ? <ActivityIndicator color={authPalette.white} /> : <Text style={styles.primaryButtonText}>Reset password</Text>}
          </Pressable>

          <Pressable accessibilityLabel="Back to sign in" onPress={onSignIn} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Back to sign in</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: authPalette.cardAlt,
    flex: 1
  },
  scrollContent: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    padding: authSpacing.lg
  },
  card: {
    backgroundColor: authPalette.card,
    borderColor: authPalette.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: authSpacing.md,
    maxWidth: 560,
    padding: authSpacing.xl,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { height: 18, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 12
  },
  cardMobile: {
    padding: authSpacing.lg
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: authSpacing.md
  },
  brandMark: {
    alignItems: 'center',
    backgroundColor: authPalette.accent,
    borderRadius: 18,
    height: 54,
    justifyContent: 'center',
    width: 54
  },
  brandLetter: {
    color: authPalette.white,
    fontSize: 22,
    fontWeight: '900'
  },
  brandCopy: {
    gap: 2
  },
  brandTitle: {
    color: authPalette.text,
    fontSize: 22,
    fontWeight: '900'
  },
  brandSubtitle: {
    color: authPalette.textMuted,
    fontSize: 13,
    fontWeight: '700'
  },
  title: {
    color: authPalette.text,
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 38,
    marginTop: authSpacing.sm
  },
  subtitle: {
    color: authPalette.textMuted,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22
  },
  field: {
    gap: 8,
    marginTop: authSpacing.sm
  },
  label: {
    color: authPalette.text,
    fontSize: 14,
    fontWeight: '800'
  },
  inputWrap: {
    alignItems: 'center',
    backgroundColor: authPalette.input,
    borderColor: authPalette.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: authSpacing.sm,
    minHeight: 60,
    paddingHorizontal: authSpacing.md
  },
  input: {
    color: authPalette.text,
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    minHeight: 60,
    outlineStyle: 'none' as never,
    paddingVertical: 0
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: authPalette.accent,
    borderRadius: 999,
    height: 58,
    justifyContent: 'center',
    marginTop: authSpacing.md
  },
  primaryButtonDisabled: {
    opacity: 0.72
  },
  primaryButtonText: {
    color: authPalette.white,
    fontSize: 16,
    fontWeight: '900'
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: authPalette.cardAlt,
    borderColor: authPalette.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center'
  },
  secondaryButtonText: {
    color: authPalette.text,
    fontSize: 15,
    fontWeight: '900'
  },
  errorText: {
    color: authPalette.danger,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20
  },
  successText: {
    color: authPalette.success,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20
  }
});
