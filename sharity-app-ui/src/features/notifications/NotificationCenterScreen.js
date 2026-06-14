import { Ionicons } from '@expo/vector-icons';
import { useSelector } from '@legendapp/state/react';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { memo, useCallback, useEffect, useState } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import * as DropdownMenu from 'zeego/dropdown-menu';
import { Button, Card, H2, Input, Paragraph, Text, XStack, YStack } from 'tamagui';
import { InteriorShell } from '../../components/appShell';
import { appState$ } from '../../state/appState';
import { appStorage } from '../../storage/storage';
import { colors } from '../../theme';
import { archiveNotification, getNotificationCenterData, markAllNotificationsRead, markNotificationRead, openNotificationAction } from './notificationMockApi';
const NotificationList = FlashList;
const CriticalList = FlashList;
const AdminList = FlashList;
const filters = ['All', 'Buyer', 'Seller', 'Orders', 'Seller orders', 'Payments', 'Seller acceptance', 'Digital delivery', 'Refunds', 'Disputes', 'Payouts', 'Verification', 'Support', 'Security', 'Marketplace', 'Coupons/rewards', 'Policies', 'Listing moderation', 'Admin announcements', 'Unread', 'Critical', 'Action required', 'Archived'];
export function NotificationCenterScreen({ onNavigate }) {
    const selectedFilter = useSelector(appState$.notifications.selectedFilter);
    const searchQuery = useSelector(appState$.notifications.searchQuery);
    const selectedNotificationId = useSelector(appState$.notifications.selectedNotificationId);
    const [data, setData] = useState(null);
    const [message, setMessage] = useState('');
    const load = useCallback(async () => {
        setData(await getNotificationCenterData(selectedFilter, searchQuery));
    }, [searchQuery, selectedFilter]);
    useEffect(() => {
        const stored = appStorage.getString('notificationsSelectedFilter');
        if (stored && filters.includes(stored))
            appState$.notifications.selectedFilter.set(stored);
    }, []);
    useEffect(() => { load(); }, [load]);
    async function run(action, item) {
        const result = action === 'allRead'
            ? await markAllNotificationsRead()
            : action === 'archive' && item
                ? await archiveNotification(item.notificationId)
                : action === 'open' && item
                    ? await openNotificationAction(item.notificationId, item.primaryAction.actionCode)
                    : item
                        ? await markNotificationRead(item.notificationId, action === 'read')
                        : null;
        if (item)
            appState$.notifications.selectedNotificationId.set(item.notificationId);
        if (result)
            setMessage(result.message);
        await load();
    }
    if (!data)
        return <YStack bg="$background" f={1} p="$5"><Centered title="Loading notifications..."/></YStack>;
    const selected = data.notifications.find((item) => item.notificationId === selectedNotificationId) ?? data.dashboard.criticalNotifications[0] ?? data.notifications[0];
    return (<InteriorShell onNavigate={onNavigate} title="Notification Center" subtitle="View all your notifications" scrollable={true}>
      <YStack gap="$5" maxWidth={1280} mx="auto" width="100%">
        <XStack $sm={{ flexDirection: 'column' }} gap="$3">
            <Metric label="Total unread" value={data.dashboard.unreadCounts.totalUnread} tone="info"/>
            <Metric label="Buyer unread" value={data.dashboard.unreadCounts.buyerUnread} tone="success"/>
            <Metric label="Seller unread" value={data.dashboard.unreadCounts.sellerUnread} tone="info"/>
            <Metric label="Critical unread" value={data.dashboard.unreadCounts.criticalUnread} tone="critical"/>
            <Metric label="Action required" value={data.dashboard.unreadCounts.actionRequiredUnread} tone="warning"/>
          </XStack>

          <PremiumCard p="$4">
            <YStack gap="$3">
              <Input bg="$background" borderColor="$borderColor" placeholder="Search notifications, categories, references, or status" value={searchQuery} onChangeText={(value) => appState$.notifications.searchQuery.set(value)}/>
              <XStack flexWrap="wrap" gap="$2">{filters.map((filter) => <Button key={filter} size="$3" theme={selectedFilter === filter ? 'purple' : undefined} onPress={() => { appState$.notifications.selectedFilter.set(filter); appStorage.setString('notificationsSelectedFilter', filter); }}>{filter}</Button>)}</XStack>
            </YStack>
          </PremiumCard>

          {data.dashboard.criticalNotifications.length ? <Panel title="Pinned Critical / Action Required"><CriticalList data={data.dashboard.criticalNotifications} estimatedItemSize={132} keyExtractor={(item) => item.notificationId} renderItem={({ item, index }) => <NotificationRow item={item} index={index} pinned onNavigate={onNavigate} run={run}/>}/></Panel> : null}
          {!data.notifications.length ? <Centered title={selectedFilter === 'Unread' ? 'No unread notifications. You are all caught up.' : 'No notifications match this filter.'}/> : null}

          <XStack $md={{ flexDirection: 'column' }} alignItems="flex-start" gap="$5">
            <YStack flex={1} gap="$4" minWidth={0}>
              {data.timeGroups.map((group) => <TimeGroup key={group.groupCode} group={group} onNavigate={onNavigate} run={run}/>)}
              <Panel title="Admin Broadcast Placeholder"><AdminList data={data.adminBroadcasts} estimatedItemSize={116} keyExtractor={(item) => item.broadcastId} renderItem={({ item, index }) => <AdminRow item={item} index={index}/>}/></Panel>
            </YStack>
            <YStack gap="$4" width={390} $md={{ width: '100%' }}>
              <Details item={selected} message={message} onNavigate={onNavigate} run={run}/>
              <Panel title="Preference Shortcut"><Paragraph color="$gray10">{data.dashboard.preferencesShortcut.userSafeMessage}</Paragraph><Button onPress={() => onNavigate('appSettings')}>Manage Notification Preferences</Button></Panel>
            </YStack>
          </XStack>
        </YStack>
    </InteriorShell>);
}
function TimeGroup({ group, onNavigate, run }) {
    if (!group.notifications.length)
        return null;
    return <Panel title={`${group.label} (${group.count}, ${group.unreadCount} unread)`}><NotificationList data={group.notifications} estimatedItemSize={156} keyExtractor={(item) => item.notificationId} renderItem={({ item, index }) => <NotificationRow item={item} index={index} onNavigate={onNavigate} run={run}/>}/></Panel>;
}
const NotificationRow = memo(function NotificationRow({ item, index, pinned, onNavigate, run }) {
    const style = useEntrance(index);
    return <Animated.View style={style}><PremiumCard mb="$3" p="$4" borderColor={item.critical ? '$red8' : item.actionRequired ? '$orange8' : '$borderColor'}><XStack $sm={{ flexDirection: 'column' }} ai="center" gap="$4">{item.imageUrl ? <Image source={item.imageUrl} style={{ width: 54, height: 54, borderRadius: 12 }}/> : <IconCircle severity={item.severity}/>}<YStack flex={1} gap="$2" minWidth={0}><XStack flexWrap="wrap" gap="$2">{item.status === 'UNREAD' ? <Badge label="Unread" tone="info"/> : null}{item.actionRequired ? <Badge label="Action required" tone="warning"/> : null}{item.critical ? <Badge label="Critical" tone="critical"/> : null}{pinned || item.pinned ? <Badge label="Pinned" tone="success"/> : null}<Badge label={item.roleContext} tone={item.roleContext === 'SELLER' ? 'info' : 'success'}/></XStack><Text fontSize="$6" fontWeight="900">{item.title}</Text><Paragraph color="$gray10">{item.shortMessage}</Paragraph><Text color="$gray10" fontSize="$3">{item.category} / {item.relatedEntity.relatedEntityReference} / {new Date(item.createdAt).toLocaleString()}</Text></YStack><YStack gap="$2" minWidth={180}><Button theme="purple" onPress={() => { run('open', item); const route = item.primaryAction.route; if (['orders', 'paymentAuthorization', 'library', 'refundStatus', 'disputeStatus', 'sellerVerification', 'support', 'loginSecurity', 'appSettings', 'rewards', 'policies', 'profilePrivacy', 'marketplaces', 'notifications'].includes(route))
        onNavigate(route); }}>{item.primaryAction.label}</Button><DropdownMenu.Root><DropdownMenu.Trigger><Button>Actions</Button></DropdownMenu.Trigger><DropdownMenu.Content><DropdownMenu.Item key="read" onSelect={() => run(item.status === 'UNREAD' ? 'read' : 'unread', item)}>{item.status === 'UNREAD' ? 'Mark Read' : 'Mark Unread'}</DropdownMenu.Item><DropdownMenu.Item key="archive" disabled={!item.secondaryActions.find((action) => action.actionCode === 'ARCHIVE')?.enabled} onSelect={() => run('archive', item)}>Archive Notification</DropdownMenu.Item><DropdownMenu.Item key="prefs" onSelect={() => onNavigate('appSettings')}>Manage Preferences</DropdownMenu.Item></DropdownMenu.Content></DropdownMenu.Root></YStack></XStack></PremiumCard></Animated.View>;
});
function Details({ item, message, onNavigate, run }) {
    if (!item)
        return <Panel title="Notification Detail"><Paragraph color="$gray10">Notification not found.</Paragraph></Panel>;
    return <Panel title="Notification Detail"><YStack gap="$3"><H2>{item.title}</H2><Paragraph color="$gray10">{item.fullMessage}</Paragraph><Row title={item.relatedEntity.relatedEntityReference} meta={`${item.relatedEntity.relatedEntityType} / ${item.relatedEntity.status} / ${item.relatedEntity.summary}`} badge={item.relatedEntity.accessAllowed ? 'Access allowed' : 'Unavailable'} tone={item.relatedEntity.accessAllowed ? 'success' : 'critical'}/><Row title="Delivery channels" meta={item.deliveryChannels.map((channel) => `${channel.channel}: ${channel.userSafeMessage}`).join(' / ')} badge="In-app / push / email" tone="info"/><XStack flexWrap="wrap" gap="$2"><Button theme="purple" onPress={() => run('open', item)}>Take Required Action</Button><Button onPress={() => run(item.status === 'UNREAD' ? 'read' : 'unread', item)}>{item.status === 'UNREAD' ? 'Mark Read' : 'Mark Unread'}</Button><Button onPress={() => onNavigate('appSettings')}>Preferences</Button></XStack>{message ? <Paragraph color="$purple10">{message}</Paragraph> : null}</YStack></Panel>;
}
function AdminRow({ item, index }) { const style = useEntrance(index); return <Animated.View style={style}><Row title={item.title} meta={`${item.audienceType} / ${item.deliveryChannels.join(', ')} / ${item.createdBy}`} badge={item.status} tone="info"/></Animated.View>; }
function Panel({ title, children }) { return <PremiumCard p="$5"><YStack gap="$4"><H2>{title}</H2>{children}</YStack></PremiumCard>; }
function Row({ title, meta, badge, tone }) { return <XStack $sm={{ flexDirection: 'column' }} ai="center" borderColor="$borderColor" borderTopWidth={1} gap="$3" py="$3"><YStack flex={1} minWidth={0}><Text fontWeight="900">{title}</Text><Paragraph color="$gray10">{meta}</Paragraph></YStack><Badge label={badge} tone={tone}/></XStack>; }
function Metric({ label, value, tone }) { return <PremiumCard flex={1} minWidth={150} p="$4"><Text color={toneColor(tone)} fontSize="$8" fontWeight="900">{value}</Text><Text color="$gray10">{label}</Text></PremiumCard>; }
function IconCircle({ severity }) { const tone = severity === 'CRITICAL' ? 'critical' : severity === 'WARNING' ? 'warning' : severity === 'SUCCESS' ? 'success' : 'info'; return <YStack ai="center" bg={toneBg(tone)} br="$6" h={54} jc="center" w={54}><Ionicons color={tone === 'critical' ? colors.error : tone === 'warning' ? colors.warning : tone === 'success' ? colors.success : colors.info} name={tone === 'critical' ? 'shield' : tone === 'warning' ? 'alert-circle' : 'notifications'} size={24}/></YStack>; }
function Centered({ title }) { return <PremiumCard p="$6"><H2 ta="center">{title}</H2></PremiumCard>; }
function Badge({ label, tone }) { return <Text bg={toneBg(tone)} br="$6" color={toneColor(tone)} fontSize="$2" fontWeight="900" px="$2" py="$1">{label}</Text>; }
function PremiumCard(props) { return <Card bg="$backgroundHover" borderColor="$borderColor" borderWidth={1} br="$6" {...props}/>; }
function toneBg(tone) { return tone === 'critical' ? '$red3' : tone === 'warning' ? '$orange3' : tone === 'success' ? '$green3' : '$blue3'; }
function toneColor(tone) { return tone === 'critical' ? '$red10' : tone === 'warning' ? '$orange10' : tone === 'success' ? '$green10' : '$blue10'; }
function useEntrance(index) { const opacity = useSharedValue(0); const translateY = useSharedValue(10); useEffect(() => { opacity.value = withDelay(index * 28, withTiming(1, { duration: 210 })); translateY.value = withDelay(index * 28, withSpring(0, { damping: 18, stiffness: 150 })); }, [index, opacity, translateY]); return useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] })); }
