const walletBaseUrl = process.env.EXPO_PUBLIC_WALLET_BASE_URL ?? '/bff/api/wallet-service/api/v1/wallet';
async function getJson(path) {
    const response = await fetch(`${walletBaseUrl}${path}`, {
        credentials: 'include'
    });
    if (!response.ok) {
        throw new Error(await readErrorMessage(response));
    }
    return response.json();
}
export function getWalletSummary() {
    return getJson('/me/summary');
}
export function getWalletActivity() {
    return getJson('/me/activity');
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
