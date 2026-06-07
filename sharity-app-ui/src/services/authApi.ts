const authBaseUrl = process.env.EXPO_PUBLIC_AUTH_BASE_URL ?? '/authorization-server/api/v1/auth';

export type RegisterRequest = {
  appVersion?: string;
  countryCode: string;
  countryName: string;
  dateOfBirth?: string | null;
  detectedCountryCode?: string;
  detectedCountryName?: string;
  devicePlatform?: string;
  email: string;
  firstName?: string;
  gender?: string | null;
  installationId?: string;
  lastName?: string;
  locale?: string;
  password: string;
  phoneDialCode: string;
  phoneNumber: string;
  privacySetting?: string;
  termsAccepted?: boolean;
  timezone?: string;
  username?: string;
};

export type RegisterResponse = {
  emailVerificationRequired?: boolean;
  message?: string;
  publicId?: string;
};

export type SocialRegistrationSession = {
  displayName?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  provider: 'Google' | string;
};

export type RegistrationCountryOption = {
  countryCode: string;
  countryName: string;
  defaultCurrencyCode: string;
  phoneDialCode: string;
};

export type RegistrationGenderOption = {
  code: string;
  label: string;
};

export type RegistrationOptionsResponse = {
  countries: RegistrationCountryOption[];
  genders: RegistrationGenderOption[];
};

export type CompleteSocialRegistrationRequest = {
  countryCode: string;
  countryName: string;
  dateOfBirth: string;
  gender: string;
  locale?: string;
  phoneDialCode: string;
  phoneNumber: string;
  privacySetting: string;
  profileImageUrl?: string;
  termsAccepted: boolean;
  timezone?: string;
  username: string;
};

export type ProfileImageUploadResponse = {
  profileImageUrl: string;
};

export async function registerAccount(request: RegisterRequest): Promise<RegisterResponse> {
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

export function startSocialRegistration(provider: 'Google') {
  const providerPath = provider.toLowerCase();
  const startUrl = `${authBaseUrl}/social/${providerPath}/start?flow=register`;
  if (typeof window !== 'undefined') {
    window.location.assign(startUrl);
  }
}

export async function getSocialRegistrationSession(): Promise<SocialRegistrationSession> {
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

export async function getRegistrationOptions(): Promise<RegistrationOptionsResponse> {
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

export async function completeSocialRegistration(request: CompleteSocialRegistrationRequest): Promise<RegisterResponse> {
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

export async function uploadSocialProfileImage(file: File): Promise<ProfileImageUploadResponse> {
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

async function readErrorMessage(response: Response) {
  try {
    const body = await response.json();
    return body.message ?? body.error ?? `Registration failed (${response.status})`;
  } catch {
    return `Registration failed (${response.status})`;
  }
}
