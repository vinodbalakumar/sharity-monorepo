import { FeaturePreviewNotice } from '../../components/ui/FeaturePreviewNotice';
import { useSelector } from '@legendapp/state/react';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { memo, useCallback, useEffect, useState, type ComponentProps, type ReactElement, type ReactNode } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import * as DropdownMenu from 'zeego/dropdown-menu';
import { Button, Card, H2, Input, Paragraph, Text, XStack, YStack } from 'tamagui';

import { InteriorShell } from '../../components/appShell';
import { appState$ } from '../../state/appState';
import { appStorage } from '../../storage/storage';
import type { AppRoute } from '../../types/navigation';
import { closeSupportTicket, createSupportTicket, escalateSupportTicket, getSupportScreenData, reopenSupportTicket, replyToSupportTicket, uploadSupportAttachment } from './supportMockApi';
import type { AdminSupportQueueItem, HelpSearchResultItem, SelfServiceSuggestionItem, SupportAttachmentItem, SupportCategoryItem, SupportRelatedEntity, SupportScreenData, SupportTicketMessage, SupportTicketSummary, SupportTicketTimelineEvent } from './supportTypes';

type Props = { onNavigate: (route: AppRoute) => void };
type ListComponent<T> = (props: { data: T[]; estimatedItemSize: number; keyExtractor: (item: T) => string; renderItem: (info: { item: T; index: number }) => ReactElement }) => ReactElement;
const CategoryList = FlashList as unknown as ListComponent<SupportCategoryItem>;
const SearchList = FlashList as unknown as ListComponent<HelpSearchResultItem>;
const SuggestionList = FlashList as unknown as ListComponent<SelfServiceSuggestionItem>;
const TicketList = FlashList as unknown as ListComponent<SupportTicketSummary>;
const MessageList = FlashList as unknown as ListComponent<SupportTicketMessage>;
const AttachmentList = FlashList as unknown as ListComponent<SupportAttachmentItem>;
const TimelineList = FlashList as unknown as ListComponent<SupportTicketTimelineEvent>;
const RelatedList = FlashList as unknown as ListComponent<SupportRelatedEntity>;
const AdminQueueList = FlashList as unknown as ListComponent<AdminSupportQueueItem>;
const tabs = ['Dashboard', 'Create Ticket', 'Ticket Detail', 'Timeline', 'Admin Queue'] as const;
const filters = ['All tickets', 'Open', 'Resolved', 'Closed', 'Order-related', 'Refund-related', 'Payout-related', 'Verification-related', 'Safety reports', 'Unread', 'Action required'];

