import { Ionicons } from '@expo/vector-icons';
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
  const shouldStackTopBand = width < 1180;
  const shouldUseSingleColumnFooter = width < 720;
  const useTwoColumnFooter = !shouldUseSingleColumnFooter && width < 1080;
  const shouldStackSupportActions = width < 520;
  const supportActions = [
    { label: 'Get Help', slug: 'help-center' },
    { label: 'Contact Support', slug: 'contact-us' }
  ];

  return (
    <View style={[styles.footer, isCompactPhone && styles.footerCompact]}>
      <View style={[styles.topBand, isSingleColumn && styles.topBandCompact, shouldStackTopBand && styles.topBandStacked]}>
        <View style={[styles.brandColumn, shouldStackTopBand && styles.brandColumnStacked]}>
          <Pressable
            accessibilityRole={onBrandPress ? 'button' : undefined}
            onPress={onBrandPress}
            style={[styles.brandWrap, isCompactPhone && styles.brandWrapCompact]}
          >
            <View style={styles.brandMark}>
              <Text style={styles.brandLetter}>S</Text>
            </View>
            <View style={styles.brandCopy}>
              <Text style={styles.brandName}>Sharity</Text>
              <Text style={styles.brandTagline}>Shop, sell, and manage your account with clear policies and trusted support.</Text>
              {visitorContext ? (
                <Text style={styles.brandMeta}>
                  Public information for {visitorContext.countryName} ({visitorContext.countryCode})
                </Text>
              ) : null}
            </View>
          </Pressable>
        </View>

        <View style={[styles.supportCard, (isSingleColumn || shouldStackTopBand) && styles.supportCardCompact]}>
          <Text style={styles.supportEyebrow}>Support</Text>
          <Text style={styles.supportTitle}>Need help with an order, account, or safety issue?</Text>
          <Text style={styles.supportText}>Start with our public help resources, then move into signed-in support when you need account-specific assistance.</Text>
          <View style={[styles.supportActions, (isCompactPhone || shouldStackSupportActions) && styles.supportActionsCompact]}>
            {supportActions.map((action, index) => (
              <Pressable key={action.slug} onPress={() => onLinkPress(action.slug)} style={[styles.supportActionButton, (isCompactPhone || shouldStackSupportActions) && styles.supportActionButtonCompact, index === 1 && styles.supportActionButtonSecondary]}>
                <Text style={[styles.supportActionText, index === 1 && styles.supportActionTextSecondary]}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <View style={[styles.footerGrid, (isSingleColumn || shouldUseSingleColumnFooter) && styles.footerGridCompact, useTwoColumnFooter && styles.footerGridTwoColumn]}>
        {groups.map((group) => (
          <View
            key={group.title}
            style={[
              styles.footerGroup,
              (isSingleColumn || shouldUseSingleColumnFooter) && styles.footerGroupCompact,
              useTwoColumnFooter && styles.footerGroupTwoColumn
            ]}
          >
            <Text style={styles.footerTitle}>{group.title}</Text>
            <Text style={styles.footerGroupText}>{groupDescription(group.title)}</Text>
            {group.links.map((link) => (
              <Pressable key={link.slug} onPress={() => onLinkPress(link.slug)} style={styles.footerLinkWrap}>
                <Text style={styles.footerLink}>{link.label}</Text>
              </Pressable>
            ))}
          </View>
        ))}
      </View>

      {visitorContext ? (
        <View style={styles.footerNotice}>
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
  topBand: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xl,
    justifyContent: 'space-between'
  },
  topBandCompact: {
    gap: spacing.lg
  },
  topBandStacked: {
    flexDirection: 'column'
  },
  brandColumn: {
    flex: 1,
    minWidth: 280
  },
  brandColumnStacked: {
    minWidth: 0,
    width: '100%'
  },
  brandWrap: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    minWidth: 0
  },
  brandWrapCompact: {
    alignItems: 'flex-start'
  },
  brandCopy: {
    flex: 1,
    minWidth: 0
  },
  brandMark: {
    alignItems: 'center',
    backgroundColor: palette.blue,
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    width: 48
  },
  brandLetter: {
    color: palette.white,
    fontSize: 24,
    fontWeight: '900'
  },
  brandName: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '900'
  },
  brandTagline: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    marginTop: 4,
    maxWidth: 520
  },
  brandMeta: {
    color: palette.textMuted,
    fontSize: 13,
    marginTop: 8
  },
  supportCard: {
    backgroundColor: '#FFFFFF',
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    maxWidth: 480,
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
    borderBottomColor: palette.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xl,
    justifyContent: 'space-between',
    marginTop: 24,
    paddingBottom: 24
  },
  footerGridCompact: {
    gap: spacing.lg
  },
  footerGridTwoColumn: {
    justifyContent: 'flex-start'
  },
  footerGroup: {
    gap: spacing.sm,
    minWidth: 220
  },
  footerGroupCompact: {
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
  footerLinkWrap: {
    paddingVertical: 2
  },
  footerLink: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 21
  },
  footerNotice: {
    alignItems: 'center',
    backgroundColor: '#f8fbff',
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 24,
    padding: spacing.md
  },
  footerNoticeText: {
    color: palette.textMuted,
    flex: 1,
    fontSize: 13,
    lineHeight: 19
  },
  copyright: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 20,
    textAlign: 'center'
  }
});
