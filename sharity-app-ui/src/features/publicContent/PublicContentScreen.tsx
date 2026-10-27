import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PublicSiteFooter } from '../../components/publicSite/PublicSiteFooter';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { getPublicContentPage, type PublicContentPageResponse, type VisitorContextResponse } from '../../services/publicContentApi';
import { marketingColors, spacing } from '../../theme';
import { footerGroups } from '../welcome/welcomeContent';

type PublicContentScreenProps = {
  context: VisitorContextResponse | null;
  onBack: () => void;
  onOpenPublicContent: (slug: string) => void;
  slug: string;
};

type SectionOffsetMap = Record<string, number>;

export function PublicContentScreen({ context, onBack, onOpenPublicContent, slug }: PublicContentScreenProps) {
  const { isCompactPhone, isSingleColumn } = useResponsiveLayout();
  const [page, setPage] = useState<PublicContentPageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<SectionOffsetMap>({});

  useEffect(() => {
    scrollRef.current?.scrollTo({y:0,animated:false});
    let mounted = true;

    async function loadPage() {
      setLoading(true);
      setError(null);
      try {
        const response = await getPublicContentPage(slug, context?.countryCode, context?.locale);
        if (mounted) {
          setPage(response);
        }
      } catch {
        if (mounted) {
          setError('This page is unavailable right now.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadPage();

    return () => {
      mounted = false;
    };
  }, [context?.countryCode, context?.locale, slug]);

  const summaryItems = useMemo(() => {
    const locale = context?.locale ?? page?.locale ?? 'en-US';
    return [
      { label: 'Country', value: page?.countryCode ?? context?.countryCode ?? 'US' },
      { label: 'Locale', value: locale },
      { label: 'Version', value: page?.version ?? 'Pending' },
      { label: 'Effective', value: page?.effectiveDate ?? 'Pending' }
    ];
  }, [context?.countryCode, context?.locale, page?.countryCode, page?.effectiveDate, page?.locale, page?.version]);

  function scrollToSection(heading: string) {
    const offset = sectionOffsets.current[heading];
    if (typeof offset === 'number') {
      scrollRef.current?.scrollTo({ animated: true, y: Math.max(offset - 12, 0) });
    }
  }

  function setSectionOffset(heading: string, y: number) {
    sectionOffsets.current[heading] = y;
  }

  const regionLabel = context ? `${context.countryName} (${context.countryCode})` : 'Detecting region';
  const localeLabel = context?.locale ?? page?.locale ?? 'en-US';

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.shell, isCompactPhone && {paddingHorizontal:12}]}>
          <View style={[styles.header, isSingleColumn && styles.headerCompact]}>
            <Pressable accessibilityRole="button" onPress={onBack} style={styles.brandBlock}>
              <View style={styles.brandMark}>
                <Text style={styles.brandLetter}>S</Text>
              </View>
              <View>
                <Text style={styles.brand}>Sharity</Text>
                <Text style={styles.region}>{regionLabel}</Text>
              </View>
            </Pressable>

            {Platform.OS !== 'web' || isSingleColumn ? (
              <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
                <Ionicons color={palette.blue} name="arrow-back" size={18} />
                <Text style={styles.backText}>Back</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.readerCard}>
            <View style={[styles.readerIntro, isCompactPhone && styles.readerIntroCompact]}>
              <View style={[styles.readerBadgeRow, isSingleColumn && styles.readerBadgeRowCompact]}>
                <View style={styles.approvedPill}>
                  <Ionicons color={palette.blue} name="shield-checkmark-outline" size={15} />
                  <Text style={styles.approvedText}>Approved public content</Text>
                </View>
                <Text style={styles.readerHint}>Region-aware edition</Text>
              </View>

              {loading ? (
                <View style={styles.stateBox}>
                  <Ionicons color={palette.blue} name="sync-outline" size={22} />
                  <Text style={styles.stateText}>Loading approved content...</Text>
                </View>
              ) : null}

              {error ? (
                <View style={styles.stateBox}>
                  <Ionicons color={palette.blue} name="alert-circle-outline" size={22} />
                  <Text style={styles.stateText}>{error}</Text>
                </View>
              ) : null}

              {page && !loading ? (
                <>
                  <Text style={styles.category}>{page.category}</Text>
                  <Text style={styles.title}>{page.title}</Text>
                  <Text style={styles.subtitle}>
                    This edition is selected for {regionLabel} and the {localeLabel} locale. The wording stays
                    current and country-aware.
                  </Text>

                  <View style={[styles.summaryGrid, isSingleColumn && styles.summaryGridCompact]}>
                    {summaryItems.map((item) => (
                      <View key={item.label} style={styles.summaryChip}>
                        <Text style={styles.summaryLabel}>{item.label}</Text>
                        <Text style={styles.summaryValue}>{item.value}</Text>
                      </View>
                    ))}
                  </View>

                  {page.sections.length > 1 ? (
                    <ScrollView horizontal contentContainerStyle={styles.sectionNav} showsHorizontalScrollIndicator={false}>
                      {page.sections.map((section, index) => (
                        <Pressable
                          key={`${section.heading}-${index}`}
                          onPress={() => scrollToSection(section.heading)}
                          style={styles.sectionNavItem}
                        >
                          <Text style={styles.sectionNavIndex}>{String(index + 1).padStart(2, '0')}</Text>
                          <Text style={styles.sectionNavText} numberOfLines={1}>
                            {section.heading}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  ) : null}
                </>
              ) : null}
            </View>

            {page && !loading ? (
              <View style={[styles.contentWrap, isCompactPhone && styles.contentWrapCompact]}>
                {page.sections.map((section, index) => (
                  <View
                    key={`${section.heading}-${index}`}
                    onLayout={(event) => setSectionOffset(section.heading, event.nativeEvent.layout.y)}
                    style={styles.section}
                  >
                    <View style={styles.sectionHeader}>
                      <View style={styles.sectionMarker}>
                        <Text style={styles.sectionMarkerText}>{String(index + 1).padStart(2, '0')}</Text>
                      </View>
                      <Text style={styles.sectionTitle}>{section.heading}</Text>
                    </View>
                    {section.paragraphs.map((paragraph, paragraphIndex) => (
                      <Text key={`${section.heading}-${paragraphIndex}`} style={styles.paragraph}>
                        {paragraph}
                      </Text>
                    ))}
                  </View>
                ))}

                <View style={styles.footerNotice}>
                  <Ionicons color={palette.blue} name="information-circle-outline" size={18} />
                  <Text style={styles.footerNoticeText}>
                    Last reviewed {page.lastReviewedAt}. If your region changes, we will refresh the matching
                    edition.
                  </Text>
                </View>
              </View>
            ) : null}

          </View>
        </View>
            <PublicSiteFooter
              groups={footerGroups}
              onBrandPress={onBack}
              onLinkPress={onOpenPublicContent}
              visitorContext={context}
            />
      </ScrollView>
    </SafeAreaView>
  );
}

const palette = {
  ...marketingColors,
  white: '#FFFFFF'
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: palette.page,
    flex: 1
  },
  scrollContent: {
    backgroundColor: palette.page,
    paddingBottom: 0
  },
  scrollContentCompact: {
    paddingHorizontal: 12,
    paddingTop: 12
  },
  shell: {
    alignSelf: 'center',
    maxWidth: 1160,
    paddingHorizontal:20,
    paddingTop:20,
    marginBottom:28,
    width: '100%'
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    marginBottom: 18
  },
  headerCompact: {
    alignItems: 'flex-start',
    flexWrap: 'wrap'
  },
  brandBlock: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minWidth: 0
  },
  brandMark: {
    alignItems: 'center',
    backgroundColor: palette.blue,
    borderRadius: 14,
    height: 44,
    justifyContent: 'center',
    width: 44
  },
  brandLetter: {
    color: palette.white,
    fontSize: 20,
    fontWeight: '900'
  },
  brand: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '900'
  },
  region: {
    color: palette.textMuted,
    fontSize: 13,
    marginTop: 2
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: palette.white,
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.md
  },
  backText: {
    color: palette.blue,
    fontSize: 14,
    fontWeight: '900'
  },
  readerCard: {
    backgroundColor: palette.cardAlt,
    borderColor: palette.border,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#12263a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24
  },
  readerIntro: {
    backgroundColor: palette.header,
    borderBottomColor: palette.border,
    borderBottomWidth: 1,
    padding: 28
  },
  readerIntroCompact: {
    padding: 18
  },
  readerBadgeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between'
  },
  readerBadgeRowCompact: {
    alignItems: 'flex-start'
  },
  approvedPill: {
    alignItems: 'center',
    backgroundColor: palette.accentSoft,
    borderColor: '#f1d9bc',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  approvedText: {
    color: palette.blue,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0
  },
  readerHint: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700'
  },
  category: {
    color: palette.blue,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
    marginTop: 20,
    textTransform: 'uppercase'
  },
  title: {
    color: palette.text,
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 48,
    marginTop: spacing.sm
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: 16,
    lineHeight: 24,
    marginTop: spacing.md,
    maxWidth: 860
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 24
  },
  summaryGridCompact: {
    gap: 10,
    marginTop: 18
  },
  summaryChip: {
    backgroundColor: palette.cardAlt,
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 156,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  summaryLabel: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  summaryValue: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 6
  },
  sectionNav: {
    gap: 10,
    marginTop: 22,
    paddingRight: 4
  },
  sectionNavItem: {
    alignItems: 'flex-start',
    backgroundColor: palette.purpleSoft,
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 150,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  sectionNavIndex: {
    color: palette.blue,
    fontSize: 11,
    fontWeight: '900'
  },
  sectionNavText: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
    maxWidth: 170
  },
  contentWrap: {
    paddingBottom: 24,
    paddingHorizontal: 28,
    paddingTop: 18
  },
  contentWrapCompact: {
    paddingHorizontal: 16,
    paddingTop: 12
  },
  section: {
    backgroundColor: palette.cardAlt,
    borderColor: palette.border,
    borderLeftColor: palette.blue,
    borderLeftWidth: 4,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 14,
    paddingBottom: 18,
    paddingHorizontal: 18,
    paddingTop: 18
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12
  },
  sectionMarker: {
    alignItems: 'center',
    backgroundColor: palette.purpleSoft,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28
  },
  sectionMarkerText: {
    color: palette.blue,
    fontSize: 11,
    fontWeight: '900'
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28
  },
  paragraph: {
    color: palette.textMuted,
    fontSize: 16,
    lineHeight: 26,
    marginTop: spacing.md,
    maxWidth: 900
  },
  stateBox: {
    alignItems: 'center',
    backgroundColor: palette.cardAlt,
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 74,
    marginTop: 20,
    padding: spacing.lg
  },
  stateText: {
    color: palette.textMuted,
    fontSize: 14,
    fontWeight: '700'
  },
  footerNotice: {
    alignItems: 'center',
    backgroundColor: palette.purpleSoft,
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 18,
    padding: 14
  },
  footerNoticeText: {
    color: palette.textMuted,
    flex: 1,
    fontSize: 13,
    lineHeight: 19
  }
});