export function SupportScreen({ onNavigate }: Props) {
  const selectedTab = useSelector(appState$.support.selectedTab) as typeof tabs[number];
  const searchQuery = useSelector(appState$.support.searchQuery);
  const selectedFilter = useSelector(appState$.support.selectedFilter);
  const [data, setData] = useState<SupportScreenData | null>(null);
  const [attachments, setAttachments] = useState<SupportAttachmentItem[]>([]);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setData(await getSupportScreenData());
    const stored = appStorage.getString('supportLastTab') as typeof tabs[number] | null;
    if (stored && tabs.includes(stored)) appState$.support.selectedTab.set(stored);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function runAction(kind: 'create' | 'attach' | 'reply' | 'escalate' | 'close' | 'reopen') {
    if (kind === 'create') appState$.support.createLoading.set(true);
    const result = kind === 'create'
      ? await createSupportTicket()
      : kind === 'attach'
        ? await uploadSupportAttachment()
        : kind === 'reply'
          ? await replyToSupportTicket()
          : kind === 'escalate'
            ? await escalateSupportTicket()
            : kind === 'close'
              ? await closeSupportTicket()
              : await reopenSupportTicket();
    if (kind === 'create') appState$.support.createLoading.set(false);
    if (kind === 'attach' && 'attachmentId' in result) {
      setAttachments((current) => [result, ...current]);
      setMessage('Attachment uploaded and scanned. Raw storage keys are not exposed.');
      return;
    }
    setMessage('message' in result ? result.message : 'Support action completed.');
  }

  if (!data) return <YStack bg="$background" f={1} p="$5"><Centered title="Loading Help & Support..." /></YStack>;

  const selectedFilterKey = selectedFilter.toUpperCase().split('-')[0] ?? selectedFilter.toUpperCase();
  const filteredTickets = data.dashboard.recentTickets.filter((ticket) => selectedFilter === 'All tickets' || (selectedFilter === 'Unread' ? ticket.unreadCount > 0 : selectedFilter === 'Action required' ? ticket.actionRequired : ticket.status.includes(selectedFilterKey)));

  return (
    <InteriorShell onNavigate={onNavigate} title="Help & Support" subtitle="Get help with your account" scrollable={true}>
      <FeaturePreviewNotice />
      <YStack gap="$5" maxWidth={1240} mx="auto" width="100%">
        <PremiumCard p="$4">
            <YStack gap="$3">
              <Input bg="$background" borderColor="$borderColor" placeholder={data.dashboard.searchPlaceholder} value={searchQuery} onChangeText={(value) => appState$.support.searchQuery.set(value)} />
              <Paragraph color="$gray10">For safety, do not share passwords, card details, digital codes, private contact info, raw provider payloads, bank details, or identity/tax/KYC documents in support messages.</Paragraph>
            </YStack>
          </PremiumCard>

          <XStack flexWrap="wrap" gap="$2">{tabs.map((tab) => <Button key={tab} theme={selectedTab === tab ? 'purple' : undefined} onPress={() => { appState$.support.selectedTab.set(tab); appStorage.setString('supportLastTab', tab); }}>{tab}</Button>)}</XStack>

          <XStack $md={{ flexDirection: 'column' }} alignItems="flex-start" gap="$5">
            <YStack flex={1} gap="$4" minWidth={0}>
              {selectedTab === 'Dashboard' ? <Dashboard data={data} tickets={filteredTickets} /> : null}
              {selectedTab === 'Create Ticket' ? <CreateTicket data={data} attachments={attachments} onAction={runAction} /> : null}
              {selectedTab === 'Ticket Detail' ? <TicketDetail data={data} attachments={attachments} onAction={runAction} /> : null}
              {selectedTab === 'Timeline' ? <Panel title="Ticket Timeline"><TimelineList data={data.selectedTicket.timeline} estimatedItemSize={112} keyExtractor={(item) => item.eventId} renderItem={({ item, index }) => <TimelineRow item={item} index={index} />} /></Panel> : null}
              {selectedTab === 'Admin Queue' ? <Panel title="Admin / Support Queue Placeholder"><AdminQueueList data={data.adminQueue} estimatedItemSize={126} keyExtractor={(item) => item.ticketId} renderItem={({ item, index }) => <AdminQueueRow item={item} index={index} />} /></Panel> : null}
            </YStack>
            <YStack gap="$4" width={360} $md={{ width: '100%' }}>
              <Panel title="Ticket Filters"><XStack flexWrap="wrap" gap="$2">{filters.map((filter) => <Button key={filter} size="$3" theme={filter === selectedFilter ? 'purple' : undefined} onPress={() => appState$.support.selectedFilter.set(filter)}>{filter}</Button>)}</XStack></Panel>
              <Panel title="Support Counts"><Badge label={`${data.dashboard.openTicketCount} open`} tone="info" /><Badge label={`${data.dashboard.actionRequiredCount} action required`} tone="warning" /><Badge label={`${data.dashboard.unreadCount} unread`} tone="critical" /></Panel>
              {message ? <PremiumCard p="$4"><Paragraph color="$blue10">{message}</Paragraph></PremiumCard> : null}
            </YStack>
          </XStack>
        </YStack>
    </InteriorShell>
  );
}

function Dashboard({ data, tickets }: { data: SupportScreenData; tickets: SupportTicketSummary[] }) {
  return <YStack gap="$4"><Panel title="Help Search Results"><SearchList data={data.searchResults} estimatedItemSize={108} keyExtractor={(item) => item.resultId} renderItem={({ item, index }) => <SearchRow item={item} index={index} />} /></Panel><Panel title="Guided Troubleshooting"><Row title={data.guidedHelp.title} meta={data.guidedHelp.steps.map((step) => step.question).join(' / ')} badge={data.guidedHelp.createTicketRecommended ? 'Ticket ready' : 'Self-service'} tone="info" /></Panel><Panel title="Support Categories"><CategoryList data={data.dashboard.supportCategories} estimatedItemSize={118} keyExtractor={(item) => item.categoryCode} renderItem={({ item, index }) => <CategoryRow item={item} index={index} />} /></Panel><Panel title="Tickets"><TicketList data={tickets} estimatedItemSize={124} keyExtractor={(item) => item.ticketId} renderItem={({ item, index }) => <TicketRow item={item} index={index} />} /></Panel></YStack>;
}

