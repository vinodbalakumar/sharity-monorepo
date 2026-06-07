import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useEffect, useMemo, useState, type ComponentProps, type ReactElement } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { InteriorShell } from '../../components/appShell/InteriorShell';
import { colors, radius, spacing } from '../../theme';
import type { AppRoute } from '../../types/navigation';
import { getWalletActivity, getWalletSummary, type WalletActivity, type WalletSummary } from '../../services/walletApi';

type Props = {
  onNavigate: (route: AppRoute) => void;
};

type ActivityListComponent<T> = (props: {
  data: T[];
  estimatedItemSize: number;
  keyExtractor: (item: T) => string;
  renderItem: (info: { item: T; index: number }) => ReactElement;
}) => ReactElement;

const ActivityList = FlashList as unknown as ActivityListComponent<WalletActivity>;

export function WalletScreen({ onNavigate }: Props) {
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [activity, setActivity] = useState<WalletActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [walletSummary, walletActivity] = await Promise.all([getWalletSummary(), getWalletActivity()]);
      setSummary(walletSummary);
      setActivity(walletActivity);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load wallet data.');
    } finally {
      setLoading(false);
    }
  }

  const money = useMemo(() => (value: number) => `${summary?.currencyCode ?? 'USD'} ${value.toFixed(2)}`, [summary?.currencyCode]);

  return (
    <InteriorShell activeLabel="Wallet" onNavigate={onNavigate} scrollable={false} subtitle="Live balances and ledger activity" title="Wallet & payments">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.hero}>
            <View>
              <Text style={styles.heroLabel}>Available balance</Text>
              <Text style={styles.balance}>{loading ? 'Loading...' : money(summary?.availableAmount ?? 0)}</Text>
              <Text style={styles.heroText}>
                Wallet balances, refunds, holds, and payouts are projected from live backend ledger data.
              </Text>
            </View>
          </View>

          {error ? <StateCard title={error} actionLabel="Reload" onAction={load} /> : null}

          <View style={styles.metricsRow}>
            <MetricCard icon="time-outline" label="Pending" value={money(summary?.pendingAmount ?? 0)} />
            <MetricCard icon="checkmark-done-outline" label="Paid" value={money(summary?.paidAmount ?? 0)} />
            <MetricCard icon="arrow-undo-outline" label="Reversed" value={money(summary?.reversedAmount ?? 0)} />
          </View>

          <View style={styles.quickLinks}>
            <QuickLink icon="receipt-outline" title="Orders" text="Open order history, receipts, refunds, and disputes." onPress={() => onNavigate('orders')} />
            <QuickLink icon="shield-checkmark-outline" title="Verification" text="Review seller access and payout eligibility." onPress={() => onNavigate('sellerVerification')} />
            <QuickLink icon="gift-outline" title="Rewards" text="View Sharity credit activity and redemption." onPress={() => onNavigate('rewards')} />
            <QuickLink icon="card-outline" title="Payment authorization" text="See the payment review and authorization surface." onPress={() => onNavigate('paymentAuthorization')} />
          </View>

          <View style={styles.listCard}>
            <Text style={styles.sectionTitle}>Recent activity</Text>
            {loading ? <Text style={styles.emptyText}>Loading wallet activity...</Text> : null}
            {!loading && activity.length === 0 ? <Text style={styles.emptyText}>No wallet activity yet.</Text> : null}
            {!loading && activity.length > 0 ? (
              <ActivityList
                data={activity}
                estimatedItemSize={88}
                keyExtractor={(item) => item.publicId}
                renderItem={({ item }) => <ActivityRow activity={item} />}
              />
            ) : null}
          </View>
        </View>
      </ScrollView>
    </InteriorShell>
  );
}

