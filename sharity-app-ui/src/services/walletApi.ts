const walletBaseUrl = process.env.EXPO_PUBLIC_WALLET_BASE_URL ?? '/bff/api/wallet-service/api/v1/wallet';

export type WalletSummary = {
  pendingAmount: number;
  availableAmount: number;
  paidAmount: number;
  reversedAmount: number;
  currencyCode: string;
};

export type WalletActivity = {
  publicId: string;
  entryType: string;
  direction: string;
  amount: number;
  currencyCode: string;
  entryStatus: string;
  description: string;
  createdAt: string;
};

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${walletBaseUrl}${path}`, {
    credentials: 'include'
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return response.json() as Promise<T>;
}

export function getWalletSummary(): Promise<WalletSummary> {
  return getJson<WalletSummary>('/me/summary');
}

export function getWalletActivity(): Promise<WalletActivity[]> {
  return getJson<WalletActivity[]>('/me/activity');
}

async function readErrorMessage(response: Response) {
  try {
    const body = await response.json();
    return body.message ?? body.error ?? `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}
