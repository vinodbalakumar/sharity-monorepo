const ASSET_PUBLIC_BASE_URL = process.env.EXPO_PUBLIC_ASSET_PUBLIC_BASE_URL ?? '';

export function resolveMockImageUrl(source?: string | null, size = 120) {
  if (!source) {
    return placeholderImageUrl('S', size);
  }

  const trimmedSource = source.trim();
  // A data URI contains a comma; do not treat it as a list of image keys.
  if (trimmedSource.startsWith('data:image/')) return trimmedSource;
  if (trimmedSource.includes(',')) {
    const firstSource = trimmedSource.split(',').map((item) => item.trim()).find(Boolean);
    if (firstSource) {
      return resolveMockImageUrl(firstSource, size);
    }
  }

  if (trimmedSource.startsWith('http://') || trimmedSource.startsWith('https://') || trimmedSource.startsWith('data:')) {
    return trimmedSource;
  }

  if (trimmedSource.startsWith('/')) {
    return trimmedSource;
  }

  if (trimmedSource.startsWith('marketplace/') && ASSET_PUBLIC_BASE_URL) {
    return `${ASSET_PUBLIC_BASE_URL.replace(/\/+$/, '')}/${trimmedSource}`;
  }

  if (trimmedSource.startsWith('marketplace/')) {
    return trimmedSource;
  }

  return `/${trimmedSource}`;
}

export function placeholderImageUrl(name: string, size = 120) {
  const initials = name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || 'S';
  const dimension = Math.min(512, Math.max(24, size));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${dimension}" height="${dimension}" viewBox="0 0 120 120"><rect width="120" height="120" rx="20" fill="#edf2fc"/><text x="60" y="70" text-anchor="middle" font-family="Arial,sans-serif" font-size="32" font-weight="600" fill="#2459d3">${initials}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
