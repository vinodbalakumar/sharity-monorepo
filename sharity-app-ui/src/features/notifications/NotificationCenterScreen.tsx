import { Ionicons } from '@expo/vector-icons';
import { useSelector } from '@legendapp/state/react';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { memo, useCallback, useEffect, useMemo, useState, type ComponentProps, type ReactElement } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import * as DropdownMenu from 'zeego/dropdown-menu';
import { Button, Card, H1, H2, Paragraph, ScrollView, Text, XStack, YStack } from 'tamagui';

import { appState$ } from '../../state/appState';
import { appStorage } from '../../storage/storage';
import { colors } from '../../theme';
import type { AppRoute } from '../../types/navigation';
import { archiveNotification, getNotificationFeed, markAllNotificationsRead, markNotificationRead } from './notificationMockApi';
import type { NotificationFeedResponse, NotificationFilter, NotificationItem } from './notificationTypes';

type NotificationCenterScreenProps = {
  onNavigate: (route: AppRoute) => void;
};

const blurhash = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';
const NotificationFlashList = FlashList as unknown as (props: {
  data: NotificationItem[];
  estimatedItemSize: number;
  keyExtractor: (item: NotificationItem) => string;
  renderItem: (info: { index: number; item: NotificationItem }) => ReactElement;
}) => ReactElement;

