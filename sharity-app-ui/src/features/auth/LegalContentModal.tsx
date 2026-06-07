import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { VisitorContextResponse } from '../../services/publicContentApi';
import { getPublicContentPage, type PublicContentPageResponse } from '../../services/publicContentApi';
import { authPalette, authSpacing } from './authTheme';

type Props = {
  context?: VisitorContextResponse | null;
  onClose: () => void;
  slug: 'terms' | 'privacy';
  title: string;
  visible: boolean;
};

export function LegalContentModal({ context, onClose, slug, title, visible }: Props) {
  const [page, setPage] = useState<PublicContentPageResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locale = useMemo(() => context?.locale ?? 'en-US', [context?.locale]);

  useEffect(() => {
    let mounted = true;
    if (!visible) {
      return undefined;
    }

    setLoading(true);
    setError(null);
    getPublicContentPage(slug, context?.countryCode, locale)
      .then((response) => {
        if (mounted) {
          setPage(response);
        }
      })
      .catch(() => {
        if (mounted) {
          setError('This content is unavailable right now.');
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [context?.countryCode, locale, slug, visible]);

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.overlay}>
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>
                {context?.countryName ? `${context.countryName} (${context.countryCode})` : 'Region-aware edition'}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons color={authPalette.text} name="close" size={20} />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.stateBox}>
              <ActivityIndicator color={authPalette.accent} />
              <Text style={styles.stateText}>Loading content...</Text>
            </View>
          ) : null}

          {error ? (
            <View style={styles.stateBox}>
              <Ionicons color={authPalette.danger} name="alert-circle-outline" size={18} />
              <Text style={styles.stateText}>{error}</Text>
            </View>
          ) : null}

          {page && !loading ? (
            <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
              <Text style={styles.pageTitle}>{page.title}</Text>
              <Text style={styles.meta}>
                Effective {page.effectiveDate} • Reviewed {page.lastReviewedAt}
              </Text>
              {page.sections.map((section, index) => (
                <View key={`${section.heading}-${index}`} style={styles.section}>
                  <Text style={styles.sectionHeading}>{section.heading}</Text>
                  {section.paragraphs.map((paragraph, paragraphIndex) => (
                    <Text key={`${section.heading}-${paragraphIndex}`} style={styles.paragraph}>
                      {paragraph}
                    </Text>
                  ))}
                </View>
              ))}
            </ScrollView>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(5, 5, 18, 0.72)',
    flex: 1,
    justifyContent: 'center',
    padding: authSpacing.lg
  },
  sheet: {
    backgroundColor: authPalette.card,
    borderColor: authPalette.border,
    borderRadius: 24,
    borderWidth: 1,
    maxHeight: '84%',
    maxWidth: 760,
    padding: authSpacing.xl,
    width: '100%'
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: authSpacing.md,
    justifyContent: 'space-between',
    marginBottom: authSpacing.lg
  },
  headerCopy: {
    flex: 1,
    gap: authSpacing.xs
  },
  title: {
    color: authPalette.text,
    fontSize: 22,
    fontWeight: '900'
  },
  subtitle: {
    color: authPalette.textMuted,
    fontSize: 13,
    lineHeight: 18
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: authPalette.input,
    borderRadius: 999,
    height: 36,
    justifyContent: 'center',
    width: 36
  },
  stateBox: {
    alignItems: 'center',
    backgroundColor: authPalette.cardAlt,
    borderRadius: 18,
    flexDirection: 'row',
    gap: authSpacing.sm,
    justifyContent: 'center',
    marginBottom: authSpacing.md,
    minHeight: 64
  },
  stateText: {
    color: authPalette.textMuted,
    fontSize: 14,
    fontWeight: '700'
  },
  content: {
    maxHeight: 520
  },
  pageTitle: {
    color: authPalette.text,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: authSpacing.xs
  },
  meta: {
    color: authPalette.textMuted,
    fontSize: 13,
    marginBottom: authSpacing.lg
  },
  section: {
    backgroundColor: authPalette.cardAlt,
    borderRadius: 18,
    gap: authSpacing.sm,
    marginBottom: authSpacing.md,
    padding: authSpacing.lg
  },
  sectionHeading: {
    color: authPalette.text,
    fontSize: 16,
    fontWeight: '900'
  },
  paragraph: {
    color: authPalette.textMuted,
    fontSize: 14,
    lineHeight: 21
  }
});
