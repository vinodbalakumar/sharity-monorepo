import { getBffCsrfToken, readApiErrorMessage } from './sessionService';
import { sessionFetch as fetch } from './sessionFetch';
import { resolvePublicBaseUrl } from './publicUrl';

const userBaseUrl = resolvePublicBaseUrl(process.env.EXPO_PUBLIC_AUTH_USER_BASE_URL, '/bff/api/authorization-server/api/v1');

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

async function fetchUserApi(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${userBaseUrl}${path}`, {
    credentials: 'include',
    ...init
  });
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetchUserApi(path);
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return readJsonResponse<T>(response, 'Unable to load account data');
}

async function readJsonResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error(fallbackMessage);
  }
}

async function mutate<T>(path: string, method: 'DELETE' | 'PUT', body?: unknown): Promise<T> {
  const csrf = await getBffCsrfToken();
  const response = await fetchUserApi(path, {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      ...(body === undefined ? undefined : { 'Content-Type': 'application/json' }),
      ...(csrf.csrfToken ? { 'X-CSRF-TOKEN': csrf.csrfToken } : {})
    },
    method
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  if (response.status === 204) return undefined as T;
  return readJsonResponse<T>(response, 'Unable to read account update');
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
  const fileName = file.name ?? 'profile-image.jpg';
  formData.append('file', file as never, fileName);

  const csrf = await getBffCsrfToken();
  const headers: Record<string, string> = {};
  if (csrf.csrfToken) {
    headers['X-CSRF-TOKEN'] = csrf.csrfToken;
  }

  try {
    const response = await fetchUserApi('/users/me/profile-image', {
      body: formData,
      headers,
      method: 'POST'
    });

    if (!response.ok) {
      const errorMessage = await readErrorMessage(response);
      console.error('Profile image upload failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        fileName
      });
      throw new Error(errorMessage);
    }

    const result = await readJsonResponse<{ profileImageUrl: string }>(response, 'Unable to read profile image upload response');
    console.log('Profile image uploaded successfully:', result);
    return result;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Failed to fetch')) {
      throw new Error('Network error: Check your connection and try again.');
    }
    throw error;
  }
}

async function readErrorMessage(response: Response) {
  return readApiErrorMessage(response);
}
