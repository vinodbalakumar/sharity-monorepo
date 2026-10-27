import type { BrowserSessionSummary, SessionCheckResult } from '../types/session';
import { appStorage } from '../storage/storage';
import { resetCartBadge } from '../state/cartBadge';
import { resolvePublicBaseUrl } from './publicUrl';

const sessionTimeoutMs = 5000;
const bffBaseUrl = resolvePublicBaseUrl(process.env.EXPO_PUBLIC_BFF_BASE_URL, '/bff');
const logoutOverrideKey = 'sharity_logout_override';
async function sessionHeaders(): Promise<Record<string, string>> {
  const token = await appStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function checkSession(): Promise<SessionCheckResult> {
  // Slow startup or a transient network failure is not an anonymous session.
  // Retry once, then preserve local session artifacts and let the UI recover.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), sessionTimeoutMs);
    try {
      const response = await fetch(`${bffBaseUrl}/session`, { credentials: 'include', signal: controller.signal, headers: await sessionHeaders() });
      if (response.status >= 500 || response.status === 429) continue;
      if (!response.ok) return { status: 'anonymous' };
      const body = (await response.json()) as { authenticated?: unknown };
      return body.authenticated === true ? { status: 'authenticated' } : { status: 'anonymous' };
    } catch {
      // The second attempt can recover a cold connection without logging out.
    } finally {
      clearTimeout(timeout);
    }
  }
  return { status: 'unavailable' };
}

export async function getBrowserSessionSummary(): Promise<BrowserSessionSummary | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), sessionTimeoutMs);
  try {
    const response = await fetch(`${bffBaseUrl}/session`, {
      credentials: 'include', signal: controller.signal, headers: await sessionHeaders()
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as BrowserSessionSummary;
  } catch {
    return null;
  } finally { clearTimeout(timeout); }
}

export async function logoutBrowserSession(): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const session = await getBffCsrfToken();
    const refreshToken = await appStorage.getItem('refresh_token');

    const body = refreshToken ? { refreshToken } : undefined;

    const response = await fetch(`${bffBaseUrl}/logout`, {
      signal: controller.signal,
      credentials: 'include',
      headers: {
        ...(session.csrfToken ? { 'X-CSRF-TOKEN': session.csrfToken } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {})
      },
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    });
    if (!response.ok) throw new Error('Unable to sign out. Please try again.');
    await appStorage.setItem(logoutOverrideKey, '1');
    // Clear all tokens and authentication state
    await clearAllAuthTokens();
  } finally {
    clearTimeout(timeout);
  }
}

export async function clearLogoutOverride(): Promise<void> {
  await appStorage.removeItem(logoutOverrideKey);
}

export async function clearBrowserSessionArtifacts(): Promise<void> {
  await clearLogoutOverride();
  await clearAllAuthTokens();
}

export async function hasLogoutOverride(): Promise<boolean> {
  return (await appStorage.getItem(logoutOverrideKey)) === '1';
}

async function clearAllAuthTokens(): Promise<void> {
  resetCartBadge();
  await Promise.all([
    appStorage.removeItem('access_token'),
    appStorage.removeItem('refresh_token'),
    appStorage.removeItem('id_token'),
    appStorage.removeItem('user_id'),
    appStorage.removeItem('user_email')
  ]);

  if (typeof document !== 'undefined') {
    // Clear cookies by setting them to empty with maxAge=0.
    // This is a fallback since the server should also send clear-cookie headers.
    const cookieNames = ['access_token', 'refresh_token', 'id_token', 'session'];
    cookieNames.forEach((name) => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
  }
}

export async function getBffCsrfToken(): Promise<{ csrfToken?: string }> {
  return { csrfToken: (await getBrowserSessionSummary())?.csrfToken ?? undefined };
}

/** Typed session failure shared by authenticated feature APIs. */
export class AuthenticationRequiredError extends Error {
  constructor(message = 'Please sign in to continue.') { super(message); this.name = 'AuthenticationRequiredError'; }
}

export async function readApiErrorMessage(response: Response, fallback = 'Request failed'): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === 'object') {
      const message = (body as { message?: unknown }).message;
      if (typeof message === 'string' && message.length <= 500) return message;
    }
  } catch { /* Non-JSON error responses use a safe fallback. */ }
  return `${fallback} (${response.status})`;
}
