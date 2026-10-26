import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { appStorage } from '../../storage/storage';
import { getBrowserSessionSummary } from '../../services/sessionService';
import { SignOutButton } from '../../components/appShell/SignOutButton';
import { chatRequest, ChatError, type AiAnswer, type AiConversation, type AiMessage, type AiSummary } from '../../services/sharityAiApi';
import { systemFontFamily } from '../../theme/typography';
import type { AppRoute } from '../../types/navigation';
import { AiCopy, AiMarkdown } from './AiMarkdown';
import { FounderContentPanel } from './FounderContentPanel';
import { ConversationInfo, MessageInfo, type ClientTiming } from './ChatInfo';

const suggestions = ['What is Sharity?', 'Who founded Sharity?', 'Tell me about Vinod Balakumar.', 'What does Sharity offer?', 'How does the Sharity marketplace work?', 'What technologies power Sharity?', 'What has the founder shared recently?', 'Help me write a Java program.'];
function responseTimeLabel(milliseconds: number | undefined) {
  if (milliseconds === undefined) return '';
  return `Response time: ${milliseconds < 100 ? '<0.1' : (milliseconds / 1000).toFixed(1)} s`;
}
export function SharityAiScreen({ onNavigate }: { onNavigate: (route: AppRoute) => void }) {
  const { width } = useWindowDimensions(); const mobile = width < 850;
  const [dark, setDark] = useState(appStorage.getString('ai-theme') === 'dark');
  const [sidebar, setSidebar] = useState(false); const [search, setSearch] = useState('');
  const [savedOnly, setSavedOnly] = useState(false); const [settings, setSettings] = useState(false);
  const [admin, setAdmin] = useState(false); const [adminOpen, setAdminOpen] = useState(false);
  const [identity, setIdentity] = useState('Guest session');
  const [history, setHistory] = useState<AiSummary[]>([]); const [messages, setMessages] = useState<AiMessage[]>([]);
  const [id, setId] = useState<string | null>(null); const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [lastQuestion, setLastQuestion] = useState('');
  const [responseTimes, setResponseTimes] = useState<Record<string, ClientTiming>>({});
  const [infoId, setInfoId] = useState<string | null>(null);
  const [showChatInfo, setShowChatInfo] = useState(false);
  const request = useRef<AbortController | null>(null); const scroll = useRef<ScrollView>(null);
  const palette = dark ? { bg: '#101c18', side: '#15231d', text: '#e8eee9', muted: '#a6b9ad', border: '#30443a', surface: '#1d3027' }
    : { bg: '#f3f5f8', side: '#edf2fc', text: '#172337', muted: '#58677d', border: '#dfe5ef', surface: '#ffffff' };
  const refresh = async () => setHistory(await chatRequest<AiSummary[]>('/conversations'));
  const fail = (e: unknown) => {
    setError(e instanceof ChatError ? e.message : 'Unable to reach Sharity AI. Check your connection and try again.');
    if (e instanceof ChatError && [401, 403, 404].includes(e.status)) { setMessages([]); setHistory([]); setId(null); }
  };
  useEffect(() => {
    let active = true;
    void chatRequest<AiSummary[]>('/conversations').then(items => { if (active) setHistory(items); }).catch(e => { if (active) fail(e); });
    void getBrowserSessionSummary().then(session => { if (!active) return;
      if (session?.authenticated) setIdentity('Signed in · private history');
      setAdmin(Boolean(session?.authenticated && session.roles?.some(role => ['ADMIN', 'SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN'].includes(role))));
    });
    return () => { active = false; request.current?.abort(); };
  }, []);
  const newChat = () => { request.current?.abort(); request.current = null; setBusy(false); setId(null); setMessages([]); setError(''); setInput(''); setLastQuestion(''); setSidebar(false); setInfoId(null); setShowChatInfo(false); };
  const send = async (question = input) => {
    const q = question.trim(); if (!q || busy || q.length > 1500) return;
    const controller = new AbortController(); request.current = controller;
    setBusy(true); setError(''); setInput(''); setLastQuestion(q);
    const previous = messages;
    setMessages([...previous, { id: `pending-${Date.now()}`, role: 'user', content: q, sources: [], createdAt: Date.now() }]);
    const startedAt = performance.now();
    const sentAt = Date.now();
    setInfoId(null);
    try {
      const result = await chatRequest<AiAnswer>('/chat', { method: 'POST', body: JSON.stringify({ conversationId: id, message: q }), signal: controller.signal });
      const elapsedMs = performance.now() - startedAt;
      const receivedAt = Date.now();
      if (request.current !== controller || controller.signal.aborted) return;
      setId(result.conversationId);
      const conversation = await chatRequest<AiConversation>(`/conversations/${result.conversationId}`, { signal: controller.signal });
      if (request.current !== controller || controller.signal.aborted) return;
      const answer = [...conversation.messages].reverse().find(message => message.role === 'assistant' && message.content === result.response);
      if (answer) setResponseTimes(previousTimes => ({ ...previousTimes, [result.messageId ?? answer.id]: { sentAt, receivedAt, elapsedMs } }));
      setMessages(conversation.messages); await refresh();
    } catch (e) { if (request.current === controller && !controller.signal.aborted) { setMessages(previous); setInput(q); fail(e); } }
    finally { if (request.current === controller) { request.current = null; setBusy(false); } }
  };
  const open = async (conversationId: string) => {
    if (busy) return; setError(''); setInfoId(null); setShowChatInfo(false);
    try { const result = await chatRequest<AiConversation>(`/conversations/${conversationId}`); setId(conversationId); setMessages(result.messages); setSidebar(false); setLastQuestion([...result.messages].reverse().find(m => m.role === 'user')?.content ?? ''); } catch (e) { fail(e); }
  };
  const action = async (remove: boolean) => { if (!id || busy) return;
    try { await chatRequest(`/conversations/${id}`, { method: remove ? 'DELETE' : 'PATCH', ...(remove ? {} : { body: JSON.stringify({ saved: !history.find(c => c.id === id)?.saved }) }) }); if (remove) newChat(); await refresh(); } catch (e) { fail(e); }
  };
  const button = (label: string, onPress: () => void, icon?: React.ComponentProps<typeof Ionicons>['name']) => <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[styles.button, { borderColor: palette.border }]}>{icon ? <Ionicons name={icon} size={18} color={palette.muted} /> : null}<Text style={[styles.small, { color: palette.text }]}>{label}</Text></Pressable>;
  return <SafeAreaView testID="sharity-ai" style={[styles.root, { backgroundColor: palette.bg }]}>
    <KeyboardAvoidingView style={styles.layout} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {(!mobile || sidebar) && <View testID="chat-sidebar" style={[styles.sidebar, { backgroundColor: palette.side, borderColor: palette.border }, mobile && styles.mobileSidebar]}>
        <View style={styles.brand}><View style={styles.mark}><Text style={styles.markText}>S</Text></View><Text style={[styles.brandName, { color: palette.text }]}>Sharity AI</Text>{mobile && button('Close menu', () => setSidebar(false), 'close-outline')}</View>
        {button('New chat', newChat, 'add-outline')}
        <TextInput accessibilityLabel="Search conversations" placeholder="Search conversations" placeholderTextColor={palette.muted} value={search} onChangeText={setSearch} style={[styles.search, { color: palette.text, borderColor: palette.border }]} />
        {button(savedOnly ? 'Show recent chats' : 'Saved conversations', () => setSavedOnly(!savedOnly), 'bookmark-outline')}
        <Text style={[styles.eyebrow, { color: palette.muted }]}>{savedOnly ? 'SAVED CONVERSATIONS' : 'RECENT CHATS'}</Text>
        <ScrollView style={{ flex: 1 }}><View style={{ gap: 5 }}>{history.filter(c => (!savedOnly || c.saved) && c.title.toLowerCase().includes(search.toLowerCase())).map(c => <Pressable key={c.id} accessibilityRole="button" onPress={() => void open(c.id)} style={[styles.historyItem, c.id === id && { backgroundColor: palette.border }]}><Text numberOfLines={2} style={[styles.small, { color: palette.text }]}>{c.saved ? '★ ' : ''}{c.title}</Text></Pressable>)}{history.length === 0 && <Text style={[styles.small, { color: palette.muted, padding: 12 }]}>Your conversations will appear here.</Text>}</View></ScrollView>
        {button('Settings', () => setSettings(!settings), 'settings-outline')}
        {settings && <View style={{ gap: 8 }}>{button(dark ? 'Use light theme' : 'Use dark theme', () => { appStorage.setString('ai-theme', dark ? 'light' : 'dark'); setDark(!dark); }, dark ? 'sunny-outline' : 'moon-outline')}<Text style={[styles.caption, { color: palette.muted }]}>Guest chats expire after 24 hours. Signed-in history stays private to your account. Delete conversations at any time.</Text></View>}
        {admin && button('Founder content', () => { setAdminOpen(!adminOpen); setSidebar(false); }, 'shield-checkmark-outline')}
        <View style={[styles.profile, { borderColor: palette.border }]}><Ionicons name="person-circle-outline" size={30} color={palette.muted} /><Text style={[styles.small, { color: palette.text, flex: 1 }]}>{identity}</Text></View>
        {button('Back to marketplace', () => onNavigate('marketplaces'), 'arrow-back-outline')}
      </View>}
      <View style={styles.main}>
        <View style={[styles.header, { borderColor: palette.border, paddingHorizontal: mobile ? 12 : 20 }]}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>{mobile && <Pressable accessibilityRole="button" accessibilityLabel="Open menu" onPress={() => setSidebar(!sidebar)} style={styles.iconButton}><Ionicons name="menu-outline" size={21} color={palette.text}/></Pressable>}<Text style={[styles.headerTitle, { color: palette.text }]}>Sharity AI</Text>{!mobile && <Text style={[styles.caption, { color: palette.muted }]}>Your curious companion</Text>}</View><Pressable accessibilityRole="button" accessibilityLabel="Toggle theme" onPress={() => { appStorage.setString('ai-theme', dark ? 'light' : 'dark'); setDark(!dark); }} style={styles.iconButton}><Ionicons name={dark ? 'sunny-outline' : 'moon-outline'} size={21} color={palette.text} /></Pressable><SignOutButton /></View>
        {adminOpen && admin ? <ScrollView contentContainerStyle={{ padding: 20 }}><FounderContentPanel onClose={() => setAdminOpen(false)} /></ScrollView> : <>
          <ScrollView ref={scroll} testID="chat-messages" style={{ flex: 1 }} contentContainerStyle={[styles.messages, mobile && { padding: 18 }]} onContentSizeChange={() => { if (messages.length > 0 && !infoId) scroll.current?.scrollToEnd({ animated: true }); }}>
            <View style={styles.column}>
              {messages.length === 0 ? <View style={[styles.welcome, mobile && { paddingTop: 28 }]}><View style={[styles.welcomeMark, { backgroundColor: palette.side }]}><Ionicons name="sparkles-outline" color="#247955" size={33} /></View><Text accessibilityRole="header" style={[styles.heading, mobile && { fontSize: 29 }, { color: palette.text }]}>Welcome to Sharity AI</Text><Text style={[styles.subtitle, { color: palette.muted }]}>Discover Sharity, learn about its founder, and explore what our intelligent assistant can do.</Text><View style={styles.cards}>{suggestions.map((q, i) => <Pressable accessibilityRole="button" accessibilityLabel={q} key={q} onPress={() => void send(q)} style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border, width: mobile ? '100%' : '48.5%' }]}><Text style={[styles.cardNumber, { color: palette.muted }]}>0{i + 1}</Text><Text style={[styles.small, { color: palette.text, flex: 1 }]}>{q}</Text><Ionicons name="arrow-up-outline" size={16} color={palette.muted} /></Pressable>)}</View><Text style={[styles.caption, { color: palette.muted, textAlign: 'center' }]}>Approved public knowledge. Local AI. No automated account actions.</Text></View> : messages.map(m => <View key={m.id} testID={`message-${m.role}`} style={[styles.message, m.role === 'user' && { backgroundColor: palette.side, padding: 18, borderRadius: 18 }]}><Text style={[styles.eyebrow, { color: palette.muted }]}>{m.role === 'user' ? 'YOU' : 'SHARITY AI'}</Text><AiMarkdown text={m.content} dark={dark} />{m.role === 'assistant' && responseTimes[m.id] !== undefined && <Text testID="response-time" style={[styles.caption, { color: palette.muted, marginTop: 8 }]}>{responseTimeLabel(responseTimes[m.id]?.elapsedMs)}</Text>}{m.role === 'assistant' && <View style={styles.messageActions}><AiCopy text={m.content} />{button(infoId === m.id ? 'Hide message info' : 'Message info', () => setInfoId(infoId === m.id ? null : m.id), 'information-circle-outline')}{m === messages[messages.length - 1] && !busy && button('Regenerate', () => void send(lastQuestion), 'refresh-outline')}</View>}{m.role === 'assistant' && infoId === m.id && <MessageInfo metrics={m.metrics} timing={responseTimes[m.id]} colors={palette} />}</View>)}
              {showChatInfo && <ConversationInfo messages={messages} colors={palette} />}{busy && <View accessibilityLiveRegion="polite" style={styles.thinking}><ActivityIndicator color="#247955" /><Text style={[styles.small, { color: palette.muted }]}>Sharity AI is preparing an answer…</Text></View>}
            </View>
          </ScrollView>
          <View style={[styles.composerArea, mobile && { padding: 12 }]}><View style={styles.column}>
            {error !== '' && <View accessibilityRole="alert" style={styles.error}><Text style={{ color: dark ? '#ffd0bc' : '#8a3425', fontFamily: systemFontFamily }}>{error}</Text></View>}
            {id && !busy && <View style={styles.messageActions}>{button(showChatInfo ? 'Hide chat info' : 'Chat info', () => { setShowChatInfo(!showChatInfo); setInfoId(null); }, 'information-circle-outline')}{button(history.find(c => c.id === id)?.saved ? 'Unsave chat' : 'Save chat', () => void action(false), 'bookmark-outline')}{button('Delete chat', () => void action(true), 'trash-outline')}</View>}
            <View style={[styles.composer, { backgroundColor: palette.surface, borderColor: palette.border }]}><TextInput accessibilityLabel="Message Sharity AI" placeholder="Ask Sharity AI anything…" placeholderTextColor={palette.muted} multiline maxLength={1500} value={input} onChangeText={setInput} editable={!busy} style={[styles.input, { color: palette.text }]} onKeyPress={event => { if (Platform.OS === 'web' && event.nativeEvent.key === 'Enter' && !(event.nativeEvent as unknown as { shiftKey?: boolean }).shiftKey) { event.preventDefault(); void send(); } }} />{busy ? <Pressable accessibilityRole="button" accessibilityLabel="Stop waiting" onPress={() => { request.current?.abort(); request.current = null; setBusy(false); setError('Stopped waiting. The server may finish this answer; refresh history to check.'); void refresh().catch(fail); }} style={styles.send}><Ionicons name="stop" size={18} color="white" /></Pressable> : <Pressable accessibilityRole="button" accessibilityLabel="Send message" disabled={!input.trim()} onPress={() => void send()} style={[styles.send, !input.trim() && { opacity: 0.45 }]}><Ionicons name="arrow-up" size={22} color="white" /></Pressable>}</View>
            <Text style={[styles.disclaimer, { color: palette.muted }]}>AI can make mistakes. Verify important answers. Never share passwords or payment details.</Text>
          </View></View>
        </>}
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0, minWidth: 0 }, layout: { flex: 1, flexDirection: 'row', minHeight: 0 },
  sidebar: { width: 276, borderRightWidth: 1, padding: 18, gap: 9 }, mobileSidebar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '100%', zIndex: 20 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 }, mark: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#2459d3', alignItems: 'center', justifyContent: 'center' }, markText: { fontFamily: systemFontFamily, color: 'white', fontSize: 23, fontWeight: '700' }, brandName: { fontFamily: systemFontFamily, fontSize: 21, fontWeight: '700', flex: 1 },
  button: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1 }, small: { fontSize: 14, lineHeight: 21, fontFamily: systemFontFamily },
  search: { fontFamily: systemFontFamily, minHeight: 44, paddingHorizontal: 12, borderBottomWidth: 1, fontSize: 13 }, eyebrow: { fontFamily: systemFontFamily, fontSize: 10, fontWeight: '700', letterSpacing: 1.4, marginBottom: 8, marginTop: 12 }, historyItem: { minHeight: 44, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 9 }, profile: { borderTopWidth: 1, paddingVertical: 14, flexDirection: 'row', gap: 9, alignItems: 'center' },
  main: { flex: 1, minWidth: 0 }, header: { minHeight: 76, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1 }, headerTitle: { fontFamily: systemFontFamily, fontSize: 18, fontWeight: '600' }, iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  messages: { padding: 32, flexGrow: 1 }, column: { width: '100%', maxWidth: 810, alignSelf: 'center', minWidth: 0 }, welcome: { paddingTop: 42, gap: 22, alignItems: 'center', paddingBottom: 30 }, welcomeMark: { width: 72, height: 72, borderRadius: 25, alignItems: 'center', justifyContent: 'center' }, heading: { fontFamily: systemFontFamily, fontSize: 37, fontWeight: '600', letterSpacing: -1, textAlign: 'center' }, subtitle: { fontFamily: systemFontFamily, fontSize: 16, lineHeight: 26, maxWidth: 510, textAlign: 'center' },
  cards: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, width: '100%', marginTop: 14 }, card: { minHeight: 80, borderWidth: 1, borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 17 }, cardNumber: { fontFamily: systemFontFamily, fontSize: 11 }, caption: { fontFamily: systemFontFamily, fontSize: 11, lineHeight: 18 },
  message: { marginBottom: 24, minWidth: 0 }, messageActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 }, thinking: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  composerArea: { padding: 24, paddingTop: 8 }, composer: { borderRadius: 22, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'flex-end', gap: 12 }, input: { fontFamily: systemFontFamily, fontSize: 15, flex: 1, minWidth: 0, minHeight: 44, maxHeight: 140, padding: 10, textAlignVertical: 'top' }, send: { backgroundColor: '#2459d3', width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, disclaimer: { fontFamily: systemFontFamily, fontSize: 11, lineHeight: 17, textAlign: 'center', paddingTop: 10 }, error: { padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#bf725d', borderRadius: 12 },
});
