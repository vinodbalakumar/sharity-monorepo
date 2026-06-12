import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Column } from '../../components/ui';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { colors, spacing } from '../../theme';

type SplashScreenProps = {
  isTakingLonger: boolean;
};

export function SplashScreen({ isTakingLonger }: SplashScreenProps) {
  const { isTablet } = useResponsiveLayout();
  const isLarge = isTablet;
  const logoSize = isLarge ? 92 : 72;
  const logoRadius = isLarge ? 30 : 24;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Column
        align="center"
        justify="center"
        gap="md"
        style={{
          flex: 1,
          paddingHorizontal: spacing.lg,
          paddingVertical: isLarge ? spacing['6xl'] : spacing.xl,
          maxWidth: 480,
          marginHorizontal: 'auto',
          width: '100%'
        }}
      >
        {/* Logo */}
        <View
          style={{
            width: logoSize,
            height: logoSize,
            borderRadius: logoRadius,
            borderWidth: 2,
            borderColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.surfaceVariant
          }}
        >
          <AppText
            variant={isLarge ? 'hero' : 'display'}
            color="primary"
            weight="bold"
            style={{ fontSize: isLarge ? 44 : 34 }}
          >
            S
          </AppText>
        </View>

        {/* App name */}
        <AppText
          variant={isLarge ? 'hero' : 'pageTitle'}
          color="primary"
          weight="bold"
          style={{ marginTop: spacing.lg }}
        >
          Sharity
        </AppText>

        {/* Tagline */}
        <AppText
          variant={isLarge ? 'body' : 'bodySmall'}
          color="secondary"
          align="center"
          style={{ marginTop: spacing.sm }}
        >
          The only Trusted marketplace.
        </AppText>

        {/* Loading indicator */}
        <View style={{ marginTop: spacing.lg }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>

        {/* Delay message */}
        {isTakingLonger && (
          <AppText
            variant="caption"
            color="muted"
            align="center"
            style={{ marginTop: spacing.md }}
          >
            Taking longer than expected...
          </AppText>
        )}
      </Column>
    </SafeAreaView>
  );
}
