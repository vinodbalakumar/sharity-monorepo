import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { mobileTabItems, sidebarItems } from '../../features/home/dashboardConfig';
import { colors, spacing } from '../../theme';
import type { AppRoute } from '../../types/navigation';

export function InteriorShell({ activeLabel, children, onNavigate, scrollable = true, subtitle, title }: Props) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.shell}>
        {isDesktop ? <Sidebar activeLabel={activeLabel} onNavigate={onNavigate} /> : null}
        <View style={styles.main}>
          <Header onNavigate={onNavigate} subtitle={subtitle} title={title} />
          {scrollable ? (
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              {children}
            </ScrollView>
          ) : (
            <View style={[styles.content, styles.contentNonScroll]}>{children}</View>
          )}
        </View>
      </View>
      {!isDesktop ? <BottomTabs activeLabel={activeLabel} onNavigate={onNavigate} /> : null}
    </SafeAreaView>
  );
}

function Sidebar({ activeLabel, onNavigate }: { activeLabel?: string; onNavigate: (route: AppRoute | string) => void }) {
  return (
    <View style={styles.sidebar}>
      <Pressable onPress={() => onNavigate('home')} style={styles.sidebarBrand}>
        <View style={styles.brandMark}>
          <Text style={styles.brandLetter}>S</Text>
        </View>
        <View>
          <Text style={styles.sidebarTitle}>Sharity</Text>
          <Text style={styles.sidebarSubcopy}>United States</Text>
        </View>
      </Pressable>
      <View style={styles.sidebarList}>
        {sidebarItems.map((item) => (
          <Pressable
            key={item.label}
            onPress={() => onNavigate(routeForLabel(item.label))}
            style={[styles.sidebarItem, activeLabel === item.label && styles.sidebarItemActive]}
          >
            <Ionicons color={activeLabel === item.label ? colors.white : colors.textPrimary} name={item.icon} size={19} />
            <Text style={[styles.sidebarItemText, activeLabel === item.label && styles.sidebarItemTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function Header({ onNavigate, subtitle, title }: { onNavigate: (route: AppRoute | string) => void; subtitle?: string; title: string }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={() => onNavigate('home')} style={styles.headerBrand}>
        <View style={styles.brandMarkSmall}>
          <Text style={styles.brandLetterSmall}>S</Text>
        </View>
        <View>
          <Text style={styles.headerTitle}>Sharity</Text>
          <Text style={styles.headerSubtitle}>{subtitle ?? title}</Text>
        </View>
      </Pressable>
      <View style={styles.headerActions}>
        <Pressable accessibilityLabel="Cart" onPress={() => onNavigate('cart')} style={styles.iconButton}>
          <Ionicons color={colors.textPrimary} name="cart-outline" size={20} />
        </Pressable>
        <Pressable accessibilityLabel="Notifications" onPress={() => onNavigate('notifications')} style={styles.iconButton}>
          <Ionicons color={colors.textPrimary} name="notifications-outline" size={20} />
        </Pressable>
        <Pressable accessibilityLabel="Profile" onPress={() => onNavigate('profilePrivacy')} style={styles.iconButton}>
          <Ionicons color={colors.textPrimary} name="person-outline" size={20} />
        </Pressable>
      </View>
    </View>
  );
}

function BottomTabs({ activeLabel, onNavigate }: { activeLabel?: string; onNavigate: (route: AppRoute | string) => void }) {
  return (
    <View style={styles.bottomTabs}>
      {mobileTabItems.map((item) => (
        <Pressable key={item.label} onPress={() => onNavigate(routeForLabel(item.label))} style={styles.bottomTab}>
          <Ionicons color={activeLabel === item.label ? colors.primary : colors.textSecondary} name={item.icon} size={19} />
          <Text style={[styles.bottomTabText, activeLabel === item.label && styles.bottomTabTextActive]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function routeForLabel(label: string): AppRoute {
  switch (label) {
    case 'Marketplace':
      return 'marketplaces';
    case 'Orders':
    case 'My Orders':
      return 'orders';
    case 'Rewards':
      return 'rewards';
    case 'Cart':
      return 'cart';
    case 'Sell':
      return 'sellerVerification';
    case 'Wallet':
      return 'wallet';
    case 'Profile':
      return 'profilePrivacy';
    default:
      return 'home';
  }
}

type Props = {
  activeLabel?: string;
  children: ReactNode;
  onNavigate: (route: AppRoute | string) => void;
  subtitle?: string;
  title: string;
  scrollable?: boolean;
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1
  },
  shell: {
    backgroundColor: colors.background,
    flex: 1,
    flexDirection: 'row'
  },
  sidebar: {
    backgroundColor: colors.surface,
    borderRightColor: colors.border,
    borderRightWidth: 1,
    padding: spacing.lg,
    width: 260
  },
  sidebarBrand: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xs
  },
  brandMark: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    shadowColor: colors.gray600,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    width: 48
  },
  brandMarkSmall: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 40,
    justifyContent: 'center',
    width: 40
  },
  brandLetter: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '900'
  },
  brandLetterSmall: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '900'
  },
  sidebarTitle: {
    color: colors.textPrimary,
    fontSize: 21,
    fontWeight: '900'
  },
  sidebarSubcopy: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2
  },
  sidebarList: {
    gap: spacing.sm
  },
  sidebarItem: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 14
  },
  sidebarItemActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  sidebarItemText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800'
  },
  sidebarItemTextActive: {
    color: colors.white
  },
  main: {
    flex: 1
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 70,
    paddingHorizontal: spacing.xl
  },
  headerBrand: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '900'
  },
  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44
  },
  content: {
    gap: spacing.xl,
    padding: spacing.xl,
    paddingBottom: spacing.lg * 3
  },
  contentNonScroll: {
    flex: 1,
    minHeight: 0
  },
  bottomTabs: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.sm
  },
  bottomTab: {
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 58
  },
  bottomTabText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700'
  },
  bottomTabTextActive: {
    color: colors.primary,
    fontWeight: '900'
  }
});
