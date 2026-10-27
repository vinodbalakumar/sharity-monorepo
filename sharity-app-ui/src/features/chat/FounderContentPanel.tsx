import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { apiRequest } from '../../services/apiClient';

type Post = { id: string; platform: string; postId: string; content: string; originalUrl: string; publishedAt: string; approval: string; visibility: string; lastSync: number };
const base = '/api/platform-ai-service/api/ai/admin/founder';
export function FounderContentPanel({ onClose }: { onClose: () => void }) {
  const [posts, setPosts] = useState<Post[]>([]); const [status, setStatus] = useState<Record<string, unknown>>({});
  const [json, setJson] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  const load = async () => { const [items, state] = await Promise.all([apiRequest<Post[]>(`${base}/posts`), apiRequest<Record<string, unknown>>(`${base}/status`)]); setPosts(items); setStatus(state); };
  const run = async (path: string, method = 'POST', body?: unknown) => { setBusy(true); setMessage('');
    try { await apiRequest(`${base}${path}`, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }); await load(); setMessage('Content updated. Retrieval uses current approval status immediately.'); }
    catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to update content.'); } finally { setBusy(false); }
  };
  useEffect(() => { void load().catch(e => setMessage(e instanceof Error ? e.message : 'Access unavailable.')); }, []);
  const button = (label: string, action: () => void) => <Pressable accessibilityRole="button" disabled={busy} onPress={action} style={{ padding: 12, minHeight: 44, borderWidth: 1, borderColor: '#a1bcac', borderRadius: 9 }}><Text style={{ color: '#235f43' }}>{label}</Text></Pressable>;
  return <View style={{ backgroundColor: '#f7faf6', padding: 20, gap: 16, borderRadius: 18, maxWidth: 900, width: '100%', alignSelf: 'center' }}>
    <Text accessibilityRole="header" style={{ fontSize: 24, fontWeight: '600', color: '#20352a' }}>Founder content review</Text>
    <Text>Import only content supplied or authorized by the founder. Confirm authorship, original URL, rights and public visibility before approval. Reimports reset approval. Revoking or deleting removes a post from future retrieval immediately; existing chat messages may still contain earlier answers.</Text>
    <Text selectable>{JSON.stringify(status, null, 2)}</Text>
    <Text>Paste approved export JSON: {'{"posts":[{"platform":"LINKEDIN","postId":"original-id","publishedAt":"2026-10-25T00:00:00Z","content":"Founder-supplied text","originalUrl":"https://www.linkedin.com/posts/original-post"}]}'} Up to 20 records; ISO UTC publication dates. Instagram uses platform INSTAGRAM.</Text>
    <TextInput accessibilityLabel="Founder export JSON" multiline value={json} onChangeText={setJson} maxLength={65000} placeholder="Paste founder-provided JSON" style={{ minHeight: 180, fontFamily: 'monospace', padding: 14, borderWidth: 1, borderRadius: 10, borderColor: '#a1bcac', color: '#20352a' }} />
    <View style={{ gap: 10, flexDirection: 'row', flexWrap: 'wrap' }}>{button('Import for review', () => { try { const body: unknown = JSON.parse(json); void run('/import', 'POST', body); } catch { setMessage('Please enter valid JSON.'); } })}{button('Reindex approved knowledge', () => void run('/reindex'))}{button('Close review', onClose)}</View>
    {message !== '' && <Text accessibilityRole="alert">{message}</Text>}
    {posts.map(p => <View key={p.id} style={{ borderTopWidth: 1, borderColor: '#c4d3c6', paddingTop: 16, gap: 10 }}><Text style={{ fontWeight: '700' }}>{p.platform} · {p.approval} · {p.visibility}</Text><Text selectable>{p.publishedAt} · Last import {new Date(p.lastSync).toISOString()}</Text><Text selectable>{p.originalUrl}</Text><Text selectable>{p.content}</Text><View style={{ gap: 8, flexDirection: 'row', flexWrap: 'wrap' }}>{button('Approve founder-owned public content', () => void run(`/posts/${p.id}/review`, 'POST', { decision: 'APPROVED' }))}{button('Reject', () => void run(`/posts/${p.id}/review`, 'POST', { decision: 'REJECTED' }))}{button('Revoke public access', () => void run(`/posts/${p.id}/review`, 'POST', { decision: 'REVOKED' }))}{button('Delete imported record', () => void run(`/posts/${p.id}`, 'DELETE'))}</View></View>)}
  </View>;
}
