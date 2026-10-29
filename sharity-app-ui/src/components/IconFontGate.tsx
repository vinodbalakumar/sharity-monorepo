import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import { systemFontFamily } from '../theme/typography';

export function IconFontGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setStatus('loading');
    Promise.all([Ionicons.loadFont(), MaterialCommunityIcons.loadFont()]).then(
      () => {
        if (active) setStatus('ready');
      },
      (error: unknown) => {
        console.error('Unable to load application icon fonts:', error);
        if (active) setStatus('error');
      }
    );
    return () => { active = false; };
  }, [attempt]);

  if (status === 'ready') return children;

  function retry() {
    if (Platform.OS === 'web') {
      // Expo keeps failed web font-face rules, so retry from a fresh document.
      window.location.reload();
    } else {
      setAttempt(value => value + 1);
    }
  }

  return (
    <View style={styles.container} testID="icon-font-loading">
      {status === 'error' ? (
        <>
          <Text accessibilityRole="alert" style={styles.message}>
            Unable to load app icons. Check your connection and try again.
          </Text>
          <Pressable accessibilityRole="button" onPress={retry} style={styles.button}>
            <Text style={styles.buttonText}>Retry</Text>
          </Pressable>
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.message}>Loading Sharity...</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
    backgroundColor: colors.background
  },
  message: { fontFamily: systemFontFamily, color: colors.textSecondary, textAlign: 'center' },
  button: { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 24, paddingVertical: 12 },
  buttonText: { fontFamily: systemFontFamily, color: colors.white, fontWeight: '700' }
});
