import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PublicSiteFooter } from '../../components/publicSite/PublicSiteFooter';
import { getPublicContentPage, type PublicContentPageResponse, type VisitorContextResponse } from '../../services/publicContentApi';
import { spacing } from '../../theme';
import { footerGroups } from '../welcome/welcomeContent';

type PublicContentScreenProps = {
  context: VisitorContextResponse | null;
  onBack: () => void;
  onOpenPublicContent: (slug: string) => void;
  slug: string;
};

type SectionOffsetMap = Record<string, number>;

export function PublicContentScreen({ context, onBack, onOpenPublicContent, slug }: PublicContentScreenProps) {
  const [page, setPage] = useState<PublicContentPageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<SectionOffsetMap>({});

  useEffect(() => {
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
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.shell}>
          <View style={styles.header}>
            <Pressable accessibilityRole="button" onPress={onBack} style={styles.brandBlock}>
              <View style={styles.brandMark}>
                <Text style={styles.brandLetter}>S</Text>
              </View>
              <View>
                <Text style={styles.brand}>Sharity</Text>
                <Text style={styles.region}>{regionLabel}</Text>
              </View>
            </Pressable>

            {Platform.OS !== 'web' ? (
              <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
                <Ionicons color={palette.white} name="arrow-back" size={18} />
                <Text style={styles.backText}>Back</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.readerCard}>
            <View style={styles.readerIntro}>
                <View style={styles.readerBadgeRow}>
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

                  <View style={styles.summaryGrid}>
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
              <View style={styles.contentWrap}>
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

            <PublicSiteFooter
              groups={footerGroups}
              onBrandPress={onBack}
              onLinkPress={onOpenPublicContent}
              visitorContext={context}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const palette = {
  blue: '#4C8DFF',
  border: '#20284A',
  page: '#0B1028',
  panel: '#111936',
  panelDeep: '#0F1733',
  text: '#F8FAFC',
  textMuted: '#9AA9C7',
  white: '#FFFFFF'
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: palette.page,
    flex: 1
  },
  scrollContent: {
    backgroundColor: palette.page,
    paddingBottom: 72,
    paddingHorizontal: 20,
    paddingTop: 20
  },
  shell: {
    alignSelf: 'center',
    maxWidth: 1120,
    width: '100%'
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    marginBottom: 18
  },
  brandBlock: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minWidth: 0
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
    backgroundColor: '#111A3A',
    borderColor: palette.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.md
  },
  backText: {
    color: palette.white,
    fontSize: 14,
    fontWeight: '900'
  },
  readerCard: {
    backgroundColor: palette.panelDeep,
    borderColor: palette.border,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden'
  },
  readerIntro: {
    backgroundColor: palette.panel,
    borderBottomColor: palette.border,
    borderBottomWidth: 1,
    padding: 28
  },
  readerBadgeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between'
  },
  approvedPill: {
    alignItems: 'center',
    backgroundColor: '#0F2148',
    borderColor: '#233565',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  approvedText: {
    color: palette.text,
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
  summaryChip: {
    backgroundColor: '#0E1630',
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
    backgroundColor: '#0F1836',
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
  section: {
    borderLeftColor: palette.blue,
    borderLeftWidth: 3,
    marginTop: 14,
    paddingLeft: 18,
    paddingBottom: 2
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12
  },
  sectionMarker: {
    alignItems: 'center',
    backgroundColor: '#0F2148',
    borderColor: '#233565',
    borderRadius: 999,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28
  },
  sectionMarkerText: {
    color: palette.text,
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
    backgroundColor: '#0E1630',
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
    backgroundColor: '#0D1634',
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
