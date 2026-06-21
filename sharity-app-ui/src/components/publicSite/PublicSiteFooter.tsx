import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { marketingColors, spacing } from '../../theme';
import type { VisitorContextResponse } from '../../services/publicContentApi';

export type PublicSiteFooterLinkGroup = {
  links: {
    label: string;
    slug: string;
  }[];
  title: string;
};

type PublicSiteFooterProps = {
  groups: PublicSiteFooterLinkGroup[];
  onBrandPress?: () => void;
  onLinkPress: (slug: string) => void;
  visitorContext?: VisitorContextResponse | null;
};

export function PublicSiteFooter({ groups, onBrandPress, onLinkPress, visitorContext }: PublicSiteFooterProps) {
  const { isCompactPhone, isSingleColumn, width } = useResponsiveLayout();
  const shouldUseSingleColumnFooter = width <= 768;
  const useTwoColumnFooter = width > 768 && width < 1180;
  const [openGroup, setOpenGroup] = useState<string | null>(shouldUseSingleColumnFooter ? groups[0]?.title ?? null : null);

  return (
    <View style={[styles.footer, isCompactPhone && styles.footerCompact]}>
      {shouldUseSingleColumnFooter ? (
        <View style={styles.footerAccordion}>
          {groups.map((group) => {
            const expanded = openGroup === group.title;
            return (
              <View key={group.title} style={styles.footerAccordionItem}>
                <Pressable onPress={() => setOpenGroup(expanded ? null : group.title)} style={styles.footerAccordionHeader}>
                  <Text style={styles.footerAccordionTitle}>{group.title}</Text>
                  <Ionicons color={palette.textMuted} name={expanded ? 'chevron-up' : 'chevron-down'} size={18} />
                </Pressable>

                {expanded ? (
                  <View style={styles.footerAccordionBody}>
                    <Text style={styles.footerGroupText}>{groupDescription(group.title)}</Text>
                    {group.links.map((link) => (
                      <Pressable key={link.slug} onPress={() => onLinkPress(link.slug)} style={styles.footerAccordionLinkWrap}>
                        <Text style={styles.footerLink}>{link.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}

      {!shouldUseSingleColumnFooter ? (
      <View
        style={[
          styles.footerGrid,
          (isSingleColumn || shouldUseSingleColumnFooter) && styles.footerGridCompact,
          shouldUseSingleColumnFooter && styles.footerGridStacked,
          useTwoColumnFooter && styles.footerGridTwoColumn
        ]}
      >
        {groups.map((group) => (
          <View
            key={group.title}
            style={[
              styles.footerGroup,
              (isSingleColumn || shouldUseSingleColumnFooter) && styles.footerGroupCompact,
              shouldUseSingleColumnFooter && styles.footerGroupStacked,
              useTwoColumnFooter && styles.footerGroupTwoColumn
            ]}
          >
            <Text style={styles.footerTitle}>{group.title}</Text>
            <Text style={[styles.footerGroupText, (isSingleColumn || shouldUseSingleColumnFooter) && styles.footerGroupTextCompact]}>{groupDescription(group.title)}</Text>
            {group.links.map((link) => (
              <Pressable key={link.slug} onPress={() => onLinkPress(link.slug)} style={styles.footerLinkWrap}>
                <Text style={styles.footerLink}>{link.label}</Text>
              </Pressable>
            ))}
          </View>
        ))}
      </View>
      ) : null}

      {visitorContext ? (
        <View style={[styles.footerNotice, (isSingleColumn || shouldUseSingleColumnFooter) && styles.footerNoticeCompact]}>
          <Ionicons color={palette.blue} name="information-circle-outline" size={18} />
          <Text style={styles.footerNoticeText}>
            Showing public terms and guidelines for {visitorContext.countryName} ({visitorContext.countryCode}).
          </Text>
        </View>
      ) : null}

      <Text style={styles.copyright}>{'\u00A9'} 2026 Sharity. All rights reserved.</Text>
    </View>
  );
}

function groupDescription(title: string) {
  if (title === 'Company') {
    return 'Learn who we are, how we build, and how we communicate publicly.';
  }
  if (title === 'Support') {
    return 'Find help resources, safety guidance, and public support contact paths.';
  }
  if (title === 'Legal') {
    return 'Review privacy, terms, and community rules for your region.';
  }
  return '';
}

const palette = marketingColors;

const styles = StyleSheet.create({
  footer: {
    borderTopColor: palette.border,
    borderTopWidth: 1,
    backgroundColor: palette.page,
    marginTop: 28,
    padding: 32
  },
  footerCompact: {
    padding: 18
  },
  footerAccordion: {
    borderBottomColor: palette.border,
    borderBottomWidth: 1,
    marginTop: 8,
    width: '100%'
  },
  footerAccordionItem: {
    borderTopColor: palette.border,
    borderTopWidth: 1,
    width: '100%'
  },
  footerAccordionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingVertical: 12
  },
  footerAccordionTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '800'
  },
  footerAccordionBody: {
    gap: 10,
    paddingBottom: 14,
    paddingLeft: 2
  },
  footerAccordionLinkWrap: {
    paddingVertical: 2
  },
  supportCard: {
    backgroundColor: '#FFFFFF',
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    maxWidth: 520,
    minWidth: 280,
    padding: 20
  },
  supportCardCompact: {
    maxWidth: '100%',
    minWidth: 0,
    width: '100%'
  },
  supportEyebrow: {
    color: palette.blue,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  supportTitle: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 28,
    marginTop: 8
  },
  supportText: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8
  },
  supportActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: 16
  },
  supportActionsCompact: {
    flexDirection: 'column'
  },
  supportActionButton: {
    alignItems: 'center',
    backgroundColor: palette.blue,
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  supportActionButtonCompact: {
    width: '100%'
  },
  supportActionButtonSecondary: {
    backgroundColor: '#E8F0FF'
  },
  supportActionText: {
    color: palette.white,
    fontSize: 13,
    fontWeight: '900'
  },
  supportActionTextSecondary: {
    color: palette.blue
  },
  footerGrid: {
    alignItems: 'stretch',
    borderBottomColor: palette.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xl,
    justifyContent: 'flex-start',
    marginTop: 24,
    paddingBottom: 24,
    width: '100%'
  },
  footerGridCompact: {
    gap: 24,
    width: '100%'
  },
  footerGridStacked: {
    flexDirection: 'column',
    gap: 28,
    width: '100%'
  },
  footerGridTwoColumn: {
    justifyContent: 'flex-start'
  },
  footerGroup: {
    alignSelf: 'stretch',
    flexBasis: 0,
    flexGrow: 1,
    gap: spacing.sm,
    minWidth: 220
  },
  footerGroupCompact: {
    minWidth: 0,
    width: '100%'
  },
  footerGroupStacked: {
    alignSelf: 'stretch',
    flexBasis: 'auto',
    minWidth: 0,
    width: '100%'
  },
  footerGroupTwoColumn: {
    width: '47%'
  },
  footerTitle: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '900'
  },
  footerGroupText: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 260
  },
  footerGroupTextCompact: {
    maxWidth: '100%',
    width: '100%'
  },
  footerLinkWrap: {
    paddingVertical: 2
  },
  footerLink: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 21,
    flexShrink: 1
  },
  footerNotice: {
    alignItems: 'center',
    backgroundColor: '#f8fbff',
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 28,
    padding: spacing.md
  },
  footerNoticeCompact: {
    alignItems: 'flex-start',
    flexDirection: 'column',
    width: '100%'
  },
  footerNoticeText: {
    color: palette.textMuted,
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    width: '100%'
  },
  copyright: {
    borderTopColor: palette.border,
    borderTopWidth: 1,
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 28,
    paddingTop: 20,
    textAlign: 'center'
  }
});
