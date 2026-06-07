import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { spacing } from '../../theme';
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
  return (
    <View style={styles.footer}>
      <View style={styles.brandRow}>
        <Pressable
          accessibilityRole={onBrandPress ? 'button' : undefined}
          onPress={onBrandPress}
          style={styles.brandWrap}
        >
          <View style={styles.brandMark}>
            <Text style={styles.brandLetter}>S</Text>
          </View>
          <View>
            <Text style={styles.brandName}>Sharity</Text>
            {visitorContext ? (
              <Text style={styles.brandMeta}>
                {visitorContext.countryName} ({visitorContext.countryCode})
              </Text>
            ) : null}
          </View>
        </Pressable>
      </View>

      <View style={styles.footerGrid}>
        {groups.map((group) => (
          <View key={group.title} style={styles.footerGroup}>
            <Text style={styles.footerTitle}>{group.title}</Text>
            {group.links.map((link) => (
              <Pressable key={link.slug} onPress={() => onLinkPress(link.slug)}>
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

const palette = {
  blue: '#3B82F6',
  border: '#20284A',
  header: '#0D132B',
  text: '#F8FAFC',
  textMuted: '#8FA0BF',
  white: '#FFFFFF'
};

const styles = StyleSheet.create({
  footer: {
    borderTopColor: palette.border,
    borderTopWidth: 1,
    marginTop: 28,
    padding: 32
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between'
  },
  brandWrap: {
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
  brandName: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '900'
  },
  brandMeta: {
    color: palette.textMuted,
    fontSize: 13,
    marginTop: 2
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
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21
  },
  footerNotice: {
    alignItems: 'center',
    backgroundColor: '#0B1634',
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
