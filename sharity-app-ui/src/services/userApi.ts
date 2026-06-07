import { getBffCsrfToken } from './sessionService';

const userBaseUrl = process.env.EXPO_PUBLIC_AUTH_USER_BASE_URL ?? '/bff/api/authorization-server/api/v1';

export type CurrentUserProfile = {
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  phoneDialCode?: string | null;
  countryCode?: string | null;
  countryName?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  profileImageUrl?: string | null;
  privacySetting?: string | null;
};

export type CurrentUser = {
  publicId: string;
  email: string;
  username: string;
  status: string;
  profileCompletionStatus: string;
  emailVerified: boolean;
  profile: CurrentUserProfile;
  roles: string[];
  apps: string[];
};

export type UserSession = {
  id: number;
  deviceName?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  issuedAt?: string | null;
  expiresAt?: string | null;
  lastUsedAt?: string | null;
};

export type SocialLink = {
  provider: string;
  displayName?: string | null;
};

export type UpdateUserProfileRequest = {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  countryCode?: string;
  countryName?: string;
  phoneDialCode?: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  profileImageUrl?: string | null;
  privacySetting?: string | null;
};

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${userBaseUrl}${path}`, {
    credentials: 'include'
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return response.json() as Promise<T>;
}

async function mutate<T>(path: string, method: 'DELETE' | 'PUT', body?: unknown): Promise<T> {
  const csrf = await getBffCsrfToken();
  const response = await fetch(`${userBaseUrl}${path}`, {
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'include',
    headers: {
      ...(body === undefined ? undefined : { 'Content-Type': 'application/json' }),
      ...(csrf.csrfToken ? { 'X-CSRF-TOKEN': csrf.csrfToken } : {})
    },
    method
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return response.json() as Promise<T>;
}

export function getCurrentUser(): Promise<CurrentUser> {
  return getJson<CurrentUser>('/users/me');
}

export function updateCurrentUserProfile(request: UpdateUserProfileRequest): Promise<{ firstName?: string | null; lastName?: string | null; phoneNumber?: string | null; phoneDialCode?: string | null; countryCode?: string | null; countryName?: string | null; dateOfBirth?: string | null; gender?: string | null; profileImageUrl?: string | null; privacySetting?: string | null; }> {
  return mutate<{ firstName?: string | null; lastName?: string | null; phoneNumber?: string | null; phoneDialCode?: string | null; countryCode?: string | null; countryName?: string | null; dateOfBirth?: string | null; gender?: string | null; profileImageUrl?: string | null; privacySetting?: string | null; }>('/users/me/profile', 'PUT', request);
}

export function getCurrentUserSessions(): Promise<UserSession[]> {
  return getJson<UserSession[]>('/users/me/sessions');
}

export function getCurrentUserSocialLinks(): Promise<SocialLink[]> {
  return getJson<SocialLink[]>('/users/me/social-links');
}

export function revokeCurrentUserSession(sessionId: number): Promise<{ message?: string }> {
  return mutate<{ message?: string }>(`/users/me/sessions/${sessionId}`, 'DELETE');
}

export function revokeAllCurrentUserSessions(): Promise<{ message?: string }> {
  return mutate<{ message?: string }>('/users/me/sessions', 'DELETE');
}

export function unlinkGoogleAccount(): Promise<{ message?: string }> {
  return mutate<{ message?: string }>('/users/me/social/google', 'DELETE');
}

export function startGoogleLink(): void {
  const path = `${userBaseUrl}/users/me/social/google/link/start`;
  if (typeof window !== 'undefined') {
    window.location.assign(path);
  }
}

export async function uploadCurrentUserProfileImage(file: Blob & { name?: string }): Promise<{ profileImageUrl: string }> {
  const formData = new FormData();
  formData.append('file', file as never, file.name ?? 'profile-image.jpg');
  const csrf = await getBffCsrfToken();
  const response = await fetch(`${userBaseUrl}/users/me/profile-image`, {
    body: formData,
    credentials: 'include',
    headers: csrf.csrfToken ? { 'X-CSRF-TOKEN': csrf.csrfToken } : undefined,
    method: 'POST'
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return response.json() as Promise<{ profileImageUrl: string }>;
}

async function readErrorMessage(response: Response) {
  try {
    const body = await response.json();
    return body.message ?? body.error ?? `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}
