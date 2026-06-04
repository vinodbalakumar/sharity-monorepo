import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppLoadingIndicator } from '../../components/ui';
import { colors, spacing } from '../../theme';

type SplashScreenProps = {
  isTakingLonger: boolean;
};

export function SplashScreen({ isTakingLonger }: SplashScreenProps) {
  const { width } = useWindowDimensions();
  const isLarge = width >= 768;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={[styles.content, isLarge && styles.contentLarge]}>
        <View style={[styles.logo, isLarge && styles.logoLarge]}>
          <Text style={[styles.logoLetter, isLarge && styles.logoLetterLarge]}>S</Text>
        </View>
        <Text style={[styles.appName, isLarge && styles.appNameLarge]}>Sharity</Text>
        <Text style={[styles.tagline, isLarge && styles.taglineLarge]}>The only Trusted marketplace.</Text>
        <AppLoadingIndicator style={styles.loader} />
        {isTakingLonger ? <Text style={styles.delayText}>Taking longer than expected...</Text> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.white,
    flex: 1
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 'auto',
    maxWidth: 480,
    padding: spacing.xl,
    width: '100%'
  },
  contentLarge: {
    padding: spacing.xxxl
  },
  logo: {
    alignItems: 'center',
    borderColor: colors.black,
    borderRadius: 24,
    borderWidth: 2,
    height: 72,
    justifyContent: 'center',
    width: 72
  },
  logoLarge: {
    borderRadius: 30,
    height: 92,
    width: 92
  },
  logoLetter: {
    color: colors.black,
    fontSize: 34,
    fontWeight: '900'
  },
  logoLetterLarge: {
    fontSize: 44
  },
  appName: {
    color: colors.black,
    fontSize: 34,
    fontWeight: '900',
    marginTop: spacing.lg
  },
  appNameLarge: {
    fontSize: 44
  },
  tagline: {
    color: colors.black,
    fontSize: 16,
    lineHeight: 24,
    marginTop: spacing.sm,
    textAlign: 'center'
  },
  taglineLarge: {
    fontSize: 18,
    lineHeight: 28
  },
  loader: {
    marginTop: spacing.lg
  },
  delayText: {
    color: colors.gray700,
    fontSize: 13,
    marginTop: spacing.md,
    textAlign: 'center'
  }
});
