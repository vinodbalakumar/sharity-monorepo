const publicBaseUrl = process.env.EXPO_PUBLIC_BFF_PUBLIC_BASE_URL
    ?? process.env.EXPO_PUBLIC_BFF_BASE_URL?.replace(/\/bff$/, '')
    ?? '';
const requestTimeoutMs = 6000;
async function getJson(path) {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
        controller.abort();
    }, requestTimeoutMs);
    try {
        const response = await fetch(`${publicBaseUrl}${path}`, {
            credentials: 'include',
            signal: controller.signal
        });
        if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`);
        }
        return (await response.json());
    }
    finally {
        clearTimeout(timeout);
    }
}
export async function getVisitorContext() {
    return getJson('/bff/public/context');
}
export async function getPublicContentPage(slug, countryCode, locale) {
    const params = new URLSearchParams();
    if (countryCode) {
        params.set('countryCode', countryCode);
    }
    if (locale) {
        params.set('locale', locale);
    }
    const query = params.toString();
    return getJson(`/bff/public/content/pages/${encodeURIComponent(slug)}${query ? `?${query}` : ''}`);
}
