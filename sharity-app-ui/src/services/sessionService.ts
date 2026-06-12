import type { BrowserSessionSummary, SessionCheckResult } from '../types/session';

const sessionTimeoutMs = 2500;
const bffBaseUrl = process.env.EXPO_PUBLIC_BFF_BASE_URL ?? '/bff';

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

export async function logoutBrowserSession(): Promise<void> {
  try {
    const session = await getBffCsrfToken();
    const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');

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
    // Clear all tokens and authentication state
    clearAllAuthTokens();
  }
}

function clearAllAuthTokens(): void {
  // Clear localStorage
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('id_token');
  localStorage.removeItem('user_id');
  localStorage.removeItem('user_email');

  // Clear sessionStorage
  sessionStorage.removeItem('access_token');
  sessionStorage.removeItem('refresh_token');
  sessionStorage.removeItem('id_token');
  sessionStorage.removeItem('user_id');
  sessionStorage.removeItem('user_email');

  // Clear cookies by setting them to empty with maxAge=0
  // This is a fallback since the server should also send clear-cookie headers
  const cookieNames = ['access_token', 'refresh_token', 'id_token', 'session'];
  cookieNames.forEach(name => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });
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
