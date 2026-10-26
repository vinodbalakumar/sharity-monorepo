import { colors } from '../../theme';
import { systemFontFamily } from '../../theme/typography';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { memo, useCallback, useEffect, useMemo, useState, type ComponentProps } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ListRenderItemInfo,
  type ViewStyle
} from 'react-native';

import { InteriorShell } from '../../components/appShell/InteriorShell';
import { getBuyerOrders } from '../../services/ordersApi';
import type { AppRoute } from '../../types/navigation';

type OrdersScreenProps = {
  onNavigate: (route: AppRoute) => void;
  onOpenOrderDetails?: (orderId: string) => void;
  onOpenReceipt?: (orderId: string, receiptId: string) => void;
  onOpenTracking?: (orderId: string) => void;
};

type OrderType = 'digital' | 'physical';
type OrderStatus = 'access_ready' | 'shipped' | 'processing' | 'delivered' | 'refund_requested' | 'disputed';
type PaymentStatus = 'paid' | 'delivered' | 'pending';
type OrderFilter = 'All' | 'Digital' | 'Electronics' | 'Processing' | 'Shipped' | 'Delivered' | 'Refunded' | 'Disputed';
type SortMode = 'Newest First' | 'Oldest First' | 'Highest Amount' | 'Lowest Amount';
type BadgeTone = 'delivered' | 'shipped' | 'paid' | 'disputed' | 'refunded' | 'pending' | 'accessReady';

type OrderItem = {
  currencyCode: string;
  category: string;
  dateIso: string;
  dateLabel: string;
  id: string;
  imageUrl: string;
  name: string;
  payment: PaymentStatus;
  price: number;
  seller: string;
  status: OrderStatus;
  trackingStep?: 1 | 2 | 3 | 4;
  type: OrderType;
};

type ActionConfig = {
  accessibilityLabel: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
};

const BRAND = colors.primary;
const BORDER = colors.border;
const BG = colors.background;
const SURFACE = '#FFFFFF';
const TEXT = colors.textPrimary;
const TEXT_SECONDARY = colors.textSecondary;
const TEXT_TERTIARY = '#9E9E9E';
const WHITE = '#FFFFFF';
const DANGER = '#A32D2D';

const BADGE = {
  delivered: { bg: '#EAF3DE', text: '#3B6D11' },
  shipped: { bg: '#E6F1FB', text: '#185FA5' },
  paid: { bg: '#E1F5EE', text: '#0F6E56' },
  disputed: { bg: '#FCEBEB', text: '#A32D2D' },
  refunded: { bg: '#FBEAF0', text: '#993556' },
  pending: { bg: '#FAEEDA', text: '#854F0B' },
  accessReady: { bg: '#EAF3DE', text: '#3B6D11' }
} as const;

const FILTERS: OrderFilter[] = ['All', 'Digital', 'Electronics', 'Processing', 'Shipped', 'Delivered', 'Refunded', 'Disputed'];
const SORT_OPTIONS: SortMode[] = ['Newest First', 'Oldest First', 'Highest Amount', 'Lowest Amount'];