function QuickLink({ icon, onPress, text, title }: { icon: ComponentProps<typeof Ionicons>['name']; onPress: () => void; text: string; title: string }) {
  return (
    <Pressable accessibilityLabel={title} onPress={onPress} style={styles.quickLink}>
      <View style={styles.iconBubble}>
        <Ionicons color={colors.primary} name={icon} size={22} />
      </View>
      <Text style={styles.quickTitle}>{title}</Text>
      <Text style={styles.quickText}>{text}</Text>
      <Text style={styles.quickCta}>Open</Text>
    </Pressable>
  );
}

function MetricCard({ icon, label, value }: { icon: ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricIcon}>
        <Ionicons color={colors.primary} name={icon} size={18} />
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function ActivityRow({ activity }: { activity: WalletActivity }) {
  const positive = activity.direction.toUpperCase() === 'CREDIT';
  return (
    <View style={styles.activityRow}>
      <View style={styles.activityMeta}>
        <Text style={styles.activityTitle}>{activity.entryType.replace(/_/g, ' ')}</Text>
        <Text style={styles.activitySub}>{activity.description}</Text>
        <Text style={styles.activitySub}>{formatDate(activity.createdAt)}</Text>
      </View>
      <View style={styles.activityAmountWrap}>
        <Text style={[styles.activityAmount, positive ? styles.activityCredit : styles.activityDebit]}>
          {positive ? '+' : '-'}{activity.currencyCode} {Math.abs(activity.amount).toFixed(2)}
        </Text>
        <Text style={styles.activityStatus}>{activity.entryStatus}</Text>
      </View>
    </View>
  );
}

function StateCard({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={styles.stateCard}>
      <Text style={styles.stateText}>{title}</Text>
      {actionLabel ? <Text onPress={onAction} style={styles.stateAction}>{actionLabel}</Text> : null}
    </View>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxxl
  },
  container: {
    gap: spacing.lg,
    marginHorizontal: 'auto',
    maxWidth: 1240,
    padding: spacing.lg,
    width: '100%'
  },
  hero: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.xl
  },
  heroLabel: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800'
  },
  balance: {
    color: colors.textPrimary,
    fontSize: 34,
    fontWeight: '900',
    marginTop: spacing.xs
  },
  heroText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.sm,
    maxWidth: 760
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md
  },
  metricCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.large,
    borderWidth: 1,
    flexBasis: 180,
    flexGrow: 1,
    minHeight: 120,
    padding: spacing.lg
  },
  metricIcon: {
    alignItems: 'center',
    backgroundColor: '#E7F8F1',
    borderRadius: 999,
    height: 36,
    justifyContent: 'center',
    width: 36
  },
  metricLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    marginTop: spacing.md
  },
  metricValue: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    marginTop: spacing.xs
  },
  quickLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md
  },
  quickLink: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.large,
    borderWidth: 1,
    flexBasis: 240,
    flexGrow: 1,
    minHeight: 168,
    padding: spacing.lg
  },
  iconBubble: {
    alignItems: 'center',
    backgroundColor: '#EAF8F4',
    borderRadius: 999,
    height: 48,
    justifyContent: 'center',
    width: 48
  },
  quickTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    marginTop: spacing.md
  },
  quickText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.xs
  },
  quickCta: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
    marginTop: spacing.md
  },
  listCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: spacing.md
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: spacing.sm
  },
  activityRow: {
    alignItems: 'center',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    paddingVertical: spacing.md
  },
  activityMeta: {
    flex: 1,
    gap: 2
  },
  activityTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800'
  },
  activitySub: {
    color: colors.textSecondary,
    fontSize: 12
  },
  activityAmountWrap: {
    alignItems: 'flex-end'
  },
  activityAmount: {
    fontSize: 15,
    fontWeight: '900'
  },
  activityCredit: {
    color: '#0F6E56'
  },
  activityDebit: {
    color: '#A32D2D'
  },
  activityStatus: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2
  },
  stateCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.large,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg
  },
  stateText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800'
  },
  stateAction: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900'
  }
});

