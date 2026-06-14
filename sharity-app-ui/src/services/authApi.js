const authBaseUrl = process.env.EXPO_PUBLIC_AUTH_BASE_URL ?? '/authorization-server/api/v1/auth';
export async function registerAccount(request) {
    const response = await fetch(`${authBaseUrl}/register`, {
        body: JSON.stringify(request),
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        method: 'POST'
    });
    if (!response.ok) {
        const message = await readErrorMessage(response);
        throw new Error(message);
    }
    return response.json();
}
export function startSocialRegistration(provider) {
    const providerPath = provider.toLowerCase();
    const startUrl = `${authBaseUrl}/social/${providerPath}/start?flow=register`;
    if (typeof window !== 'undefined') {
        window.location.assign(startUrl);
    }
}
export async function getSocialRegistrationSession() {
    const response = await fetch(`${authBaseUrl}/social/session`, {
        credentials: 'include',
        method: 'GET'
    });
    if (!response.ok) {
        const message = await readErrorMessage(response);
        throw new Error(message);
    }
    return response.json();
}
export async function getRegistrationOptions() {
    const response = await fetch(`${authBaseUrl}/public/registration-options`, {
        credentials: 'include',
        method: 'GET'
    });
    if (!response.ok) {
        const message = await readErrorMessage(response);
        throw new Error(message);
    }
    return response.json();
}
export async function completeSocialRegistration(request) {
    const response = await fetch(`${authBaseUrl}/social/complete-registration`, {
        body: JSON.stringify(request),
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        method: 'POST'
    });
    if (!response.ok) {
        const message = await readErrorMessage(response);
        throw new Error(message);
    }
    return response.json();
}
export async function uploadSocialProfileImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${authBaseUrl}/social/profile-image`, {
        body: formData,
        credentials: 'include',
        method: 'POST'
    });
    if (!response.ok) {
        const message = await readErrorMessage(response);
        throw new Error(message);
    }
    return response.json();
}
async function readErrorMessage(response) {
    try {
        const body = await response.json();
        return body.message ?? body.error ?? `Registration failed (${response.status})`;
    }
    catch {
        return `Registration failed (${response.status})`;
    }
}
