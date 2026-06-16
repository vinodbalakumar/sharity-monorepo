const PLACEHOLDER_BASE = 'https://placehold.co';
const BRAND = '1D9E75';
const FOREGROUND = 'FFFFFF';
export function resolveMockImageUrl(source, size = 120) {
    if (!source) {
        return `${PLACEHOLDER_BASE}/${size}x${size}/${BRAND}/${FOREGROUND}?text=S`;
    }
    const trimmedSource = source.trim();
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
    return `/${trimmedSource}`;
}
export function placeholderImageUrl(name, size = 120) {
    return `${PLACEHOLDER_BASE}/${size}x${size}/${BRAND}/${FOREGROUND}?text=${encodeURIComponent(name.slice(0, 2).toUpperCase())}`;
}