function CreateTicket({ data, attachments, onAction }: { data: SupportScreenData; attachments: SupportAttachmentItem[]; onAction: (kind: 'create' | 'attach' | 'reply' | 'escalate' | 'close' | 'reopen') => void }) {
  return <YStack gap="$4"><Panel title="Category & Related Entity"><RelatedList data={data.relatedEntities} estimatedItemSize={112} keyExtractor={(item) => item.relatedEntityId} renderItem={({ item, index }) => <RelatedRow item={item} index={index} />} /></Panel><Panel title="Self-Service Suggestions"><SuggestionList data={data.selfServiceSuggestions} estimatedItemSize={112} keyExtractor={(item) => item.suggestionId} renderItem={({ item, index }) => <SuggestionRow item={item} index={index} />} /></Panel><Panel title="Create Support Ticket"><YStack gap="$3"><Input bg="$background" borderColor="$borderColor" value="Digital code says already used" /><Input bg="$background" borderColor="$borderColor" value="I attached a screenshot and did not include the actual code." /><Button onPress={() => onAction('attach')}>Attach Evidence</Button><Button theme="blue" onPress={() => onAction('create')}>Submit Ticket</Button></YStack></Panel><Panel title="Attachments"><AttachmentList data={attachments} estimatedItemSize={96} keyExtractor={(item) => item.attachmentId} renderItem={({ item, index }) => <AttachmentRow item={item} index={index} />} /></Panel></YStack>;
}

function TicketDetail({ data, attachments, onAction }: { data: SupportScreenData; attachments: SupportAttachmentItem[]; onAction: (kind: 'create' | 'attach' | 'reply' | 'escalate' | 'close' | 'reopen') => void }) {
  const ticket = data.selectedTicket;
  return <YStack gap="$4"><Panel title={`${ticket.ticketReference}: ${ticket.subject}`}><Badge label={ticket.status} tone="warning" /><Paragraph color="$gray10">{ticket.description}</Paragraph><Paragraph color="$gray10">Related: {ticket.relatedEntity.relatedEntityReference} / {ticket.relatedEntity.summary}</Paragraph></Panel><Panel title="Ticket Thread"><MessageList data={ticket.messages} estimatedItemSize={128} keyExtractor={(item) => item.messageId} renderItem={({ item, index }) => <MessageRow item={item} index={index} />} /></Panel><Panel title="Reply & Actions"><YStack gap="$3"><Input bg="$background" borderColor="$borderColor" value="Thanks, please review the screenshot." /><Button onPress={() => onAction('reply')}>Reply to Ticket</Button><Button onPress={() => onAction('attach')}>Attach Evidence</Button><Button theme="blue" onPress={() => onAction('escalate')}>Escalate Ticket</Button></YStack></Panel><Panel title="All Attachments"><AttachmentList data={[...attachments, ...ticket.attachments]} estimatedItemSize={96} keyExtractor={(item) => item.attachmentId} renderItem={({ item, index }) => <AttachmentRow item={item} index={index} />} /></Panel></YStack>;
}

