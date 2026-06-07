export type VisitorContextResponse = {
  availablePolicyCodes: string[];
  countryCode: string;
  countryName: string;
  countrySupported: boolean;
  detectionSource: string;
  locale: string;
};

export type PublicContentSection = {
  heading: string;
  paragraphs: string[];
};

export type PublicContentPageResponse = {
  category: string;
  countryCode: string;
  effectiveDate: string;
  lastReviewedAt: string;
  locale: string;
  sections: PublicContentSection[];
  slug: string;
  title: string;
  version: string;
};

const publicBaseUrl = process.env.EXPO_PUBLIC_BFF_PUBLIC_BASE_URL ?? '';
const requestTimeoutMs = 6000;

async function getJson<T>(path: string): Promise<T> {
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

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getVisitorContext(): Promise<VisitorContextResponse> {
  return getJson<VisitorContextResponse>('/bff/public/context');
}

export async function getPublicContentPage(slug: string, countryCode?: string, locale?: string): Promise<PublicContentPageResponse> {
  const params = new URLSearchParams();
  if (countryCode) {
    params.set('countryCode', countryCode);
  }
  if (locale) {
    params.set('locale', locale);
  }
  const query = params.toString();
  return getJson<PublicContentPageResponse>(`/bff/public/content/pages/${encodeURIComponent(slug)}${query ? `?${query}` : ''}`);
}
