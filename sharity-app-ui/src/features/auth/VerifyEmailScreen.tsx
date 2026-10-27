import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { verifyEmail } from '../../services/authApi';
import { authPalette, authSpacing } from './authTheme';

type Props = {
  onSignIn: () => void;
  token?: string | null;
};

export function VerifyEmailScreen({ onSignIn, token }: Props) {
  const { isMobile, width } = useResponsiveLayout();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const cardWidth = useMemo(() => Math.min(width - 32, 560), [width]);

  useEffect(() => {
    let mounted = true;

    async function run() {
      if (!token) {
        if (mounted) {
          setError('Verification token missing. Please request a new verification email.');
          setLoading(false);
        }
        return;
      }

      try {
        const response = await verifyEmail({ token });
        if (!mounted) {
          return;
        }
        setMessage(response.message || 'Email verified. You can now sign in.');
      } catch (nextError) {
        if (mounted) {
          setError(nextError instanceof Error ? nextError.message : 'Unable to verify email.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void run();
    return () => {
      mounted = false;
    };
  }, [token]);

  useEffect(() => {
    if (!message) {
      return undefined;
    }
    const timer = setTimeout(() => {
      onSignIn();
    }, 1600);
    return () => clearTimeout(timer);
  }, [message, onSignIn]);

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
              <Text style={styles.brandSubtitle}>Verify your email</Text>
            </View>
          </View>

          <Text style={styles.title}>Email verification</Text>
          <Text style={styles.subtitle}>We&apos;re confirming your account so you can sign in securely.</Text>

          <View style={styles.statusBox}>
            {loading ? (
              <View style={styles.statusRow}>
                <ActivityIndicator color={authPalette.accent} />
                <Text style={styles.statusText}>Verifying email...</Text>
              </View>
            ) : error ? (
              <View style={styles.statusRow}>
                <Ionicons color={authPalette.danger} name="alert-circle-outline" size={20} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : (
              <View style={styles.statusRow}>
                <Ionicons color={authPalette.success} name="checkmark-circle-outline" size={20} />
                <Text style={styles.successText}>{message}</Text>
              </View>
            )}
          </View>

          <Pressable accessibilityLabel="Go to sign in" onPress={onSignIn} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Go to sign in</Text>
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
  statusBox: {
    backgroundColor: authPalette.cardAlt,
    borderColor: authPalette.border,
    borderRadius: 18,
    borderWidth: 1,
    padding: authSpacing.md
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: authSpacing.sm
  },
  statusText: {
    color: authPalette.text,
    fontSize: 15,
    fontWeight: '800'
  },
  errorText: {
    color: authPalette.danger,
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20
  },
  successText: {
    color: authPalette.success,
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: authPalette.accent,
    borderRadius: 999,
    height: 58,
    justifyContent: 'center'
  },
  primaryButtonText: {
    color: authPalette.white,
    fontSize: 16,
    fontWeight: '900'
  }
});
