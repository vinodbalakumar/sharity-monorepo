import { getBffCsrfToken } from './sessionService';
const platformAuthBaseUrl = process.env.EXPO_PUBLIC_AUTH_BASE_URL ?? '/bff/api/authorization-server/api/v1';
async function getJson(path) {
    const response = await fetch(`${platformAuthBaseUrl}${path}`, {
        credentials: 'include'
    });
    if (!response.ok) {
        throw new Error(await readErrorMessage(response));
    }
    return response.json();
}
async function postJson(path, body) {
    const csrf = await getBffCsrfToken();
    const response = await fetch(`${platformAuthBaseUrl}${path}`, {
        body: JSON.stringify(body),
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...(csrf.csrfToken ? { 'X-CSRF-TOKEN': csrf.csrfToken } : {})
        },
        method: 'POST'
    });
    if (!response.ok) {
        throw new Error(await readErrorMessage(response));
    }
    return response.json();
}
export function getMyProviderAccounts() {
    return getJson('/users/me/provider-accounts');
}
export function getMyCapabilities() {
    return getJson('/users/me/capabilities');
}
export function getMyModules() {
    return getJson('/users/me/modules');
}
export function createProviderAccount(request) {
    return postJson('/users/me/provider-accounts', request);
}
export function enrollProviderModule(providerPublicId, moduleCode) {
    return postJson(`/users/me/provider-accounts/${providerPublicId}/modules/${moduleCode}/enroll`, {});
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