export function OrdersScreen({ onNavigate, onOpenOrderDetails, onOpenReceipt, onOpenTracking }: OrdersScreenProps) {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<OrderFilter>('All');
  const [sortMode, setSortMode] = useState<SortMode>('Newest First');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const loadOrders = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(false);

    try {
      const response = await getBuyerOrders(signal);
      setOrders(response);
    } catch (err) {
      if (signal?.aborted || (err instanceof DOMException && err.name === 'AbortError')) {
        return;
      }
      setOrders([]);
      setError(true);
    } finally {
      if (signal?.aborted) {
        return;
      }
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadOrders(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadOrders]);

  const reloadOrders = useCallback(() => {
    const controller = new AbortController();
    void loadOrders(controller.signal);
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const result = orders.filter((order) => {
      const matchesFilter = matchesFilterValue(order, selectedFilter);
      const searchableText = [order.id, order.name, order.category, order.seller, order.status, order.payment, order.dateLabel].join(' ').toLowerCase();
      return matchesFilter && (!normalizedQuery || searchableText.includes(normalizedQuery));
    });

    return sortOrders(result, sortMode);
  }, [orders, searchQuery, selectedFilter, sortMode]);

  const listHeader = useMemo(() => (
    <OrdersToolbar
      activeFilter={selectedFilter}
      onFilterPress={() => setFilterSheetOpen(true)}
      onSearchChange={setSearchQuery}
      onSelectFilter={setSelectedFilter}
      searchQuery={searchQuery}
      loading={loading}
      totalCount={loading ? 0 : filteredOrders.length}
    />
  ), [filteredOrders.length, loading, searchQuery, selectedFilter]);

  const listEmpty = useMemo(() => {
    if (loading) {
      return <LoadingState />;
    }

    if (error) {
      return <ErrorState message="We could not load your orders right now." onRetry={reloadOrders} />;
    }

    if (orders.length === 0) {
      return (
        <EmptyState
          ctaLabel="Explore Marketplace"
          icon="cart-outline"
          onCta={() => onNavigate('marketplaces')}
          subtitle="Your digital purchases, electronics orders, refunds, and shipment updates will appear here."
          title="No orders yet"
        />
      );
    }

    return (
      <EmptyState
        ctaLabel="Clear Filters"
        icon="filter-outline"
        onCta={() => {
          setSearchQuery('');
          setSelectedFilter('All');
          setSortMode('Newest First');
        }}
        subtitle="Try a different search or filter to see more orders."
        title="No orders match these filters"
      />
    );
  }, [error, loading, onNavigate, orders.length, reloadOrders]);

  const renderItem = useCallback(({ item }: ListRenderItemInfo<OrderItem>) => (
    <OrderCard
      onOpenDetails={handleOpenDetailsFactory(onOpenOrderDetails)}
      onOpenReceipt={handleOpenReceiptFactory(onOpenReceipt)}
      onOpenSupport={() => onNavigate('support')}
      onOpenTracking={handleOpenTrackingFactory(onOpenTracking, onNavigate)}
      order={item}
    />
  ), [onNavigate, onOpenOrderDetails, onOpenReceipt, onOpenTracking]);

  return (
    <InteriorShell activeLabel="Orders" onNavigate={onNavigate} scrollable={false} subtitle="Digital, electronics, refunds, disputes, receipts, and safe tracking summaries in one place." title="My Orders">
      <FlatList
        data={loading ? [] : filteredOrders}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />

      <FilterSheet
        onClose={() => setFilterSheetOpen(false)}
        onReset={() => {
          setSearchQuery('');
          setSelectedFilter('All');
          setSortMode('Newest First');
          setFilterSheetOpen(false);
        }}
        onSelectSort={setSortMode}
        sortMode={sortMode}
        visible={filterSheetOpen}
      />
    </InteriorShell>
  );
}

function OrdersToolbar({
  activeFilter,
  onFilterPress,
  onSearchChange,
  onSelectFilter,
  searchQuery,
  loading,
  totalCount
}: {
  activeFilter: OrderFilter;
  onFilterPress: () => void;
  onSearchChange: (value: string) => void;
  onSelectFilter: (value: OrderFilter) => void;
  searchQuery: string;
  loading: boolean;
  totalCount: number;
}) {
  return (
    <View style={styles.toolbar}>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons color={TEXT_SECONDARY} name="search" size={18} />
          <TextInput
            accessibilityLabel="Search orders"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Search orders"
            placeholderTextColor={TEXT_TERTIARY}
            selectionColor={BRAND}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={onSearchChange}
          />
        </View>

        <Pressable
          accessibilityLabel="Open order sort and filter options"
          onPress={onFilterPress}
          style={({ pressed }) => [styles.filterIconButton, pressed ? styles.pressed : null]}
        >
          <Ionicons color={TEXT} name="options-outline" size={20} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRail}
      >
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <Pressable
              key={filter}
              accessibilityLabel={`Filter orders by ${filter}`}
              onPress={() => onSelectFilter(filter)}
              style={({ pressed }) => [
                styles.filterPill,
                isActive ? styles.filterPillActive : null,
                pressed ? styles.pressed : null
              ]}
            >
              <Text style={[styles.filterPillText, isActive ? styles.filterPillTextActive : null]}>{filter}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.countText}>{loading ? 'Loading orders...' : `${totalCount} order${totalCount === 1 ? '' : 's'} shown`}</Text>
    </View>
  );
}