const CategoryRow = memo(function CategoryRow({ item, index }: { item: SupportCategoryItem; index: number }) { const style = useEntrance(index); return <Animated.View style={style}><Row title={item.label} meta={`${item.description} Evidence: ${item.evidenceRecommendations.join(', ')}`} badge={item.defaultPriorityHint} tone={item.defaultPriorityHint.includes('CRITICAL') ? 'critical' : item.defaultPriorityHint === 'HIGH' ? 'warning' : 'info'} action={() => appState$.support.selectedCategory.set(item.categoryCode)} /></Animated.View>; });
function SearchRow({ item, index }: { item: HelpSearchResultItem; index: number }) { const style = useEntrance(index); return <Animated.View style={style}><Row title={item.title} meta={item.summary} badge={item.resultType} tone="info" /></Animated.View>; }
function SuggestionRow({ item, index }: { item: SelfServiceSuggestionItem; index: number }) { const style = useEntrance(index); return <Animated.View style={style}><Row title={item.title} meta={item.description} badge={item.actionLabel} tone="success" /></Animated.View>; }
function TicketRow({ item, index }: { item: SupportTicketSummary; index: number }) { const style = useEntrance(index); return <Animated.View style={style}><Row title={`${item.ticketReference}: ${item.subject}`} meta={`${item.categoryCode} / ${item.relatedEntityReference} / unread ${item.unreadCount}`} badge={item.status} tone={item.actionRequired ? 'warning' : item.escalated ? 'critical' : 'info'} action={() => { appState$.support.selectedTicketId.set(item.ticketId); appState$.support.selectedTab.set('Ticket Detail'); }} /></Animated.View>; }
function RelatedRow({ item, index }: { item: SupportRelatedEntity; index: number }) { const style = useEntrance(index); return <Animated.View style={style}><Row title={item.relatedEntityReference} meta={`${item.relatedEntityType} / ${item.summary}`} badge={item.accessAllowed ? 'Access ok' : 'Denied'} tone={item.accessAllowed ? 'success' : 'critical'} /></Animated.View>; }
function MessageRow({ item, index }: { item: SupportTicketMessage; index: number }) { const style = useEntrance(index); return <Animated.View style={style}><Row title={`${item.senderDisplayName} (${item.senderType})`} meta={item.body} badge={item.moderationStatus} tone={item.systemMessage ? 'info' : 'success'} /></Animated.View>; }
function AttachmentRow({ item, index }: { item: SupportAttachmentItem; index: number }) { const style = useEntrance(index); return <Animated.View style={style}><XStack ai="center" borderColor="$borderColor" borderTopWidth={1} gap="$3" py="$3"><Image source={item.previewUrl} style={{ width: 44, height: 44, borderRadius: 10 }} /><YStack flex={1}><Text fontWeight="700">{item.fileName}</Text><Paragraph color="$gray10">{item.uploadStatus} / {item.scanStatus} / {item.visibilityPolicy}</Paragraph></YStack><Badge label="Evidence" tone="success" /></XStack></Animated.View>; }
function TimelineRow({ item, index }: { item: SupportTicketTimelineEvent; index: number }) { const style = useEntrance(index); return <Animated.View style={style}><Row title={item.title} meta={`${item.actorType} / ${item.message}`} badge={item.status} tone={item.status === 'PENDING' ? 'warning' : 'info'} /></Animated.View>; }
function AdminQueueRow({ item, index }: { item: AdminSupportQueueItem; index: number }) { const style = useEntrance(index); return <Animated.View style={style}><Row title={`${item.ticketReference} / ${item.categoryCode}`} meta={`${item.assignedTo} / ${item.relatedEntityType} / ${item.escalationStatus}`} badge={item.status} tone={item.escalationStatus === 'ESCALATED' ? 'critical' : 'info'} /></Animated.View>; }
function Panel({ title, children }: { title: string; children: ReactNode }) { return <PremiumCard p="$5"><YStack gap="$4"><H2>{title}</H2>{children}</YStack></PremiumCard>; }
function Row({ title, meta, badge, tone, action }: { title: string; meta: string; badge: string; tone: 'info' | 'warning' | 'critical' | 'success'; action?: () => void }) { return <XStack $sm={{ flexDirection: 'column' }} ai="center" borderColor="$borderColor" borderTopWidth={1} gap="$3" py="$3"><YStack flex={1}><Text fontWeight="700">{title}</Text><Paragraph color="$gray10">{meta}</Paragraph></YStack><Badge label={badge} tone={tone} />{action ? <Button onPress={action}>Open</Button> : null}</XStack>; }
function Centered({ title }: { title: string }) { return <PremiumCard p="$6"><H2 ta="center">{title}</H2></PremiumCard>; }
function Badge({ label, tone }: { label: string; tone: 'info' | 'warning' | 'critical' | 'success' }) { const bg = tone === 'critical' ? '$red3' : tone === 'warning' ? '$orange3' : tone === 'success' ? '$green3' : '$blue3'; const color = tone === 'critical' ? '$red10' : tone === 'warning' ? '$orange10' : tone === 'success' ? '$green10' : '$blue10'; return <Text bg={bg} br="$6" color={color} fontSize="$2" fontWeight="700" px="$2" py="$1">{label}</Text>; }
function PremiumCard(props: ComponentProps<typeof Card>) { return <Card bg="$backgroundHover" borderColor="$borderColor" borderWidth={1} br="$6" {...props} />; }
function useEntrance(index: number) { const opacity = useSharedValue(0); const translateY = useSharedValue(10); useEffect(() => { opacity.value = withDelay(index * 35, withTiming(1, { duration: 220 })); translateY.value = withDelay(index * 35, withSpring(0, { damping: 18, stiffness: 150 })); }, [index, opacity, translateY]); return useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] })); }
