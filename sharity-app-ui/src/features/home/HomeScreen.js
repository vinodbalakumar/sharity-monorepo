import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppLoadingIndicator } from '../../components/ui';
import { InteriorShell } from '../../components/appShell';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { getCurrentUser } from '../../services/userApi';
import { buildDashboardDeals, buildDashboardQuickActions, buildDashboardServices, buildHeroOffers } from './dashboardData';
import { getMarketplaceHome, getMarketplaceListings } from '../../services/marketplaceApi';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { radius } from '../../theme/radius';
export function HomeScreen({ onNavigate, onOpenDigitalProduct, visitorContext }) {
    const { isCompactPhone, isSingleColumn } = useResponsiveLayout();
    const [currentUser, setCurrentUser] = useState(null);
    const [state, setState] = useState({
        dealsError: false,
        home: null,
        homeError: false,
        listings: [],
        loading: true
    });
    const [selectedCountryCode, setSelectedCountryCode] = useState(visitorContext?.countryCode ?? '');
    const [activeHeroIndex, setActiveHeroIndex] = useState(0);
    useEffect(() => {
        let disposed = false;
        void getCurrentUser()
            .then((user) => {
            if (!disposed) {
                setCurrentUser(user);
            }
        })
            .catch(() => {
            if (!disposed) {
                setCurrentUser(null);
            }
        });
        return () => {
            disposed = true;
        };
    }, []);
    useEffect(() => {
        if (!selectedCountryCode && currentUser?.profile.countryCode) {
            setSelectedCountryCode(currentUser.profile.countryCode);
            return;
        }
        if (!selectedCountryCode && visitorContext?.countryCode) {
            setSelectedCountryCode(visitorContext.countryCode);
        }
    }, [currentUser?.profile.countryCode, selectedCountryCode, visitorContext?.countryCode]);
    const loadDashboard = useCallback(async () => {
        setState((current) => ({ ...current, dealsError: false, homeError: false, loading: true }));
        const countryQuery = selectedCountryCode ? `?countryCode=${encodeURIComponent(selectedCountryCode)}` : '';
        const [homeResult, listingsResult] = await Promise.allSettled([getMarketplaceHome(countryQuery), getMarketplaceListings()]);
        setState({
            dealsError: listingsResult.status === 'rejected',
            home: homeResult.status === 'fulfilled' ? homeResult.value : null,
            homeError: homeResult.status === 'rejected',
            listings: listingsResult.status === 'fulfilled' ? listingsResult.value : [],
            loading: false
        });
    }, [selectedCountryCode]);
    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);
    const effectiveCountryCode = selectedCountryCode || currentUser?.profile.countryCode || visitorContext?.countryCode || undefined;
    const quickActions = useMemo(() => buildDashboardQuickActions(state.home, currentUser?.roles ?? [], effectiveCountryCode), [currentUser?.roles, effectiveCountryCode, state.home]);
    const services = useMemo(() => buildDashboardServices(state.home), [state.home]);
    const deals = useMemo(() => buildDashboardDeals(state.listings, selectedCountryCode || undefined), [selectedCountryCode, state.listings]);
    const heroOffers = useMemo(() => buildHeroOffers(state.home?.featuredListings ?? [], effectiveCountryCode), [effectiveCountryCode, state.home?.featuredListings]);
    const activeHeroOffer = heroOffers.length > 0 ? heroOffers[activeHeroIndex % heroOffers.length] : null;
    const supportedCountries = useMemo(() => {
        const codes = new Set();
        if (visitorContext?.countryCode) {
            codes.add(visitorContext.countryCode);
        }
        state.home?.categories.forEach((category) => {
            if (category.countryCode) {
                codes.add(category.countryCode);
            }
        });
        state.listings.forEach((listing) => {
            if (listing.providerCountryCode) {
                codes.add(listing.providerCountryCode);
            }
        });
        return Array.from(codes)
            .sort((left, right) => countryLabel(left).localeCompare(countryLabel(right)))
            .map((countryCode) => ({
            countryCode,
            countryName: visitorContext?.countryCode === countryCode ? visitorContext.countryName : countryLabel(countryCode)
        }));
    }, [state.home?.categories, state.listings, visitorContext?.countryCode, visitorContext?.countryName]);
    const activeCountryName = supportedCountries.find((country) => country.countryCode === selectedCountryCode)?.countryName
        ?? visitorContext?.countryName
        ?? countryLabel(selectedCountryCode);
    useEffect(() => {
        const firstSupportedCountry = supportedCountries[0];
        if (!selectedCountryCode && firstSupportedCountry) {
            setSelectedCountryCode(firstSupportedCountry.countryCode);
        }
    }, [selectedCountryCode, supportedCountries]);
    useEffect(() => {
        setActiveHeroIndex(0);
    }, [effectiveCountryCode, heroOffers.length]);
    useEffect(() => {
        if (heroOffers.length < 2) {
            return;
        }
        const intervalId = setInterval(() => {
            setActiveHeroIndex((current) => (current + 1) % heroOffers.length);
        }, 4500);
        return () => {
            clearInterval(intervalId);
        };
    }, [heroOffers.length]);
    return (<InteriorShell onNavigate={onNavigate} title="Home" activeLabel="Home" scrollable={true}>
      <View style={styles.contentStack}>
            <WelcomeHeroCard activeOffer={activeHeroOffer} activeOfferIndex={heroOffers.length > 0 ? activeHeroIndex % heroOffers.length : 0} currentUser={currentUser} heroOfferCount={heroOffers.length} isCompactPhone={isCompactPhone} onNavigate={onNavigate} onOpenDigitalProduct={onOpenDigitalProduct} onSelectCountry={setSelectedCountryCode} selectedCountryCode={selectedCountryCode} supportedCountries={supportedCountries}/>
            <View style={styles.quickGrid}>
              {quickActions.map((action) => (<QuickActionCard ctaLabel={action.ctaLabel} enabled={action.enabled} icon={action.icon} key={action.label} label={action.label} onNavigate={onNavigate} route={action.route} text={action.text}/>))}
            </View>
            <ExploreServicesSection error={state.homeError} loading={state.loading} onNavigate={onNavigate} onRetry={loadDashboard} services={services}/>
            <DealsSection activeCountryName={activeCountryName} deals={deals} error={state.dealsError} isSingleColumn={isSingleColumn} loading={state.loading} onOpenDigitalProduct={onOpenDigitalProduct} onRetry={loadDashboard}/>
      </View>
    </InteriorShell>);
}
function WelcomeHeroCard({ activeOffer, activeOfferIndex, currentUser, heroOfferCount, isCompactPhone, onNavigate, onOpenDigitalProduct, onSelectCountry, selectedCountryCode, supportedCountries }) {
    return (<View style={[styles.hero, isCompactPhone && styles.heroCompact]}>
      {activeOffer?.imageUrl ? <Image resizeMode="cover" source={{ uri: activeOffer.imageUrl }} style={styles.heroBackgroundImage}/> : null}
      <View style={styles.heroBackgroundTint}/>
      <View style={[styles.heroTopRow, isCompactPhone && styles.heroTopRowCompact]}>
        <View style={[styles.countryCodeBox, isCompactPhone && styles.countryCodeBoxCompact]}>
          <Text style={styles.countryCodeLabel}>Country</Text>
          <Text style={styles.countryCodeValue}>{selectedCountryCode || 'GL'}</Text>
        </View>
        <View style={[styles.countryChipRow, isCompactPhone && styles.countryChipRowCompact]}>
          {supportedCountries.map((country) => (<Pressable key={country.countryCode} onPress={() => onSelectCountry(country.countryCode)} style={[styles.countryChip, isCompactPhone && styles.countryChipCompact, selectedCountryCode === country.countryCode && styles.countryChipActive]}>
              <Text style={[styles.countryChipText, selectedCountryCode === country.countryCode && styles.countryChipTextActive]}>
                {country.countryCode}
              </Text>
            </Pressable>))}
        </View>
      </View>
      <Text style={styles.heroKicker}>WELCOME BACK</Text>
      <Text style={[styles.heroTitle, isCompactPhone && styles.heroTitleCompact]}>Welcome to Sharity</Text>
      <Text style={[styles.heroText, isCompactPhone && styles.heroTextCompact]}>
        Marketplace blocks now respond to your current country and signed-in role, while the hero rotates live featured offers.
      </Text>
      <View style={[styles.heroMetaRow, isCompactPhone && styles.heroMetaRowCompact]}>
        <Text style={styles.heroMetaPill}>{currentUser?.roles?.join(' / ') || 'Authenticated'}</Text>
        {activeOffer ? <Text style={styles.heroMetaPill}>{activeOffer.marketplaceName}</Text> : null}
      </View>
      <View style={[styles.heroActionRow, isCompactPhone && styles.heroActionRowCompact]}>
        <Pressable onPress={() => onNavigate('marketplaces')} style={[styles.heroButton, isCompactPhone && styles.heroButtonCompact]}>
          <Text style={styles.heroButtonText}>Explore Marketplace</Text>
        </Pressable>
        {activeOffer ? (<Pressable onPress={() => onOpenDigitalProduct(activeOffer.id)} style={[styles.heroSecondaryButton, isCompactPhone && styles.heroButtonCompact]}>
            <Text style={styles.heroSecondaryButtonText}>View Offer</Text>
          </Pressable>) : null}
      </View>
      {activeOffer ? (<Pressable onPress={() => onOpenDigitalProduct(activeOffer.id)} style={styles.heroOfferPanel}>
          <View style={styles.heroOfferHeader}>
            <Text style={styles.heroOfferBadge}>{activeOffer.badge}</Text>
            <Text style={styles.heroOfferPrice}>{activeOffer.priceLabel}</Text>
          </View>
          <Text style={styles.heroOfferTitle}>{activeOffer.title}</Text>
          <Text style={styles.heroOfferText}>
            {activeOffer.sellerDisplayName} -+ {countryLabel(activeOffer.countryCode)}
          </Text>
          {heroOfferCount > 1 ? (<View style={styles.heroDotsRow}>
              {Array.from({ length: heroOfferCount }).map((_, index) => (<View key={`hero-dot-${index}`} style={[styles.heroDot, index === activeOfferIndex && styles.heroDotActive]}/>))}
            </View>) : null}
        </Pressable>) : null}
    </View>);
}
function QuickActionCard({ ctaLabel, enabled, icon, label, onNavigate, route, text }) {
    return (<Pressable disabled={!enabled} onPress={() => onNavigate(route)} style={[styles.quickCard, !enabled && styles.quickCardDisabled]}>
      <View style={[styles.cardIcon, !enabled && styles.cardIconDisabled]}>
        <Ionicons color={enabled ? colors.info : colors.gray500} name={icon} size={22}/>
      </View>
      <Text style={styles.cardTitle}>{label}</Text>
      <Text style={styles.cardText}>{text}</Text>
      <Text style={[styles.cardCta, !enabled && styles.cardCtaDisabled]}>{ctaLabel}</Text>
    </Pressable>);
}
function ExploreServicesSection({ error, loading, onNavigate, onRetry, services }) {
    return (<View style={styles.section}>
      <Text style={styles.sectionTitle}>Explore Services</Text>
      {loading ? <LoadingRow label="Loading marketplaces..."/> : null}
      {!loading && error ? <ErrorState label="Unable to load services." onRetry={onRetry}/> : null}
      {!loading && !error && services.length === 0 ? (<EmptyState label="No marketplaces are currently available in your region."/>) : null}
      {!loading && !error && services.length > 0 ? (<View style={styles.serviceGrid}>
          {services.map((service) => (<ServiceCard key={service.code} onNavigate={onNavigate} service={service}/>))}
        </View>) : null}
    </View>);
}
function ServiceCard({ onNavigate, service }) {
    return (<Pressable onPress={() => onNavigate(routeForService(service.code))} style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        <View style={styles.cardIcon}>
          <Ionicons color={service.enabled ? colors.success : colors.primary} name={service.icon} size={22}/>
        </View>
        {!service.enabled ? <Text style={styles.badge}>Coming Soon</Text> : <Text style={styles.activeBadge}>Active</Text>}
      </View>
      <Text style={styles.cardTitle}>{service.name}</Text>
      <Text style={styles.cardText}>{service.description}</Text>
      <Text style={styles.cardCta}>{service.enabled ? 'Browse' : service.ctaLabel}</Text>
    </Pressable>);
}
function DealsSection({ activeCountryName, deals, error, isSingleColumn, loading, onRetry, onOpenDigitalProduct }) {
    return (<View style={styles.section}>
      <View style={styles.sectionHeadingRow}>
        <Text style={styles.sectionTitle}>Best Deals Across Marketplaces</Text>
        <Text style={styles.sectionSubcopy}>{activeCountryName}</Text>
      </View>
      {loading ? <LoadingRow label="Loading deals..."/> : null}
      {!loading && error ? <ErrorState label="Unable to load deals." onRetry={onRetry}/> : null}
      {!loading && !error && deals.length === 0 ? <EmptyState label={`No deals available for ${activeCountryName} right now.`}/> : null}
      {!loading && !error && deals.length > 0 ? (<View style={styles.dealGrid}>
          {deals.map((deal) => (<DealCard compact={isSingleColumn} deal={deal} key={deal.id} onOpenDigitalProduct={onOpenDigitalProduct}/>))}
        </View>) : null}
    </View>);
}
function DealCard({ compact, deal, onOpenDigitalProduct }) {
    return (<Pressable onPress={() => onOpenDigitalProduct(deal.id)} style={[styles.dealCard, compact && styles.dealCardCompact]}>
      {deal.imageUrl ? (<Image resizeMode="cover" source={{ uri: deal.imageUrl }} style={styles.dealImage}/>) : (<View style={styles.dealImageFallback}>
          <Ionicons color={colors.info} name={deal.marketplaceCode === 'ELECTRONICS' ? 'desktop-outline' : 'gift-outline'} size={30}/>
          <Text style={styles.dealImageFallbackText}>{deal.marketplaceName}</Text>
        </View>)}
      <View style={styles.dealBadgeRow}>
        <Text style={styles.badge}>{deal.badge}</Text>
        <Text style={styles.dealCountry}>{countryLabel(deal.providerCountryCode)}</Text>
      </View>
      <Text style={styles.cardTitle}>{deal.title}</Text>
      <Text style={styles.cardText}>{deal.marketplaceName}</Text>
      <View style={styles.priceRow}>
        {deal.originalPrice ? <Text style={styles.originalPrice}>{formatMoney(deal.originalPrice, deal.currencyCode)}</Text> : null}
        <Text style={styles.dealPrice}>{formatMoney(deal.discountedPrice, deal.currencyCode)}</Text>
      </View>
      <Text style={styles.cardText}>
        {deal.rating ? `Seller rating ${deal.rating}` : 'Seller rating unavailable'} - {deal.sellerDisplayName}
      </Text>
      <Text style={styles.cardCta}>View Deal</Text>
    </Pressable>);
}
function routeForService(code) {
    if (code === 'ELECTRONICS') {
        return 'electronics';
    }
    return 'marketplaces';
}
function LoadingRow({ label }) {
    return (<View style={styles.stateRow}>
      <AppLoadingIndicator />
      <Text style={styles.stateText}>{label}</Text>
    </View>);
}
function ErrorState({ label, onRetry }) {
    return (<View style={styles.stateBox}>
      <Text style={styles.stateText}>{label}</Text>
      <Pressable style={styles.smallButton} onPress={onRetry}>
        <Text style={styles.smallButtonText}>Retry</Text>
      </Pressable>
    </View>);
}
function EmptyState({ label }) {
    return (<View style={styles.stateBox}>
      <Text style={styles.stateText}>{label}</Text>
      <Text style={styles.cardCta}>Explore Marketplace</Text>
    </View>);
}
function formatMoney(value, currencyCode) {
    try {
        return new Intl.NumberFormat('en-US', { currency: currencyCode, style: 'currency' }).format(value);
    }
    catch {
        return `${currencyCode} ${value.toFixed(2)}`;
    }
}
function countryLabel(countryCode) {
    const labels = {
        AUS: 'Australia',
        CAN: 'Canada',
        DEU: 'Germany',
        GBR: 'United Kingdom',
        IND: 'India',
        USA: 'United States',
        US: 'United States'
    };
    if (!countryCode) {
        return 'Global';
    }
    return labels[countryCode] ?? countryCode;
}
const styles = StyleSheet.create({
    contentStack: {
        gap: spacing.xl,
        paddingBottom: spacing['2xl']
    },
    hero: {
        backgroundColor: colors.infoLight,
        borderRadius: 22,
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        overflow: 'hidden',
        padding: spacing['2xl'],
        shadowColor: colors.gray900,
        shadowOffset: { height: 16, width: 0 },
        shadowOpacity: 0.22,
        shadowRadius: 28,
        position: 'relative'
    },
    heroBackgroundImage: {
        bottom: 0,
        opacity: 0.24,
        position: 'absolute',
        right: 0,
        top: 0,
        width: '72%'
    },
    heroBackgroundTint: {
        backgroundColor: 'rgba(255,255,255,0.68)',
        bottom: 0,
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0
    },
    heroCompact: {
        borderRadius: 18,
        padding: spacing.lg
    },
    heroTopRow: {
        alignItems: 'flex-start',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
        justifyContent: 'space-between',
        marginBottom: spacing.lg
    },
    heroTopRowCompact: {
        alignItems: 'stretch'
    },
    countryCodeBox: {
        backgroundColor: colors.white,
        borderColor: 'rgba(11,82,194,0.12)',
        borderRadius: radius.lg,
        borderWidth: 1,
        minWidth: 92,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        shadowColor: colors.gray900,
        shadowOffset: { height: 6, width: 0 },
        shadowOpacity: 0.08,
        shadowRadius: 12
    },
    countryCodeBoxCompact: {
        minWidth: 84
    },
    countryCodeLabel: {
        color: colors.gray600,
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase'
    },
    countryCodeValue: {
        color: colors.info,
        fontSize: 24,
        fontWeight: '900',
        marginTop: spacing.xs
    },
    countryChipRow: {
        alignItems: 'center',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        justifyContent: 'flex-end',
        minWidth: 220
    },
    countryChipRowCompact: {
        width: '100%'
    },
    countryChip: {
        backgroundColor: colors.white,
        borderColor: colors.gray300,
        borderRadius: radius.full,
        borderWidth: 1,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm
    },
    countryChipCompact: {
        maxWidth: '100%'
    },
    countryChipActive: {
        backgroundColor: colors.info,
        borderColor: colors.info
    },
    countryChipText: {
        color: colors.gray700,
        fontSize: 13,
        fontWeight: '800'
    },
    countryChipTextActive: {
        color: colors.white
    },
    heroTitle: {
        color: colors.gray900,
        fontSize: 36,
        fontWeight: '900'
    },
    heroTitleCompact: {
        fontSize: 26,
        lineHeight: 32
    },
    heroKicker: {
        color: colors.info,
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 0
    },
    heroText: {
        color: colors.gray600,
        fontSize: 17,
        lineHeight: 26,
        marginTop: spacing.sm,
        maxWidth: 620
    },
    heroTextCompact: {
        fontSize: 15,
        lineHeight: 22,
        maxWidth: '100%'
    },
    heroButton: {
        alignSelf: 'flex-start',
        backgroundColor: colors.info,
        borderRadius: radius.lg,
        marginTop: spacing.lg,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        shadowColor: colors.info,
        shadowOffset: { height: 8, width: 0 },
        shadowOpacity: 0.28,
        shadowRadius: 16
    },
    heroButtonCompact: {
        alignSelf: 'stretch'
    },
    heroButtonText: {
        color: colors.white,
        fontSize: 15,
        fontWeight: '900'
    },
    heroSecondaryButton: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.84)',
        borderColor: 'rgba(37,99,235,0.18)',
        borderRadius: radius.lg,
        borderWidth: 1,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md
    },
    heroSecondaryButtonText: {
        color: colors.info,
        fontSize: 15,
        fontWeight: '900'
    },
    heroActionRow: {
        alignItems: 'center',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
        marginTop: spacing.lg
    },
    heroActionRowCompact: {
        alignItems: 'stretch'
    },
    heroMetaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginTop: spacing.md
    },
    heroMetaRowCompact: {
        width: '100%'
    },
    heroMetaPill: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.82)',
        borderColor: 'rgba(37,99,235,0.12)',
        borderRadius: radius.full,
        borderWidth: 1,
        color: colors.gray700,
        fontSize: 12,
        fontWeight: '800',
        overflow: 'hidden',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs
    },
    heroOfferPanel: {
        backgroundColor: 'rgba(255,255,255,0.88)',
        borderColor: 'rgba(37,99,235,0.14)',
        borderRadius: radius.xl,
        borderWidth: 1,
        marginTop: spacing.xl,
        maxWidth: 420,
        padding: spacing.lg,
        shadowColor: colors.gray900,
        shadowOffset: { height: 10, width: 0 },
        shadowOpacity: 0.08,
        shadowRadius: 18
    },
    heroOfferHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    heroOfferBadge: {
        backgroundColor: colors.info,
        borderRadius: radius.full,
        color: colors.white,
        fontSize: 11,
        fontWeight: '900',
        overflow: 'hidden',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs
    },
    heroOfferPrice: {
        color: colors.gray900,
        fontSize: 18,
        fontWeight: '900'
    },
    heroOfferTitle: {
        color: colors.gray900,
        fontSize: 18,
        fontWeight: '900',
        marginTop: spacing.md
    },
    heroOfferText: {
        color: colors.gray600,
        fontSize: 14,
        lineHeight: 21,
        marginTop: spacing.xs
    },
    heroDotsRow: {
        flexDirection: 'row',
        gap: spacing.xs,
        marginTop: spacing.md
    },
    heroDot: {
        backgroundColor: colors.gray300,
        borderRadius: radius.full,
        height: 8,
        width: 8
    },
    heroDotActive: {
        backgroundColor: colors.info,
        width: 20
    },
    quickGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
        marginTop: spacing.sm
    },
    quickCard: {
        backgroundColor: colors.white,
        borderColor: colors.gray200,
        borderRadius: radius.xl,
        borderWidth: 1,
        flexBasis: 210,
        flexGrow: 1,
        minHeight: 160,
        padding: spacing.lg,
        shadowColor: colors.gray900,
        shadowOffset: { height: 10, width: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 20
    },
    quickCardDisabled: {
        backgroundColor: colors.gray50,
        borderColor: colors.gray200,
        opacity: 0.82
    },
    cardIcon: {
        alignItems: 'center',
        backgroundColor: colors.infoLight,
        borderColor: colors.gray200,
        borderRadius: 999,
        borderWidth: 1,
        height: 48,
        justifyContent: 'center',
        width: 48
    },
    cardIconDisabled: {
        backgroundColor: colors.gray100
    },
    cardTitle: {
        color: colors.gray900,
        fontSize: 18,
        fontWeight: '900',
        marginTop: spacing.md
    },
    cardText: {
        color: colors.gray600,
        fontSize: 14,
        lineHeight: 21,
        marginTop: spacing.sm
    },
    section: {
        gap: spacing.md
    },
    sectionHeadingRow: {
        alignItems: 'center',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        justifyContent: 'space-between'
    },
    sectionTitle: {
        color: colors.gray900,
        fontSize: 26,
        fontWeight: '900'
    },
    sectionSubcopy: {
        color: colors.gray600,
        fontSize: 14,
        fontWeight: '700'
    },
    serviceGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md
    },
    serviceCard: {
        backgroundColor: colors.white,
        borderColor: colors.gray200,
        borderRadius: radius.xl,
        borderWidth: 1,
        flexBasis: 250,
        flexGrow: 1,
        minHeight: 190,
        padding: spacing.lg,
        shadowColor: colors.gray900,
        shadowOffset: { height: 10, width: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 20
    },
    serviceHeader: {
        alignItems: 'flex-start',
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    badge: {
        alignSelf: 'flex-start',
        backgroundColor: colors.primaryLight,
        borderRadius: radius.sm,
        color: colors.primary,
        fontSize: 12,
        fontWeight: '900',
        overflow: 'hidden',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs
    },
    activeBadge: {
        alignSelf: 'flex-start',
        backgroundColor: colors.successLight,
        borderColor: '#BCEBD8',
        borderRadius: radius.sm,
        borderWidth: 1,
        color: colors.success,
        fontSize: 12,
        fontWeight: '900',
        overflow: 'hidden',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs
    },
    cardCta: {
        color: colors.info,
        fontSize: 14,
        fontWeight: '900',
        marginTop: spacing.md,
        textDecorationLine: 'none'
    },
    cardCtaDisabled: {
        color: colors.gray500
    },
    dealGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md
    },
    dealCard: {
        backgroundColor: colors.white,
        borderColor: colors.gray200,
        borderRadius: radius.xl,
        borderWidth: 1,
        flexBasis: 240,
        flexGrow: 1,
        padding: spacing.lg,
        shadowColor: colors.gray900,
        shadowOffset: { height: 10, width: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 20
    },
    dealCardCompact: {
        flexBasis: '100%'
    },
    dealImage: {
        borderRadius: radius.lg,
        height: 156,
        marginBottom: spacing.md
    },
    dealImageFallback: {
        alignItems: 'center',
        backgroundColor: '#eef3f8',
        borderColor: colors.gray200,
        borderRadius: radius.lg,
        borderWidth: 1,
        gap: spacing.sm,
        height: 156,
        justifyContent: 'center',
        marginBottom: spacing.md
    },
    dealImageFallbackText: {
        color: colors.gray600,
        fontSize: 13,
        fontWeight: '700'
    },
    dealBadgeRow: {
        alignItems: 'center',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        justifyContent: 'space-between'
    },
    dealCountry: {
        color: colors.gray600,
        fontSize: 12,
        fontWeight: '700'
    },
    priceRow: {
        alignItems: 'baseline',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginTop: spacing.sm
    },
    originalPrice: {
        color: colors.gray600,
        fontSize: 14,
        fontWeight: '700',
        textDecorationLine: 'line-through'
    },
    dealPrice: {
        color: colors.gray900,
        fontSize: 22,
        fontWeight: '900'
    },
    stateRow: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: spacing.sm
    },
    stateBox: {
        backgroundColor: colors.white,
        borderColor: colors.gray200,
        borderRadius: radius.xl,
        borderWidth: 1,
        padding: spacing.lg
    },
    stateText: {
        color: colors.gray600,
        fontSize: 14,
        lineHeight: 21
    },
    smallButton: {
        alignSelf: 'flex-start',
        backgroundColor: colors.info,
        borderRadius: radius.md,
        marginTop: spacing.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm
    },
    smallButtonText: {
        color: colors.white,
        fontSize: 14,
        fontWeight: '900'
    }
});
