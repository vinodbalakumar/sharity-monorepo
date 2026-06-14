import { getBffCsrfToken } from './sessionService';
const bffBaseUrl = process.env.EXPO_PUBLIC_BFF_BASE_URL ?? '/bff';
const userBaseUrl = process.env.EXPO_PUBLIC_AUTH_USER_BASE_URL ?? `${bffBaseUrl}/api/authorization-server/api/v1`;
async function fetchBffSession() {
    try {
        const response = await fetch(`${bffBaseUrl}/session`, {
            credentials: 'include'
        });
        if (!response.ok) {
            return null;
        }
        return await response.json();
    }
    catch {
        return null;
    }
}
async function hasActiveBffSession() {
    const session = await fetchBffSession();
    return session?.authenticated === true;
}
function sessionFallbackUser(session) {
    if (session.authenticated !== true || !session.publicId || !session.email) {
        return null;
    }
    return {
        publicId: session.publicId,
        email: session.email,
        username: session.name ?? session.email,
        status: 'ACTIVE',
        profileCompletionStatus: 'UNKNOWN',
        emailVerified: true,
        profile: {
            phoneNumber: session.phone ?? null
        },
        roles: session.roles ?? [],
        apps: session.applications ?? []
    };
}
async function fetchUserApi(path, init) {
    return fetch(`${userBaseUrl}${path}`, {
        credentials: 'include',
        ...init
    });
}
async function readUserApiErrorMessage(response, fallbackPrefix) {
    if (response.status === 401 && await hasActiveBffSession()) {
        return 'Profile service is unavailable right now.';
    }
    return readApiErrorMessage(response, fallbackPrefix);
}
async function getJson(path) {
    const response = await fetchUserApi(path);
    if (!response.ok) {
        throw new Error(await readErrorMessage(response));
    }
    return readJsonResponse(response, 'Unable to load account data');
}
async function readJsonResponse(response, fallbackMessage) {
    try {
        return (await response.json());
    }
    catch {
        throw new Error(fallbackMessage);
    }
}
async function mutate(path, method, body) {
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
}
export function getCurrentUser() {
    return getJson('/users/me');
}
export function updateCurrentUserProfile(request) {
    return mutate('/users/me/profile', 'PUT', request);
}
export function getCurrentUserSessions() {
    return fetchUserApi('/users/me/sessions').then(async (response) => {
        if (response.ok) {
            return readJsonResponse(response, 'Unable to load account data');
        }
        if (response.status === 401 && await hasActiveBffSession()) {
            return [];
        }
        throw new Error(await readUserApiErrorMessage(response, 'Unable to load account data'));
    });
}
export function getCurrentUserSocialLinks() {
    return fetchUserApi('/users/me/social-links').then(async (response) => {
        if (response.ok) {
            return readJsonResponse(response, 'Unable to load account data');
        }
        if (response.status === 401 && await hasActiveBffSession()) {
            return [];
        }
        throw new Error(await readUserApiErrorMessage(response, 'Unable to load account data'));
    });
}
export function revokeCurrentUserSession(sessionId) {
    return mutate(`/users/me/sessions/${sessionId}`, 'DELETE');
}
export function revokeAllCurrentUserSessions() {
    return mutate('/users/me/sessions', 'DELETE');
}
export function unlinkGoogleAccount() {
    return mutate('/users/me/social/google', 'DELETE');
}
export function startGoogleLink() {
    const path = `${userBaseUrl}/users/me/social/google/link/start`;
    if (typeof window !== 'undefined') {
        window.location.assign(path);
    }
}
export async function uploadCurrentUserProfileImage(file) {
    const formData = new FormData();
    const fileName = file.name ?? 'profile-image.jpg';
    formData.append('file', file, fileName);
    const csrf = await getBffCsrfToken();
    const headers = {};
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
        const result = await readJsonResponse(response, 'Unable to read profile image upload response');
        console.log('Profile image uploaded successfully:', result);
        return result;
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('Failed to fetch')) {
            throw new Error('Network error: Check your connection and try again.');
        }
        throw error;
    }
}
async function readErrorMessage(response) {
    try {
        const body = await response.json();
        return body.message ?? body.error ?? `Request failed (${response.status})`;
    }
    catch {
        return `Request failed (${response.status})`;
    }
}