export function NotificationCenterScreen({ onNavigate }: NotificationCenterScreenProps) {
  const selectedFilter = useSelector(appState$.notifications.selectedFilter) as NotificationFilter;
  const [feed, setFeed] = useState<NotificationFeedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState('');

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setFeed(await getNotificationFeed(selectedFilter));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [selectedFilter]);

  useEffect(() => {
    const stored = appStorage.getString('notificationsSelectedFilter') as NotificationFilter | null;
    if (stored) {
      appState$.notifications.selectedFilter.set(stored);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const groupedRows = useMemo(() => {
    if (!feed) return [];
    return feed.groups.flatMap((group) => group.notificationIds.map((id) => feed.notifications.find((item) => item.notificationId === id)).filter(Boolean) as NotificationItem[]);
  }, [feed]);

  async function updateRead(notification: NotificationItem, read: boolean) {
    await markNotificationRead(notification.notificationId, read);
    setMessage(read ? 'Notification marked read.' : 'Notification marked unread.');
    loadFeed();
  }

  async function archive(notification: NotificationItem) {
    try {
      await archiveNotification(notification.notificationId);
      setMessage('Notification archived.');
      loadFeed();
    } catch {
      setMessage('Critical notifications cannot be archived until resolved.');
    }
  }

  return (
    <YStack bg="$background" f={1}>
      <ScrollView contentContainerStyle={{ paddingBottom: 96 }} showsVerticalScrollIndicator={false}>
        <YStack gap="$5" maxWidth={1220} mx="auto" p="$5" width="100%">
          <XStack $sm={{ flexDirection: 'column' }} ai="flex-start" jc="space-between" gap="$4">
            <YStack gap="$2" flex={1}>
              <Text color="$blue10" fontWeight="800">Alerts and action queue</Text>
              <H1>Notification Center</H1>
              <Paragraph color="$gray10">Stay updated on orders, messages, refunds, disputes, payouts, listings, and security alerts.</Paragraph>
            </YStack>
            <XStack flexWrap="wrap" gap="$2">
              <Button icon={<Ionicons name="arrow-back" size={18} />} onPress={() => onNavigate('home')}>Back</Button>
              <Button icon={<Ionicons name="checkmark-done" size={18} />} theme="purple" onPress={async () => { await markAllNotificationsRead(); setMessage('All eligible notifications marked read.'); loadFeed(); }}>Mark All as Read</Button>
              <Button icon={<Ionicons name="settings-outline" size={18} />} onPress={() => onNavigate('profilePrivacy')}>Preferences</Button>
            </XStack>
          </XStack>

          {feed ? <SummaryStrip feed={feed} /> : null}

          <PremiumCard p="$4">
            <XStack flexWrap="wrap" gap="$2">
              {(feed?.availableFilters ?? ['All', 'Buyer', 'Seller', 'Orders', 'Refunds', 'Disputes', 'Messages', 'Payouts', 'Listings', 'Security', 'Unread', 'Action Required']).map((filter) => (
                <Button
                  key={filter}
                  size="$3"
                  theme={selectedFilter === filter ? 'purple' : undefined}
                  onPress={() => {
                    appState$.notifications.selectedFilter.set(filter);
                    appStorage.setString('notificationsSelectedFilter', filter);
                  }}
                >
                  {filter}
                </Button>
              ))}
            </XStack>
          </PremiumCard>

          {loading ? <CenteredState title="Loading notifications..." /> : null}
          {error ? <CenteredState title="Unable to load notifications." actionLabel="Retry" onAction={loadFeed} /> : null}
          {!loading && !error && groupedRows.length === 0 ? (
            <CenteredState
              title={selectedFilter === 'All' ? 'No notifications yet.' : 'No notifications match this filter.'}
              subtitle="Updates about orders, messages, refunds, disputes, payouts, listings, and security alerts will appear here."
              actionLabel={selectedFilter === 'All' ? 'Manage Preferences' : 'View All Notifications'}
              onAction={() => selectedFilter === 'All' ? onNavigate('profilePrivacy') : appState$.notifications.selectedFilter.set('All')}
            />
          ) : null}

          {!loading && !error && feed ? (
            <XStack $md={{ flexDirection: 'column' }} alignItems="flex-start" gap="$5">
              <YStack flex={1} gap="$4" minWidth={0}>
                {feed.groups.map((group) => {
                  const items = group.notificationIds.map((id) => feed.notifications.find((item) => item.notificationId === id)).filter(Boolean) as NotificationItem[];
                  if (items.length === 0) return null;
                  return (
                    <YStack key={group.groupKey} gap="$3">
                      <Text color="$gray10" fontWeight="900">{group.groupLabel}</Text>
                      <NotificationFlashList
                        data={items}
                        estimatedItemSize={190}
                        keyExtractor={(item) => item.notificationId}
                        renderItem={({ item, index }) => (
                          <NotificationRow
                            index={index}
                            notification={item}
                            onArchive={() => archive(item)}
                            onOpen={() => {
                              appState$.notifications.lastDeepLink.set(item.deepLink.route);
                              appState$.notifications.selectedNotificationId.set(item.notificationId);
                              updateRead(item, true);
                              setMessage(`Deep link resolved: ${item.deepLink.route}`);
                            }}
                            onToggleRead={() => updateRead(item, !item.read)}
                          />
                        )}
                      />
                    </YStack>
                  );
                })}
              </YStack>
              <DetailsPanel feed={feed} message={message} onNavigate={onNavigate} />
            </XStack>
          ) : null}
        </YStack>
      </ScrollView>
    </YStack>
  );
}

function SummaryStrip({ feed }: { feed: NotificationFeedResponse }) {
  const counts = feed.summaryCounts;
  return (
    <XStack $sm={{ flexDirection: 'column' }} gap="$3">
      <SummaryCard label="Unread" value={counts.unreadCount} tone="info" />
      <SummaryCard label="Action Required" value={counts.actionRequiredCount} tone="warning" />
      <SummaryCard label="Critical" value={counts.criticalCount} tone="critical" />
      <SummaryCard label="Buyer" value={counts.buyerCount} tone="success" />
      <SummaryCard label="Seller" value={counts.sellerCount} tone="info" />
    </XStack>
  );
}

const NotificationRow = memo(function NotificationRow({ index, notification, onArchive, onOpen, onToggleRead }: { index: number; notification: NotificationItem; onArchive: () => void; onOpen: () => void; onToggleRead: () => void }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    opacity.value = withDelay(index * 45, withTiming(1, { duration: 220 }));
    translateY.value = withDelay(index * 45, withSpring(0, { damping: 18, stiffness: 150 }));
  }, [index, opacity, translateY]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] }));

  return (
    <Animated.View style={style}>
      <PremiumCard mb="$3" p="$4" borderColor={notification.critical ? '$red8' : notification.actionRequired ? '$orange8' : '$borderColor'}>
        <XStack $sm={{ flexDirection: 'column' }} ai="center" gap="$4">
          <YStack ai="center" bg={notification.read ? '$gray3' : '$blue3'} br="$6" h={54} jc="center" w={54}>
            {notification.productImageUrl ? <Image source={notification.productImageUrl} placeholder={blurhash} style={{ width: 54, height: 54, borderRadius: 12 }} /> : <Ionicons color={notification.critical ? colors.error : notification.actionRequired ? colors.warning : colors.info} name={notification.critical ? 'shield' : 'notifications'} size={24} />}
          </YStack>
          <YStack flex={1} gap="$2" minWidth={0}>
            <XStack ai="center" flexWrap="wrap" gap="$2">
              {!notification.read ? <Badge label="Unread" tone="info" /> : null}
              {notification.actionRequired ? <Badge label="Action Required" tone="warning" /> : null}
              {notification.critical ? <Badge label="Critical" tone="critical" /> : null}
              <Badge label={notification.role} tone={notification.role === 'SELLER' ? 'info' : 'success'} />
            </XStack>
            <Text fontSize="$6" fontWeight="900">{notification.title}</Text>
            <Paragraph color="$gray10">{notification.message}</Paragraph>
            <Text color="$gray10" fontSize="$3">{notification.role} • {notification.category} • {notification.priority} • {notification.relatedReference}</Text>
          </YStack>
          <YStack gap="$2" minWidth={168}>
            <Button icon={<Ionicons name="open-outline" size={18} />} theme="purple" onPress={onOpen}>Open</Button>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <Button icon={<Ionicons name="ellipsis-horizontal" size={18} />}>Actions</Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                <DropdownMenu.Item key="read" onSelect={onToggleRead}>{notification.read ? 'Mark as Unread' : 'Mark as Read'}</DropdownMenu.Item>
                <DropdownMenu.Item key="archive" disabled={!notification.availableActions.canArchive} onSelect={onArchive}>Archive Notification</DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </YStack>
        </XStack>
      </PremiumCard>
    </Animated.View>
  );
});

