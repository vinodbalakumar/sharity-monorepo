import { StyleSheet, Text, View } from 'react-native';
import type { AiMessage, AiMetrics } from '../../services/sharityAiApi';
import { systemFontFamily } from '../../theme/typography';

export type ClientTiming = { sentAt: number; receivedAt: number; elapsedMs: number };
type Colors = { text: string; muted: string; border: string; side: string };
const tokens = (value: number | null | undefined) => value == null ? 'Unavailable' : value.toLocaleString();
const date = (value: number) => new Date(value).toLocaleString();

export function MessageInfo({ metrics, timing, colors }: { metrics?: AiMetrics | null; timing?: ClientTiming; colors: Colors }) {
  return <View testID="message-info" style={[styles.panel, { backgroundColor: colors.side, borderColor: colors.border }]}>
    <Text accessibilityRole="header" style={[styles.heading, { color: colors.text }]}>Message info</Text>
    {timing ? <>
      <Text style={[styles.row, { color: colors.text }]}>Request sent: {date(timing.sentAt)}</Text>
      <Text style={[styles.row, { color: colors.text }]}>Response received: {date(timing.receivedAt)}</Text>
      <Text style={[styles.row, { color: colors.text }]}>Round-trip time: {(timing.elapsedMs / 1000).toFixed(1)} s</Text>
    </> : null}
    {metrics ? <>
      <Text style={[styles.row, { color: colors.text }]}>Server received: {date(metrics.requestStartedAt)}</Text>
      <Text style={[styles.row, { color: colors.text }]}>Answer generated: {date(metrics.responseCompletedAt)}</Text>
      <Text style={[styles.row, { color: colors.text }]}>Server processing: {(metrics.durationMs / 1000).toFixed(1)} s</Text>
      <Text style={[styles.row, { color: colors.text }]}>Input tokens: {tokens(metrics.inputTokens)}</Text>
      <Text style={[styles.row, { color: colors.text }]}>Output tokens: {tokens(metrics.outputTokens)}</Text>
      <Text style={[styles.row, { color: colors.text }]}>Total tokens: {tokens(metrics.totalTokens)}</Text>
      <Text style={[styles.note, { color: colors.muted }]}>{metrics.generation === 'STRUCTURED' ? 'Approved answer; no model call or token usage.' : 'Provider-reported counts. Input includes instructions and conversation context.'}</Text>
    </> : <Text style={[styles.note, { color: colors.muted }]}>Token usage and server timing were not recorded for this older reply.</Text>}
    {!timing && metrics && <Text style={[styles.note, { color: colors.muted }]}>Device send/receive times are available only for replies received in this session.</Text>}
  </View>;
}

export function ConversationInfo({ messages, colors }: { messages: AiMessage[]; colors: Colors }) {
  const replies = messages.filter(message => message.role === 'assistant');
  const known = replies.filter(message => message.metrics?.totalTokens != null);
  const missing = replies.length - known.length;
  const sum = (field: 'inputTokens' | 'outputTokens' | 'totalTokens') => known.length ? known.reduce((total, message) => total + (message.metrics?.[field] ?? 0), 0) : null;
  return <View testID="chat-info" style={[styles.panel, { backgroundColor: colors.side, borderColor: colors.border }]}>
    <Text accessibilityRole="header" style={[styles.heading, { color: colors.text }]}>Chat info</Text>
    <Text style={[styles.row, { color: colors.text }]}>Replies: {replies.length}</Text>
    <Text style={[styles.row, { color: colors.text }]}>Input tokens: {tokens(sum('inputTokens'))}</Text>
    <Text style={[styles.row, { color: colors.text }]}>Output tokens: {tokens(sum('outputTokens'))}</Text>
    <Text style={[styles.row, { color: colors.text }]}>{missing ? 'Known total tokens' : 'Total tokens'}: {tokens(sum('totalTokens'))}</Text>
    {missing > 0 && <Text style={[styles.note, { color: colors.muted }]}>{missing} replies have no recorded token usage.</Text>}
    <Text style={[styles.note, { color: colors.muted }]}>Totals count each model request, including repeated history sent as input. Approved answers use zero model tokens.</Text>
  </View>;
}
const styles = StyleSheet.create({
  panel: { borderWidth: 1, borderRadius: 12, padding: 14, marginVertical: 10, gap: 6 },
  heading: { fontFamily: systemFontFamily, fontSize: 15, fontWeight: '600', marginBottom: 4 },
  row: { fontFamily: systemFontFamily, fontSize: 13, lineHeight: 20, flexShrink: 1 },
  note: { fontFamily: systemFontFamily, fontSize: 11, lineHeight: 17 },
});