const OrderCard = memo(function OrderCard({
  onOpenDetails,
  onOpenReceipt,
  onOpenSupport,
  onOpenTracking,
  order
}: {
  onOpenDetails: (order: OrderItem) => void;
  onOpenReceipt: (order: OrderItem) => void;
  onOpenSupport: () => void;
  onOpenTracking: (order: OrderItem) => void;
  order: OrderItem;
}) {
  const isPhysical = order.type === 'physical';
  const isRefundOrDisputed = order.status === 'disputed' || order.status === 'refund_requested';
  const statusToneValue = statusTone(order.status);
  const paymentToneValue = paymentTone(order.payment);
  const actionItems = buildActions(order, onOpenDetails, onOpenTracking, onOpenReceipt, onOpenSupport);

  return (
    <View style={[styles.orderCard, cardShadow]}>
      <View style={styles.cardTopRow}>
        <View style={styles.cardTopLeft}>
          <Image source={{ uri: order.imageUrl }} style={styles.thumbnail} contentFit="cover" />
          <View style={styles.cardCopy}>
            <Text numberOfLines={2} style={styles.productName}>
              {order.name}
            </Text>
            <Text numberOfLines={1} style={styles.orderIdText}>
              {order.id} · {order.dateLabel}
            </Text>
          </View>
        </View>

        <StatusBadge label={statusLabel(order.status)} tone={statusToneValue} />
      </View>

      <Text numberOfLines={1} style={styles.sellerLine}>
        {order.seller} · {order.category}
      </Text>

      <View style={styles.priceRow}>
        <Text style={styles.priceText}>{formatMoney(order.price, order.currencyCode)}</Text>
        <StatusBadge label={paymentLabel(order.payment)} tone={paymentToneValue} />
      </View>

      {isPhysical ? <TrackingProgress step={order.trackingStep ?? trackingStepFor(order.status)} /> : null}

      {isRefundOrDisputed ? (
        <View style={styles.alertBanner}>
          <Ionicons color={DANGER} name="alert-circle-outline" size={18} />
          <Text style={styles.alertText}>
            {order.status === 'disputed'
              ? 'Dispute open. Our team is reviewing the order.'
              : 'Refund requested. The order is under review.'}
          </Text>
        </View>
      ) : null}

      <View style={styles.actionRow}>
        {actionItems.map((action) => (
          <ActionButton
            key={action.label}
            accessibilityLabel={action.accessibilityLabel}
            icon={action.icon}
            label={action.label}
            onPress={action.onPress}
          />
        ))}
      </View>
    </View>
  );
});

function buildActions(
  order: OrderItem,
  onOpenDetails: (order: OrderItem) => void,
  onOpenTracking: (order: OrderItem) => void,
  onOpenReceipt: (order: OrderItem) => void,
  onOpenSupport: () => void
) {
  const baseActions: ActionConfig[] = [
    {
      accessibilityLabel: `View details for ${order.name}`,
      icon: 'document-text-outline' as const,
      label: 'Details',
      onPress: () => onOpenDetails(order)
    }
  ];

  if (order.type === 'digital') {
    baseActions.push({
      accessibilityLabel: `Open library for ${order.name}`,
      icon: 'library-outline' as const,
      label: 'Library',
      onPress: () => onOpenTracking(order)
    });
  } else if (order.status === 'disputed' || order.status === 'refund_requested') {
    baseActions.push({
      accessibilityLabel: `Open support for ${order.name}`,
      icon: 'help-circle-outline' as const,
      label: 'Support',
      onPress: onOpenSupport
    });
  } else {
    baseActions.push({
      accessibilityLabel: `Track package for ${order.name}`,
      icon: 'navigate-outline' as const,
      label: 'Track',
      onPress: () => onOpenTracking(order)
    });
  }

  baseActions.push({
    accessibilityLabel: `View receipt for ${order.name}`,
    icon: 'receipt-outline' as const,
    label: 'Receipt',
    onPress: () => onOpenReceipt(order)
  });

  return baseActions;
}

