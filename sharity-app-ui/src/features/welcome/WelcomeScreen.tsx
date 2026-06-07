import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getMarketplaceHome } from '../../services/marketplaceApi';
import type { VisitorContextResponse } from '../../services/publicContentApi';
import { PublicSiteFooter } from '../../components/publicSite/PublicSiteFooter';
import { spacing } from '../../theme';
import type { MarketplaceCategory, MarketplaceHomeResponse } from '../../types/marketplace';
import { featureCards, footerGroups } from './welcomeContent';

type WelcomeScreenProps = {
  onBrowse: () => void;
  onGetStarted: () => void;
  onOpenPublicContent: (slug: string) => void;
  onSignIn: () => void;
  visitorContext: VisitorContextResponse | null;
};

const brandLogos = ['Featured in', 'Apple', 'Samsung', 'Nike', 'Adidas', 'Sony', 'LG'];
const stats = [
  ['10M+', 'Active Users'],
  ['50K+', 'Sellers'],
  ['100M+', 'Products'],
  ['4.8★', 'User Rating']
];

const webHeroGradient = Platform.OS === 'web'
  ? ({ backgroundImage: 'linear-gradient(112deg, #681CA2 0%, #293F98 48%, #681CA2 100%)' } as never)
  : null;
const ratingStat = ['4.8*', 'User Rating'];

