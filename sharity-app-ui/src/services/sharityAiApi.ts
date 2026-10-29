import { appStorage } from '../storage/storage';
import { sessionFetch as fetch } from './sessionFetch';
import { getBffCsrfToken } from './sessionService';
import { resolvePublicBaseUrl } from './publicUrl';

export type AiSource = { id: string; title: string; url: string; updatedAt: string; content: string };
export type AiMetrics = { requestStartedAt: number; responseCompletedAt: number; durationMs: number; inputTokens: number | null; outputTokens: number | null; totalTokens: number | null; generation: 'STRUCTURED' | 'OLLAMA' };
export type AiMessage = { id: string; role: 'user' | 'assistant'; content: string; sources: AiSource[]; createdAt: number; metrics?: AiMetrics | null };
export type AiSummary = { id: string; title: string; createdAt: number; updatedAt: number; saved: boolean };
export type AiConversation = { conversation: AiSummary; messages: AiMessage[] };
export type AiAnswer = { conversationId: string; response: string; sources: AiSource[]; generation: 'STRUCTURED' | 'OLLAMA'; messageId?: string; metrics?: AiMetrics };
const base = resolvePublicBaseUrl(process.env.EXPO_PUBLIC_BFF_BASE_URL, '/bff');
export class ChatError extends Error { constructor(public status: number, message: string) { super(message); } }
export async function chatRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = options.method ?? 'GET';
  const token = await appStorage.getItem('access_token');
  const csrf = method === 'GET' ? {} : await getBffCsrfToken();
  const controller = new AbortController();
  const cancel = () => controller.abort();
  options.signal?.addEventListener('abort', cancel);
  if (options.signal?.aborted) controller.abort();
  const timeout = setTimeout(() => controller.abort(), 100000);
  try {
    const response = await fetch(`${base}/ai${path}`, { ...options, signal: controller.signal, credentials: 'include',
      headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(csrf.csrfToken ? { 'X-CSRF-TOKEN': csrf.csrfToken } : {}), ...options.headers } });
    if (!response.ok) throw new ChatError(response.status,
      response.status === 429 ? 'Sharity AI is busy. Please wait a minute and try again.' :
        [401, 403, 404].includes(response.status) ? 'Your session changed or this conversation is no longer available. Start a new chat or sign in again.' :
          response.status === 400 ? 'Please enter a message of 1–1500 characters.' : 'Sharity AI is temporarily unavailable. Please try again shortly.');
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  } finally { clearTimeout(timeout); options.signal?.removeEventListener('abort', cancel); }
}
