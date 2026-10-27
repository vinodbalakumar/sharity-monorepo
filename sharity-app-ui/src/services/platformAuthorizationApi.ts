import { getBffCsrfToken } from './sessionService';
import { resolvePublicBaseUrl } from './publicUrl';

const platformAuthBaseUrl = resolvePublicBaseUrl(process.env.EXPO_PUBLIC_AUTH_BASE_URL, '/bff/api/authorization-server/api/v1');

export type ProviderEnrollment = {
  moduleCode: string;
  moduleName: string;
  enrollmentStatus: string;
  sellingEnabled: boolean;
  serviceEnabled: boolean;
  payoutEligible: boolean;
  disabledReason?: string | null;
};

export type ProviderAccount = {
  publicId: string;
  displayName: string;
  providerType: string;
  sellerScope: 'GLOBAL' | 'NATIONAL';
  countryCode: string;
  defaultCurrencyCode: string;
  verificationStatus: string;
  overallStatus: string;
  payoutsEnabled: boolean;
  chargesEnabled: boolean;
  enrollments: ProviderEnrollment[];
};

export type ModuleAccess = {
  providerPublicId: string;
  moduleCode: string;
  accessType: string;
  accessStatus: string;
};

export type Capability = {
  customer: boolean;
  hasProviderAccess: boolean;
  roles: string[];
  providerModules: ModuleAccess[];
};

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${platformAuthBaseUrl}${path}`, {
    credentials: 'include'
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return response.json() as Promise<T>;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
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
  return response.json() as Promise<T>;
}

export function getMyProviderAccounts(): Promise<ProviderAccount[]> {
  return getJson<ProviderAccount[]>('/users/me/provider-accounts');
}

export function getMyCapabilities(): Promise<Capability> {
  return getJson<Capability>('/users/me/capabilities');
}

export function getMyModules(): Promise<{ moduleCode: string; moduleName: string; status: string; displayOrder: number; providerAccessEnabled: boolean; requiresProviderApproval: boolean; availableToCustomer: boolean; providerAccessActive: boolean }[]> {
  return getJson<{ moduleCode: string; moduleName: string; status: string; displayOrder: number; providerAccessEnabled: boolean; requiresProviderApproval: boolean; availableToCustomer: boolean; providerAccessActive: boolean }[]>('/users/me/modules');
}

export function createProviderAccount(request: {
  displayName: string;
  providerType: 'INDIVIDUAL' | 'BUSINESS' | 'LICENSED_BUSINESS' | 'DELIVERY_PARTNER';
  sellerScope: 'GLOBAL' | 'NATIONAL';
  countryCode: string;
  defaultCurrencyCode: string;
}): Promise<ProviderAccount> {
  return postJson<ProviderAccount>('/users/me/provider-accounts', request);
}

export function enrollProviderModule(providerPublicId: string, moduleCode: string): Promise<ProviderAccount> {
  return postJson<ProviderAccount>(`/users/me/provider-accounts/${providerPublicId}/modules/${moduleCode}/enroll`, {});
}

async function readErrorMessage(response: Response) {
  try {
    const body = await response.json();
    return body.message ?? body.error ?? `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}