function DetailsPanel({ feed, message, onNavigate }: { feed: NotificationFeedResponse; message: string; onNavigate: (route: AppRoute) => void }) {
  const selectedId = useSelector(appState$.notifications.selectedNotificationId);
  const selected = feed.notifications.find((item) => item.notificationId === selectedId) ?? feed.notifications[0];
  return (
    <PremiumCard p="$5" width={360} $md={{ width: '100%' }}>
      <YStack gap="$4">
        <Text fontSize="$6" fontWeight="900">Details</Text>
        {selected ? (
          <>
            <H2>{selected.title}</H2>
            <Paragraph color="$gray10">{selected.message}</Paragraph>
            <Badge label={selected.deepLink.route} tone="info" />
          </>
        ) : <Paragraph color="$gray10">Select a notification to preview its deep link and actions.</Paragraph>}
        {message ? <Paragraph color="$purple10">{message}</Paragraph> : null}
        <Button onPress={() => onNavigate('profilePrivacy')}>Manage Notification Preferences</Button>
      </YStack>
    </PremiumCard>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: 'info' | 'warning' | 'critical' | 'success' }) {
  return <PremiumCard flex={1} minWidth={150} p="$4"><Text color={toneColor(tone)} fontSize="$8" fontWeight="900">{value}</Text><Text color="$gray10">{label}</Text></PremiumCard>;
}

function CenteredState({ title, subtitle, actionLabel, onAction }: { title: string; subtitle?: string; actionLabel?: string; onAction?: () => void }) {
  return <PremiumCard p="$6"><YStack ai="center" gap="$3"><H2 ta="center">{title}</H2>{subtitle ? <Paragraph color="$gray10" ta="center">{subtitle}</Paragraph> : null}{actionLabel ? <Button theme="purple" onPress={onAction}>{actionLabel}</Button> : null}</YStack></PremiumCard>;
}

function Badge({ label, tone }: { label: string; tone: 'info' | 'warning' | 'critical' | 'success' }) {
  return <Text bg={toneBg(tone)} br="$6" color={toneColor(tone)} fontSize="$2" fontWeight="900" px="$2" py="$1">{label}</Text>;
}

function PremiumCard(props: ComponentProps<typeof Card>) {
  return <Card bg="$backgroundHover" borderColor="$borderColor" borderWidth={1} br="$6" {...props} />;
}

function toneBg(tone: 'info' | 'warning' | 'critical' | 'success') {
  return tone === 'critical' ? '$red3' : tone === 'warning' ? '$orange3' : tone === 'success' ? '$green3' : '$blue3';
}

function toneColor(tone: 'info' | 'warning' | 'critical' | 'success') {
  return tone === 'critical' ? '$red10' : tone === 'warning' ? '$orange10' : tone === 'success' ? '$green10' : '$blue10';
}