function ActionButton({
  accessibilityLabel,
  icon,
  label,
  onPress
}: {
  accessibilityLabel: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.actionButton, pressed ? styles.pressed : null]}
    >
      <Ionicons color={TEXT} name={icon} size={14} />
      <Text numberOfLines={1} style={styles.actionButtonText}>
        {label}
      </Text>
    </Pressable>
  );
}

function TrackingProgress({ step }: { step: 1 | 2 | 3 | 4 }) {
  const labels: [string, 1 | 2 | 3 | 4][] = [
    ['Ordered', 1],
    ['Shipped', 2],
    ['In Transit', 3],
    ['Delivered', 4]
  ];

  return (
    <View style={styles.progressBlock}>
      <View style={styles.progressRow}>
        {labels.map(([, index]) => (
          <View
            key={index}
            style={[
              styles.progressSegment,
              index <= step ? styles.progressSegmentActive : styles.progressSegmentInactive
            ]}
          />
        ))}
      </View>
      <View style={styles.progressLabelRow}>
        {labels.map(([label, index]) => (
          <Text
            key={label}
            style={[
              styles.progressLabel,
              index <= step ? styles.progressLabelActive : styles.progressLabelInactive
            ]}
          >
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

function StatusBadge({ label, tone }: { label: string; tone: BadgeTone }) {
  const badge = BADGE[tone];

  return (
    <View accessibilityLabel={label} style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
      <Text style={[styles.statusBadgeText, { color: badge.text }]}>{label}</Text>
    </View>
  );
}

function LoadingState() {
  return (
    <View style={styles.stateStack}>
      {[0, 1, 2].map((item) => (
        <View key={item} style={[styles.skeletonCard, cardShadow]}>
          <View style={styles.skeletonTopRow}>
            <View style={styles.skeletonThumb} />
            <View style={styles.skeletonTextBlock}>
              <View style={styles.skeletonLineLarge} />
              <View style={styles.skeletonLineSmall} />
            </View>
            <View style={styles.skeletonBadge} />
          </View>
          <View style={styles.skeletonLineMedium} />
          <View style={styles.skeletonLineShort} />
          <View style={styles.skeletonActionRow}>
            <View style={styles.skeletonActionButton} />
            <View style={styles.skeletonActionButton} />
            <View style={styles.skeletonActionButton} />
          </View>
        </View>
      ))}
    </View>
  );
}

function EmptyState({
  ctaLabel,
  icon,
  onCta,
  subtitle,
  title
}: {
  ctaLabel?: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  onCta?: () => void;
  subtitle: string;
  title: string;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons color={BRAND} name={icon} size={24} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
      {ctaLabel && onCta ? (
        <Pressable accessibilityLabel={ctaLabel} onPress={onCta} style={({ pressed }) => [styles.emptyCta, pressed ? styles.pressed : null]}>
          <Text style={styles.emptyCtaText}>{ctaLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ErrorState({
  message,
  onRetry
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons color={DANGER} name="alert-circle-outline" size={24} />
      </View>
      <Text style={styles.emptyTitle}>Something went wrong</Text>
      <Text style={styles.emptySubtitle}>{message}</Text>
      <Pressable accessibilityLabel="Retry loading orders" onPress={onRetry} style={({ pressed }) => [styles.emptyCta, pressed ? styles.pressed : null]}>
        <Text style={styles.emptyCtaText}>Retry</Text>
      </Pressable>
    </View>
  );
}

function FilterSheet({
  onClose,
  onReset,
  onSelectSort,
  sortMode,
  visible
}: {
  onClose: () => void;
  onReset: () => void;
  onSelectSort: (sort: SortMode) => void;
  sortMode: SortMode;
  visible: boolean;
}) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable accessibilityLabel="Close order filters" onPress={onClose} style={styles.modalBackdrop} />
        <View style={[styles.filterSheet, cardShadow]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.filterSheetTitle}>Sort orders</Text>
          <View style={styles.filterSheetOptions}>
            {SORT_OPTIONS.map((sort) => {
              const isActive = sortMode === sort;
              return (
                <Pressable
                  key={sort}
                  accessibilityLabel={`Sort by ${sort}`}
                  onPress={() => onSelectSort(sort)}
                  style={({ pressed }) => [
                    styles.sortOption,
                    isActive ? styles.sortOptionActive : null,
                    pressed ? styles.pressed : null
                  ]}
                >
                  <Text style={[styles.sortOptionText, isActive ? styles.sortOptionTextActive : null]}>{sort}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.sheetActions}>
            <Pressable
              accessibilityLabel="Reset all filters"
              onPress={onReset}
              style={({ pressed }) => [styles.sheetSecondaryButton, pressed ? styles.pressed : null]}
            >
              <Text style={styles.sheetSecondaryButtonText}>Reset</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Close order filters"
              onPress={onClose}
              style={({ pressed }) => [styles.sheetPrimaryButton, pressed ? styles.pressed : null]}
            >
              <Text style={styles.sheetPrimaryButtonText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function matchesFilterValue(order: OrderItem, filter: OrderFilter) {
  if (filter === 'All') {
    return true;
  }
  if (filter === 'Digital') {
    return order.type === 'digital';
  }
  if (filter === 'Electronics') {
    return order.type === 'physical' && order.category.toLowerCase().includes('electronics');
  }
  if (filter === 'Processing') {
    return order.status === 'processing';
  }
  if (filter === 'Shipped') {
    return order.status === 'shipped';
  }
  if (filter === 'Delivered') {
    return order.status === 'delivered';
  }
  if (filter === 'Refunded') {
    return order.status === 'refund_requested';
  }
  if (filter === 'Disputed') {
    return order.status === 'disputed';
  }
  return true;
}

function sortOrders(orderList: OrderItem[], sort: SortMode) {
  return [...orderList].sort((left, right) => {
    if (sort === 'Oldest First') {
      return new Date(left.dateIso).getTime() - new Date(right.dateIso).getTime();
    }
    if (sort === 'Highest Amount') {
      return right.price - left.price;
    }
    if (sort === 'Lowest Amount') {
      return left.price - right.price;
    }
    return new Date(right.dateIso).getTime() - new Date(left.dateIso).getTime();
  });
}

function statusLabel(status: OrderStatus) {
  switch (status) {
    case 'access_ready':
      return 'Access Ready';
    case 'shipped':
      return 'Shipped';
    case 'processing':
      return 'Pending';
    case 'delivered':
      return 'Delivered';
    case 'refund_requested':
      return 'Pending';
    case 'disputed':
      return 'Disputed';
    default:
      return 'Pending';
  }
}

function statusTone(status: OrderStatus): BadgeTone {
  switch (status) {
    case 'access_ready':
      return 'accessReady';
    case 'shipped':
      return 'shipped';
    case 'processing':
      return 'pending';
    case 'delivered':
      return 'delivered';
    case 'refund_requested':
      return 'pending';
    case 'disputed':
      return 'disputed';
    default:
      return 'pending';
  }
}

function paymentLabel(payment: PaymentStatus) {
  switch (payment) {
    case 'paid':
      return 'Paid';
    case 'delivered':
      return 'Delivered';
    default:
      return 'Pending';
  }
}

function paymentTone(payment: PaymentStatus): BadgeTone {
  switch (payment) {
    case 'paid':
      return 'paid';
    case 'delivered':
      return 'delivered';
    default:
      return 'pending';
  }
}

function trackingStepFor(status: OrderStatus): 1 | 2 | 3 | 4 {
  switch (status) {
    case 'access_ready':
      return 1;
    case 'shipped':
      return 2;
    case 'processing':
      return 1;
    case 'delivered':
      return 4;
    case 'refund_requested':
      return 4;
    case 'disputed':
      return 4;
    default:
      return 1;
  }
}

function formatMoney(value: number, currencyCode = 'USD') {
  return new Intl.NumberFormat('en-US', { currency: currencyCode, style: 'currency' }).format(value);
}

function handleOpenDetailsFactory(onOpenOrderDetails?: (orderId: string) => void) {
  return (order: OrderItem) => {
    onOpenOrderDetails?.(order.id);
  };
}

function handleOpenReceiptFactory(onOpenReceipt?: (orderId: string, receiptId: string) => void) {
  return (order: OrderItem) => {
    onOpenReceipt?.(order.id, `RCPT-${order.id}`);
  };
}

function handleOpenTrackingFactory(
  onOpenTracking?: (orderId: string) => void,
  onNavigate?: (route: AppRoute) => void
) {
  return (order: OrderItem) => {
    if (order.type === 'digital') {
      onNavigate?.('library');
      return;
    }
    onOpenTracking?.(order.id);
  };
}

const cardShadow: ViewStyle = Platform.select<ViewStyle>({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8
  },
  android: {
    elevation: 3
  },
  web: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8
  }
}) ?? {};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: BG,
    flex: 1
  },
  screen: {
    backgroundColor: BG,
    flex: 1
  },
  header: {
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderBottomColor: BORDER,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14
  },
  headerLeft: {
    alignItems: 'flex-start',
    gap: 8
  },
  brandAvatar: {
    alignItems: 'center',
    backgroundColor: BRAND,
    borderRadius: 16,
    height: 44,
    justifyContent: 'center',
    width: 44
  },
  brandAvatarText: {
    color: WHITE,
    fontFamily: systemFontFamily,
    fontSize: 20,
    fontWeight: '900'
  },
  headerTitle: {
    color: TEXT,
    fontFamily: systemFontFamily,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 28
  },
  userAvatar: {
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderColor: BORDER,
    borderRadius: 999,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40
  },
  userAvatarText: {
    color: TEXT,
    fontFamily: systemFontFamily,
    fontSize: 13,
    fontWeight: '900'
  },
  list: {
    flex: 1
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28
  },
  toolbar: {
    gap: 14
  },
  searchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderColor: BORDER,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 14
  },
  searchInput: {
    color: TEXT,
    flex: 1,
    fontFamily: systemFontFamily,
    fontSize: 14,
    minHeight: 24,
    paddingVertical: 0
  },
  filterIconButton: {
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderColor: BORDER,
    borderRadius: 14,
    borderWidth: 1,
    height: 52,
    justifyContent: 'center',
    width: 52
  },
  filterRail: {
    gap: 8,
    paddingVertical: 2
  },
  filterPill: {
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderColor: BORDER,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: 14
  },
  filterPillActive: {
    backgroundColor: BRAND,
    borderColor: BRAND
  },
  filterPillText: {
    color: TEXT_SECONDARY,
    fontFamily: systemFontFamily,
    fontSize: 13,
    fontWeight: '800'
  },
  filterPillTextActive: {
    color: WHITE
  },
  countText: {
    color: TEXT_SECONDARY,
    fontFamily: systemFontFamily,
    fontSize: 13,
    fontWeight: '700'
  },
  orderCard: {
    backgroundColor: SURFACE,
    borderColor: BORDER,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    marginBottom: 14,
    padding: 14
  },
  cardTopRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  cardTopLeft: {
    alignItems: 'flex-start',
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    minWidth: 0
  },
  thumbnail: {
    borderRadius: 10,
    height: 52,
    width: 52
  },
  cardCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0
  },
  productName: {
    color: TEXT,
    fontFamily: systemFontFamily,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 21
  },
  orderIdText: {
    color: TEXT_TERTIARY,
    fontFamily: systemFontFamily,
    fontSize: 12,
    fontWeight: '700'
  },
  sellerLine: {
    color: TEXT_SECONDARY,
    fontFamily: systemFontFamily,
    fontSize: 13,
    fontWeight: '700'
  },
  priceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  priceText: {
    color: TEXT,
    fontFamily: systemFontFamily,
    fontSize: 18,
    fontWeight: '900'
  },
  statusBadge: {
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  statusBadgeText: {
    fontFamily: systemFontFamily,
    fontSize: 11,
    fontWeight: '900'
  },
  progressBlock: {
    gap: 8
  },
  progressRow: {
    flexDirection: 'row',
    gap: 4
  },
  progressSegment: {
    borderRadius: 999,
    flex: 1,
    height: 6
  },
  progressSegmentActive: {
    backgroundColor: BRAND
  },
  progressSegmentInactive: {
    backgroundColor: '#DDE3E8'
  },
  progressLabelRow: {
    flexDirection: 'row',
    gap: 4
  },
  progressLabel: {
    flex: 1,
    fontFamily: systemFontFamily,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center'
  },
  progressLabelActive: {
    color: BRAND
  },
  progressLabelInactive: {
    color: TEXT_TERTIARY
  },
  alertBanner: {
    alignItems: 'flex-start',
    backgroundColor: '#FCEBEB',
    borderColor: '#F1BDBD',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: 12
  },
  alertText: {
    color: DANGER,
    flex: 1,
    fontFamily: systemFontFamily,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderColor: BORDER,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 10,
    paddingVertical: 10
  },
  actionButtonText: {
    color: TEXT,
    fontFamily: systemFontFamily,
    fontSize: 12,
    fontWeight: '900'
  },
  stateStack: {
    gap: 14
  },
  skeletonCard: {
    backgroundColor: SURFACE,
    borderColor: BORDER,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    padding: 14
  },
  skeletonTopRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12
  },
  skeletonThumb: {
    backgroundColor: '#EDF1F4',
    borderRadius: 10,
    height: 52,
    width: 52
  },
  skeletonTextBlock: {
    flex: 1,
    gap: 8
  },
  skeletonLineLarge: {
    backgroundColor: '#EDF1F4',
    borderRadius: 999,
    height: 14,
    width: '72%'
  },
  skeletonLineSmall: {
    backgroundColor: '#EDF1F4',
    borderRadius: 999,
    height: 10,
    width: '44%'
  },
  skeletonBadge: {
    backgroundColor: '#EDF1F4',
    borderRadius: 999,
    height: 24,
    width: 84
  },
  skeletonLineMedium: {
    backgroundColor: '#EDF1F4',
    borderRadius: 999,
    height: 12,
    width: '58%'
  },
  skeletonLineShort: {
    backgroundColor: '#EDF1F4',
    borderRadius: 999,
    height: 12,
    width: '36%'
  },
  skeletonActionRow: {
    flexDirection: 'row',
    gap: 8
  },
  skeletonActionButton: {
    backgroundColor: '#EDF1F4',
    borderRadius: 12,
    flex: 1,
    height: 40
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderColor: BORDER,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 20
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: '#EAF8F4',
    borderRadius: 999,
    height: 48,
    justifyContent: 'center',
    width: 48
  },
  emptyTitle: {
    color: TEXT,
    fontFamily: systemFontFamily,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center'
  },
  emptySubtitle: {
    color: TEXT_SECONDARY,
    fontFamily: systemFontFamily,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center'
  },
  emptyCta: {
    alignItems: 'center',
    backgroundColor: BRAND,
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 14
  },
  emptyCtaText: {
    color: WHITE,
    fontFamily: systemFontFamily,
    fontSize: 13,
    fontWeight: '900'
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  modalBackdrop: {
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    ...StyleSheet.absoluteFillObject
  },
  filterSheet: {
    backgroundColor: SURFACE,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    gap: 14,
    padding: 16
  },
  sheetHandle: {
    alignSelf: 'center',
    backgroundColor: '#D6DCE2',
    borderRadius: 999,
    height: 4,
    width: 44
  },
  filterSheetTitle: {
    color: TEXT,
    fontFamily: systemFontFamily,
    fontSize: 18,
    fontWeight: '900'
  },
  filterSheetOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  sortOption: {
    alignItems: 'center',
    backgroundColor: BG,
    borderColor: BORDER,
    borderRadius: 12,
    borderWidth: 1,
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  sortOptionActive: {
    backgroundColor: BRAND,
    borderColor: BRAND
  },
  sortOptionText: {
    color: TEXT,
    fontFamily: systemFontFamily,
    fontSize: 13,
    fontWeight: '800'
  },
  sortOptionTextActive: {
    color: WHITE
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 10
  },
  sheetSecondaryButton: {
    alignItems: 'center',
    backgroundColor: BG,
    borderColor: BORDER,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  sheetSecondaryButtonText: {
    color: TEXT,
    fontFamily: systemFontFamily,
    fontSize: 13,
    fontWeight: '900'
  },
  sheetPrimaryButton: {
    alignItems: 'center',
    backgroundColor: BRAND,
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  sheetPrimaryButtonText: {
    color: WHITE,
    fontFamily: systemFontFamily,
    fontSize: 13,
    fontWeight: '900'
  },
  pressed: {
    opacity: 0.85
  }
});

