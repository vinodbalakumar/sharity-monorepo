import { appStorage } from '../storage/storage';
import { AuthenticationRequiredError, getBffCsrfToken } from './sessionService';
import { sessionFetch as fetch } from './sessionFetch';
import { resolvePublicBaseUrl } from './publicUrl';

const base = resolvePublicBaseUrl(process.env.EXPO_PUBLIC_BFF_BASE_URL, '/bff');
const messages: Record<number, string> = {
  400: 'Please check the information you entered and try again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested item could not be found.',
  409: 'This item has changed. Refresh and review it before continuing.',
  422: 'Please review the information you entered.',
  429: 'Too many requests. Please wait a moment and try again.',
};
export class ApiError extends Error {
  constructor(public status: number, public reference?: string, message?: string) {
    super(`${message ?? messages[status] ?? 'This service is temporarily unavailable. Please try again shortly.'}${reference ? ` Reference: ${reference}` : ''}`);
    this.name = 'ApiError';
  }
}
/** No automatic mutation retries: a timed-out payment may already have been processed. */
export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  const method = (options.method ?? 'GET').toUpperCase();
  try {
    const token = await appStorage.getItem('access_token');
    const csrf = ['GET', 'HEAD', 'OPTIONS'].includes(method) ? {} : await getBffCsrfToken();
    const response = await fetch(`${base}${path}`, {
      ...options, credentials: 'include', signal: options.signal ?? controller.signal,
      headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...('csrfToken' in csrf && csrf.csrfToken ? { 'X-CSRF-TOKEN': csrf.csrfToken } : {}), ...options.headers },
    });
    if (!response.ok) {
      const reference = response.headers.get('X-Correlation-ID');
      const safeReference = reference && /^[A-Za-z0-9_-]{1,64}$/.test(reference) ? reference : undefined;
      throw new ApiError(response.status, safeReference);
    }
    if (response.status === 204) return undefined as T;
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  } catch (error) {
    if (error instanceof ApiError || error instanceof AuthenticationRequiredError) throw error;
    throw new Error('Unable to connect. Check your connection and try again. If you were making a payment, check your orders before trying again.');
  } finally { clearTimeout(timeout); }
}