export function WelcomeScreen({ onBrowse, onGetStarted, onOpenPublicContent, onSignIn, visitorContext }: WelcomeScreenProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 760;
  const isWeb = Platform.OS === 'web';
  const [searchQuery, setSearchQuery] = useState('');
  const [home, setHome] = useState<MarketplaceHomeResponse | null>(null);
  const [homeLoading, setHomeLoading] = useState(true);
  const [homeError, setHomeError] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadPublicMarketplaceHome() {
      try {
        const countryQuery = visitorContext?.countryCode ? `?countryCode=${encodeURIComponent(visitorContext.countryCode)}` : '';
        const response = await getMarketplaceHome(countryQuery);
        if (mounted) {
          setHome(response);
          setHomeError(false);
        }
      } catch {
        if (mounted) {
          setHome(null);
          setHomeError(true);
        }
      } finally {
        if (mounted) {
          setHomeLoading(false);
        }
      }
    }

    loadPublicMarketplaceHome();

    return () => {
      mounted = false;
    };
  }, [visitorContext?.countryCode]);

  const topCategories = useMemo(() => buildTopCategories(home), [home]);
  const activeVerticals = useMemo(
    () => (home?.verticals ?? []).filter((vertical) => vertical.status === 'ACTIVE' && vertical.availableToCustomer),
    [home]
  );

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

          {!isMobile ? (
            <View style={styles.searchBar}>
              <Ionicons color={palette.textMuted} name="search-outline" size={18} />
              <TextInput
                onChangeText={setSearchQuery}
                placeholder="Search for products, categories"
                placeholderTextColor={palette.textMuted}
                style={styles.searchInput}
                value={searchQuery}
              />
            </View>
          ) : null}

          <View style={styles.headerActions}>
            <Pressable onPress={onSignIn} style={styles.signInButton}>
              <Text style={styles.signInText}>Sign In</Text>
            </Pressable>
            <Pressable onPress={onGetStarted} style={styles.headerCta}>
              <Text style={styles.headerCtaText}>Get Started</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.hero, webHeroGradient, isMobile && styles.heroMobile]}>
          <Text style={[styles.heroTitle, isMobile && styles.heroTitleMobile]}>EVERYTHING{'\n'}YOU NEED</Text>
          <Text style={styles.heroSubtitle}>BUY AND SELL SAFELY</Text>
          <View style={styles.heroActions}>
            <Pressable onPress={onGetStarted} style={styles.heroPrimary}>
              <Text style={styles.heroPrimaryText}>Get Started Free</Text>
            </Pressable>
            <Pressable onPress={onSignIn} style={styles.heroSecondary}>
              <Text style={styles.heroSecondaryText}>Sign In</Text>
            </Pressable>
          </View>
          <View style={styles.featuredRow}>
            {brandLogos.map((item, index) => (
              <Text key={item} style={[styles.featuredText, index === 0 && styles.featuredMuted]}>
                {item}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>TOP CATEGORIES</Text>
          <Pressable onPress={onBrowse} style={styles.viewAll}>
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons color={palette.blue} name="arrow-forward" size={18} />
          </Pressable>
        </View>

        <View style={styles.categoryGrid}>
          {homeLoading ? (
            <View style={styles.apiState}>
              <Ionicons color={palette.blue} name="sync-outline" size={22} />
              <Text style={styles.apiStateText}>Loading marketplace categories...</Text>
            </View>
          ) : null}
          {homeError ? (
            <View style={styles.apiState}>
              <Ionicons color={palette.blue} name="alert-circle-outline" size={22} />
              <Text style={styles.apiStateText}>Marketplace categories are unavailable from the backend right now.</Text>
            </View>
          ) : null}
          {!homeLoading && !homeError && topCategories.length === 0 ? (
            <View style={styles.apiState}>
              <Ionicons color={palette.blue} name="file-tray-outline" size={22} />
              <Text style={styles.apiStateText}>No active public categories are enabled for this region.</Text>
            </View>
          ) : null}
          {topCategories.map((category) => (
            <Pressable key={category.code} onPress={onBrowse} style={styles.categoryCard}>
              {category.imageUrl ? (
                <ImageBackground imageStyle={styles.categoryImage} source={{ uri: category.imageUrl }} style={styles.categoryImageWrap}>
                  <View style={styles.categoryOverlay} />
                  <View style={styles.categoryCopy}>
                    <View style={styles.categoryIconPill}>
                      <Ionicons color={palette.white} name={category.icon} size={16} />
                    </View>
                    <Text style={styles.categoryCount}>{category.countLabel}</Text>
                    <Text style={styles.categoryName}>{category.name}</Text>
                  </View>
                </ImageBackground>
              ) : (
                <View style={[styles.categoryImageWrap, styles.categoryNoImage]}>
                  <View style={styles.categoryCopy}>
                    <View style={styles.categoryIconPill}>
                      <Ionicons color={palette.white} name={category.icon} size={16} />
                    </View>
                    <Text style={styles.categoryCount}>Image pending from API</Text>
                    <Text style={styles.categoryName}>{category.name}</Text>
                  </View>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        <View style={styles.whySection}>
          <Text style={styles.whyTitle}>Why Choose Sharity?</Text>
          <Text style={styles.whySubtitle}>The safest marketplace for buyers and sellers</Text>
          <View style={styles.featureGrid}>
            {featureCards.map((feature) => (
              <View key={feature.title} style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <Ionicons color={palette.blue} name={feature.icon} size={30} />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.statsBand}>
          {(activeVerticals.length > 0
            ? [
                [`${activeVerticals.length}`, 'Active Marketplaces'],
                [`${home?.categories.filter((category) => category.active).length ?? 0}`, 'Live Categories'],
                [`${home?.featuredListings.length ?? 0}`, 'Featured Listings'],
                ratingStat
              ]
            : stats
          ).map(([value, label]) => (
            <View key={label} style={styles.statItem}>
              <Text style={styles.statValue}>{value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.ctaSection}>
          <Text style={[styles.ctaTitle, isMobile && styles.ctaTitleMobile]}>Ready to Start Shopping?</Text>
          <Text style={styles.ctaText}>Join millions of users and experience the future of online shopping</Text>
          <Pressable onPress={onGetStarted} style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>Create Free Account</Text>
            <Ionicons color={palette.white} name="arrow-forward" size={18} />
          </Pressable>
        </View>

        {isWeb ? <PublicSiteFooter groups={footerGroups} onLinkPress={onOpenPublicContent} visitorContext={visitorContext} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

type LandingCategory = {
  code: string;
  countLabel: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  imageUrl: string | null;
  name: string;
};

function buildTopCategories(home: MarketplaceHomeResponse | null): LandingCategory[] {
  if (!home) {
    return [];
  }

  const seenNames = new Set<string>();
  const featuredCountByCategory = new Map<string, number>();

  home.featuredListings.forEach((listing) => {
    featuredCountByCategory.set(listing.categoryCode, (featuredCountByCategory.get(listing.categoryCode) ?? 0) + 1);
  });

  return home.categories
    .filter((category) => category.active)
    .filter((category) => {
      const key = category.name.toLowerCase();
      if (seenNames.has(key)) {
        return false;
      }
      seenNames.add(key);
      return true;
    })
    .slice(0, 6)
    .map((category) => ({
      code: category.code,
      countLabel: countLabelFor(featuredCountByCategory.get(category.code) ?? 0),
      icon: iconForCategory(category),
      imageUrl: imageForCategory(category, home),
      name: category.name
    }));
}

function countLabelFor(count: number) {
  if (count === 0) {
    return 'Backend enabled';
  }
  return count === 1 ? '1 featured listing' : `${count} featured listings`;
}

function iconForCategory(category: MarketplaceCategory): ComponentProps<typeof Ionicons>['name'] {
  const value = `${category.code} ${category.verticalCode} ${category.iconRef ?? ''}`.toLowerCase();
  if (value.includes('gift')) return 'gift-outline';
  if (value.includes('auto') || value.includes('car')) return 'car-outline';
  if (value.includes('grocery') || value.includes('food')) return 'basket-outline';
  if (value.includes('meat') || value.includes('seafood')) return 'restaurant-outline';
  if (value.includes('pharmacy') || value.includes('wellness') || value.includes('care')) return 'medkit-outline';
  if (value.includes('game')) return 'game-controller-outline';
  if (value.includes('electronic') || value.includes('devices')) return 'phone-portrait-outline';
  if (value.includes('fashion') || value.includes('jewellery')) return 'diamond-outline';
  return 'grid-outline';
}

function imageForCategory(category: MarketplaceCategory, home: MarketplaceHomeResponse) {
  const directMatch = home.featuredListings.find((listing) => listing.categoryCode === category.code && listing.imageUrl);
  if (directMatch?.imageUrl) {
    return directMatch.imageUrl;
  }

  const verticalMatch = home.featuredListings.find((listing) => listing.verticalCode === category.verticalCode && listing.imageUrl);
  return verticalMatch?.imageUrl ?? null;
}

const palette = {
  blue: '#3B82F6',
  border: '#20284A',
  card: '#111936',
  header: '#0D132B',
  heroEnd: '#6D1AA5',
  heroStart: '#243C96',
  page: '#0B1028',
  purple: '#A335F5',
  purpleSoft: '#25205C',
  text: '#F8FAFC',
  textMuted: '#8FA0BF',
  white: '#FFFFFF'
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: palette.page,
    flex: 1
  },
  page: {
    backgroundColor: palette.page,
    paddingBottom: 0
  },
  header: {
    alignItems: 'center',
    backgroundColor: palette.header,
    borderBottomColor: palette.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.lg,
    minHeight: 74,
    paddingHorizontal: 32
  },
  headerMobile: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md
  },
  brandWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minWidth: 130
  },
  brandMark: {
    alignItems: 'center',
    backgroundColor: '#7C5CFF',
    borderRadius: 10,
    height: 40,
    justifyContent: 'center',
    width: 40
  },
  brandLetter: {
    color: palette.white,
    fontSize: 20,
    fontWeight: '900'
  },
  brandName: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '900'
  },
  searchBar: {
    alignItems: 'center',
    backgroundColor: '#161D3B',
    borderColor: palette.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    height: 42,
    maxWidth: 310,
    paddingHorizontal: spacing.md,
    width: '28%'
  },
  searchInput: {
    color: palette.text,
    flex: 1,
    fontSize: 14,
    outlineStyle: 'none' as never
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginLeft: 'auto'
  },
  signInButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  signInText: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '900'
  },
  headerCta: {
    backgroundColor: palette.purple,
    borderRadius: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12
  },
  headerCtaText: {
    color: palette.white,
    fontSize: 14,
    fontWeight: '900'
  },
  hero: {
    backgroundColor: palette.heroEnd,
    borderRadius: 16,
    margin: 32,
    minHeight: 395,
    overflow: 'hidden',
    paddingHorizontal: 58,
    paddingVertical: 64
  },
  heroMobile: {
    margin: spacing.md,
    minHeight: 360,
    padding: spacing.xl
  },
  heroTitle: {
    color: palette.white,
    fontSize: 54,
    fontWeight: '900',
    lineHeight: 64,
    maxWidth: 540
  },
  heroTitleMobile: {
    fontSize: 40,
    lineHeight: 48
  },
  heroSubtitle: {
    color: '#C7D7F4',
    fontSize: 22,
    fontWeight: '700',
    marginTop: spacing.md
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: 34
  },
  heroPrimary: {
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 52,
    minWidth: 176,
    paddingHorizontal: spacing.lg
  },
  heroPrimaryText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '900'
  },
  heroSecondary: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 52,
    minWidth: 110,
    paddingHorizontal: spacing.lg
  },
  heroSecondaryText: {
    color: palette.white,
    fontSize: 16,
    fontWeight: '800'
  },
  featuredRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    marginTop: 36
  },
  featuredText: {
    color: '#D6DAFF',
    fontSize: 13,
    fontWeight: '900'
  },
  featuredMuted: {
    color: '#B2BFDB'
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingTop: 36
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 28,
    fontWeight: '900'
  },
  viewAll: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm
  },
  viewAllText: {
    color: palette.blue,
    fontSize: 14,
    fontWeight: '900'
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    padding: 32
  },
  categoryCard: {
    borderRadius: 12,
    flexBasis: 170,
    flexGrow: 1,
    maxWidth: 220,
    minWidth: 160,
    overflow: 'hidden'
  },
  categoryImageWrap: {
    height: 225,
    justifyContent: 'flex-end'
  },
  categoryImage: {
    borderRadius: 12
  },
  categoryNoImage: {
    backgroundColor: '#151C3A'
  },
  categoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(1,6,20,0.42)'
  },
  categoryCopy: {
    padding: spacing.md
  },
  categoryIconPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(59,130,246,0.72)',
    borderRadius: 999,
    height: 30,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: 30
  },
  categoryCount: {
    color: '#63B3FF',
    fontSize: 12,
    fontWeight: '900'
  },
  categoryName: {
    color: palette.white,
    fontSize: 15,
    fontWeight: '900',
    marginTop: spacing.xs
  },
  whySection: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 72
  },
  whyTitle: {
    color: palette.text,
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center'
  },
  whySubtitle: {
    color: palette.textMuted,
    fontSize: 16,
    marginTop: spacing.md,
    textAlign: 'center'
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 38,
    justifyContent: 'space-between',
    marginTop: 48,
    width: '100%'
  },
  featureCard: {
    alignItems: 'center',
    flexBasis: 220,
    flexGrow: 1,
    paddingHorizontal: spacing.md
  },
  featureIcon: {
    alignItems: 'center',
    backgroundColor: palette.purpleSoft,
    borderColor: '#332A75',
    borderRadius: 999,
    borderWidth: 1,
    height: 58,
    justifyContent: 'center',
    width: 58
  },
  featureTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '900',
    marginTop: spacing.lg,
    textAlign: 'center'
  },
  featureText: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.md,
    maxWidth: 250,
    textAlign: 'center'
  },
  statsBand: {
    borderBottomColor: palette.border,
    borderBottomWidth: 1,
    borderTopColor: palette.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 46
  },
  statItem: {
    alignItems: 'center',
    flexBasis: 190,
    flexGrow: 1,
    maxWidth: 260
  },
  statValue: {
    color: '#8B7CFF',
    fontSize: 32,
    fontWeight: '900'
  },
  statLabel: {
    color: palette.textMuted,
    fontSize: 13,
    marginTop: spacing.xs
  },
  ctaSection: {
    alignItems: 'center',
    backgroundColor: '#11183A',
    paddingHorizontal: 32,
    paddingVertical: 90
  },
  ctaTitle: {
    color: palette.text,
    fontSize: 42,
    fontWeight: '900',
    textAlign: 'center'
  },
  ctaTitleMobile: {
    fontSize: 32
  },
  ctaText: {
    color: '#C8D2EA',
    fontSize: 17,
    lineHeight: 25,
    marginTop: spacing.lg,
    textAlign: 'center'
  },
  ctaButton: {
    alignItems: 'center',
    backgroundColor: palette.purple,
    borderRadius: 10,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: 42,
    minHeight: 52,
    paddingHorizontal: spacing.lg
  },
  ctaButtonText: {
    color: palette.white,
    fontSize: 16,
    fontWeight: '900'
  },
  footer: {
    padding: 32
  },
  footerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xl,
    justifyContent: 'space-between'
  },
  footerGroup: {
    gap: spacing.md,
    minWidth: 180
  },
  footerTitle: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '900'
  },
  footerLink: {
    color: palette.textMuted,
    fontSize: 14
  },
  apiState: {
    alignItems: 'center',
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 88,
    paddingHorizontal: spacing.lg,
    width: '100%'
  },
  apiStateText: {
    color: palette.textMuted,
    fontSize: 14,
    fontWeight: '700'
  },
  footerNotice: {
    alignItems: 'center',
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
    padding: spacing.md
  },
  footerNoticeText: {
    color: palette.textMuted,
    flex: 1,
    fontSize: 13,
    lineHeight: 19
  },
  copyright: {
    borderTopColor: palette.border,
    borderTopWidth: 1,
    color: palette.textMuted,
    fontSize: 13,
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    textAlign: 'center'
  }
});
