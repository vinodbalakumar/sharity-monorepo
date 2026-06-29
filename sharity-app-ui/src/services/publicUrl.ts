const UNSAFE_HOST_PATTERNS = [
  '://localhost',
  '://127.0.0.1',
  '://[::1]',
  '://host.docker.internal',
  '://10.',
  '://192.168.',
  '://172.16.',
  '://172.17.',
  '://172.18.',
  '://172.19.',
  '://172.20.',
  '://172.21.',
  '://172.22.',
  '://172.23.',
  '://172.24.',
  '://172.25.',
  '://172.26.',
  '://172.27.',
  '://172.28.',
  '://172.29.',
  '://172.30.',
  '://172.31.'
];

export function resolvePublicBaseUrl(rawValue: string | undefined, fallbackValue: string): string {
  const value = rawValue?.trim();
  if (!value) {
    return fallbackValue;
  }

  if (value.startsWith('/')) {
    return value.replace(/\/+$/, '');
  }

  if (!/^https?:\/\//i.test(value)) {
    return fallbackValue;
  }

  const normalized = value.replace(/\/+$/, '');
  const lower = normalized.toLowerCase();
  if (UNSAFE_HOST_PATTERNS.some((pattern) => lower.includes(pattern))) {
    return fallbackValue;
  }

  return normalized;
}
