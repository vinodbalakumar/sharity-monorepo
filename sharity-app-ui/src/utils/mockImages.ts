const PLACEHOLDER_BASE = 'https://placehold.co';
const BRAND = '1D9E75';
const FOREGROUND = 'FFFFFF';

function initialsFromKey(key: string) {
  return key
    .replace(/\.[^.]+$/, '')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2) || 'S';
}

export function resolveMockImageUrl(source?: string | null, size = 120) {
  if (!source) {
    return `${PLACEHOLDER_BASE}/${size}x${size}/${BRAND}/${FOREGROUND}?text=S`;
  }

  if (source.startsWith('http://') || source.startsWith('https://') || source.startsWith('data:')) {
    return source;
  }

  if (source.startsWith('marketplace/placeholders/')) {
    const key = source.slice('marketplace/placeholders/'.length);
    return `${PLACEHOLDER_BASE}/${size}x${size}/${BRAND}/${FOREGROUND}?text=${encodeURIComponent(initialsFromKey(key))}`;
  }

  if (source.startsWith('/')) {
    return source;
  }

  return `/${source}`;
}

export function placeholderImageUrl(name: string, size = 120) {
  return resolveMockImageUrl(`marketplace/placeholders/${name}.png`, size);
}
