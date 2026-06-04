import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppSearchBar } from '../../components/ui';
import { colors, radii, spacing } from '../../theme';
import { featureCards, footerGroups, topCategories, trustLabels } from './welcomeContent';

export function WelcomeScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 720;
  const isWeb = Platform.OS === 'web';
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, isMobile && styles.headerMobile]}>
          <View style={styles.brandWrap}>
            <View style={styles.brandMark}>
              <Text style={styles.brandLetter}>S</Text>
            </View>
            <Text style={styles.brandName}>Sharity</Text>
          </View>

          {isMobile ? (
            <Pressable accessibilityLabel="Search products" accessibilityRole="button" style={styles.searchIconButton}>
              <Ionicons color={colors.black} name="search" size={20} />
            </Pressable>
          ) : (
            <AppSearchBar
              onChangeText={setSearchQuery}
              placeholder="Search for products, categories, codes"
              style={styles.searchBar}
              value={searchQuery}
            />
          )}

          <View style={styles.headerActions}>
            <Pressable accessibilityRole="button" style={styles.signInButton}>
              <Text style={styles.signInText}>Sign In</Text>
            </Pressable>
            <Pressable accessibilityRole="button" style={styles.headerCta}>
              <Text style={styles.headerCtaText}>Get Started</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.hero, isMobile && styles.heroMobile]}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroKicker}>Digital-first marketplace</Text>
            <Text style={[styles.heroTitle, isMobile && styles.heroTitleMobile]}>
              Buy and sell digital products with trust
            </Text>
            <Text style={styles.heroSubtitle}>
              Discover digital codes, electronics, gaming codes, software keys, gift cards, subscriptions, and trusted
              digital products in one secure marketplace.
            </Text>
            <View style={styles.heroActions}>
              <Pressable accessibilityRole="button" style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Get Started Free</Text>
                <Ionicons color={colors.white} name="arrow-forward" size={18} />
              </Pressable>
              <Pressable accessibilityRole="button" style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Browse Products</Text>
              </Pressable>
            </View>
            <View style={styles.trustStrip}>
              {trustLabels.map((label) => (
                <View key={label} style={styles.trustPill}>
                  <Ionicons color={colors.accent} name="checkmark-circle" size={16} />
                  <Text style={styles.trustText}>{label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionKicker}>Guest browsing enabled</Text>
            <Text style={styles.sectionTitle}>Top Categories</Text>
          </View>
          <Pressable accessibilityRole="button" style={styles.viewAll}>
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons color={colors.accent} name="arrow-forward" size={17} />
          </Pressable>
        </View>

        <View style={styles.categoryGrid}>
          {topCategories.map((category) => (
            <Pressable accessibilityRole="button" key={category.name} style={styles.categoryCard}>
              <View style={styles.categoryMedia}>
                <Text style={styles.categoryBadge}>{category.access}</Text>
                <View>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryNote}>{category.note}</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.whySection}>
          <Text style={styles.whyTitle}>Why Choose Sharity?</Text>
          <Text style={styles.whySubtitle}>
            The trusted marketplace for digital buyers, sellers, and electronics shoppers.
          </Text>
          <View style={styles.featureGrid}>
            {featureCards.map((feature) => (
              <View key={feature.title} style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <Ionicons color={colors.accent} name={feature.icon} size={26} />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Ready to browse trusted digital products?</Text>
          <Text style={styles.ctaText}>
            Browse as a guest, then sign in when you purchase, reveal codes, download products, or manage seller actions.
          </Text>
          <Pressable accessibilityRole="button" style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Get Started Free</Text>
            <Ionicons color={colors.white} name="arrow-forward" size={18} />
          </Pressable>
        </View>

        {isWeb ? (
          <View style={styles.footer}>
            <View style={styles.footerGrid}>
              {footerGroups.map((group) => (
                <View key={group.title} style={styles.footerGroup}>
                  <Text style={styles.footerTitle}>{group.title}</Text>
                  {group.links.map((link) => (
                    <Text key={link} style={styles.footerLink}>
                      {link}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
            <Text style={styles.copyright}>© 2026 Sharity. All rights reserved.</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.midnight,
    flex: 1
  },
  page: {
    backgroundColor: colors.midnight,
    paddingBottom: spacing.xl
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 64,
    paddingHorizontal: spacing.xl
  },
  headerMobile: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md
  },
  brandWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minWidth: 128
  },
  brandMark: {
    alignItems: 'center',
    backgroundColor: colors.black,
    borderColor: colors.black,
    borderWidth: 1,
    borderRadius: radii.md,
    height: 40,
    justifyContent: 'center',
    width: 40
  },
  brandLetter: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '900'
  },
  brandName: {
    color: colors.black,
    fontSize: 20,
    fontWeight: '900'
  },
  searchBar: {
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    maxWidth: 430,
    minHeight: 42,
    paddingHorizontal: spacing.md
  },
  searchInput: {
    color: colors.black,
    flex: 1,
    fontSize: 14,
    minWidth: 160
  },
  searchIconButton: {
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    marginLeft: 'auto',
    width: 40
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginLeft: 'auto'
  },
  signInButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm
  },
  signInText: {
    color: colors.black,
    fontSize: 14,
    fontWeight: '800'
  },
  headerCta: {
    backgroundColor: colors.ruby,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  headerCtaText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '900'
  },
  hero: {
    backgroundColor: colors.ink,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    margin: spacing.xl,
    overflow: 'hidden',
    padding: spacing.xxl
  },
  heroMobile: {
    margin: spacing.md,
    padding: spacing.lg
  },
  heroCopy: {
    maxWidth: 820
  },
  heroKicker: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '900',
    marginBottom: spacing.md,
    textTransform: 'uppercase'
  },
  heroTitle: {
    color: colors.black,
    fontSize: 52,
    fontWeight: '900',
    lineHeight: 60,
    maxWidth: 780
  },
  heroTitleMobile: {
    fontSize: 34,
    lineHeight: 42
  },
  heroSubtitle: {
    color: colors.softText,
    fontSize: 18,
    lineHeight: 28,
    marginTop: spacing.md,
    maxWidth: 760
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xl
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.electric,
    borderRadius: radii.md,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.lg
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '900'
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radii.md,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.lg
  },
  secondaryButtonText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: '900'
  },
  trustStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xl
  },
  trustPill: {
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  trustText: {
    color: colors.black,
    fontSize: 13,
    fontWeight: '800'
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl
  },
  sectionKicker: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  sectionTitle: {
    color: colors.black,
    fontSize: 30,
    fontWeight: '900',
    marginTop: spacing.xs
  },
  viewAll: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs
  },
  viewAllText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '900'
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    padding: spacing.xl
  },
  categoryCard: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    flexBasis: 260,
    flexGrow: 1,
    minWidth: 230,
    overflow: 'hidden'
  },
  categoryMedia: {
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 220,
    padding: spacing.md
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.black,
    borderRadius: radii.sm,
    color: colors.white,
    fontSize: 12,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  categoryName: {
    color: colors.black,
    fontSize: 20,
    fontWeight: '900'
  },
  categoryNote: {
    color: colors.softText,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.xs
  },
  whySection: {
    alignItems: 'center',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl
  },
  whyTitle: {
    color: colors.black,
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center'
  },
  whySubtitle: {
    color: colors.softText,
    fontSize: 17,
    lineHeight: 26,
    marginTop: spacing.sm,
    textAlign: 'center'
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.xl,
    width: '100%'
  },
  featureCard: {
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexBasis: 230,
    flexGrow: 1,
    padding: spacing.lg
  },
  featureIcon: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 58,
    justifyContent: 'center',
    width: 58
  },
  featureTitle: {
    color: colors.black,
    fontSize: 18,
    fontWeight: '900',
    marginTop: spacing.md,
    textAlign: 'center'
  },
  featureText: {
    color: colors.softText,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.sm,
    textAlign: 'center'
  },
  ctaSection: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl
  },
  ctaTitle: {
    color: colors.black,
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center'
  },
  ctaText: {
    color: colors.softText,
    fontSize: 17,
    lineHeight: 26,
    marginBottom: spacing.xl,
    marginTop: spacing.sm,
    maxWidth: 720,
    textAlign: 'center'
  },
  footer: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    padding: spacing.xl
  },
  footerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xl,
    justifyContent: 'space-between'
  },
  footerGroup: {
    gap: spacing.sm,
    minWidth: 180
  },
  footerTitle: {
    color: colors.black,
    fontSize: 15,
    fontWeight: '900'
  },
  footerLink: {
    color: colors.softText,
    fontSize: 14
  },
  copyright: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    color: colors.softText,
    fontSize: 13,
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    textAlign: 'center'
  }
});
