import type { SessionCheckResult } from '../types/session';

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
