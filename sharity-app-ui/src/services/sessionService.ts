import type { BrowserSessionSummary, SessionCheckResult } from '../types/session';
import { appStorage } from '../storage/storage';

const sessionTimeoutMs = 2500;
const bffBaseUrl = process.env.EXPO_PUBLIC_BFF_BASE_URL ?? '/bff';
const logoutOverrideKey = 'sharity_logout_override';

export async function checkSession(): Promise<SessionCheckResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, sessionTimeoutMs);

  try {
    const response = await fetch(`${bffBaseUrl}/session`, {
      credentials: 'include',
      signal: controller.signal
    });

    if (!response.ok) {
      return { status: 'anonymous' };
    }

    const body = (await response.json()) as { authenticated?: unknown };
    return body.authenticated === true ? { status: 'authenticated' } : { status: 'anonymous' };
  } catch {
    return { status: 'anonymous' };
  } finally {
    clearTimeout(timeout);
  }
}

export async function getBrowserSessionSummary(): Promise<BrowserSessionSummary | null> {
  try {
    const response = await fetch(`${bffBaseUrl}/session`, {
      credentials: 'include'
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as BrowserSessionSummary;
  } catch {
    return null;
  }
}

export async function logoutBrowserSession(): Promise<void> {
  try {
    const session = await getBffCsrfToken();
    const refreshToken = await appStorage.getItem('refresh_token');

    const body = refreshToken ? { refreshToken } : undefined;

    await fetch(`${bffBaseUrl}/logout`, {
      credentials: 'include',
      headers: {
        ...(session.csrfToken ? { 'X-CSRF-TOKEN': session.csrfToken } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {})
      },
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (error) {
    console.error('Error calling logout endpoint:', error);
  } finally {
    await appStorage.setItem(logoutOverrideKey, '1');
    // Clear all tokens and authentication state
    await clearAllAuthTokens();
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
  try {
    const response = await fetch(`${bffBaseUrl}/session`, {
      credentials: 'include'
    });
    if (!response.ok) {
      return {};
    }
    const body = (await response.json()) as { csrfToken?: string };
    return { csrfToken: body.csrfToken };
  } catch {
    return {};
  }
}
