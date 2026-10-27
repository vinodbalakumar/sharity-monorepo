import { appStorage } from '../storage/storage';
import type { MarketplaceListing } from '../types/marketplace';

export type StorefrontSection = {
  code: string; title: string; enabled: boolean; position: number;
  listingIds: string[]; startsAt: string | null; endsAt: string | null;
};
type Viewed = { id: string; at: number };
const historyKey = (scope: string) => `sharity_viewed_v1_${encodeURIComponent(scope)}`;
export function recentViews(scope: string): Viewed[] {
  try {
    const value: unknown = JSON.parse(appStorage.getString(historyKey(scope)) || '[]');
    return Array.isArray(value) ? value.filter((v): v is Viewed =>
      v && typeof v.id === 'string' && Number.isFinite(v.at) && v.at <= Date.now() && v.at > Date.now() - 30 * 86400000).slice(0, 20) : [];
  } catch { return []; }
}
export function rememberProduct(id: string, scope: string) {
  appStorage.setString(historyKey(scope), JSON.stringify([{ id, at: Date.now() }, ...recentViews(scope).filter(v => v.id !== id)].slice(0, 20)));
}
export function clearRecentViews(scope: string) { appStorage.remove(historyKey(scope)); }
export function sectionProducts(section: StorefrontSection, items: MarketplaceListing[], scope: string, now: number) {
  if (!section.enabled) return [];
  const available = items.filter(p => p.stockQuantity !== 0 && !['SOLD', 'INACTIVE', 'REMOVED'].includes(p.listingStatus));
  const viewed = recentViews(scope).map(v => v.id);
  const byIds = (ids: string[]) => ids.map(id => available.find(p => p.publicId === id)).filter((p): p is MarketplaceListing => !!p).slice(0, 8);
  if (section.code === 'RECENTLY_VIEWED') return byIds(viewed);
  if (section.code === 'RECOMMENDED_DEALS') {
    const categories = new Set(items.filter(p => viewed.includes(p.publicId)).map(p => p.categoryCode));
    return available.filter(p => categories.has(p.categoryCode) && !viewed.includes(p.publicId) && (p.originalPriceAmount ?? 0) > p.priceAmount).slice(0, 8);
  }
  if (section.code === 'FLASH_DEALS' && (!section.startsAt || !section.endsAt || Date.parse(section.startsAt) > now || Date.parse(section.endsAt) <= now)) return [];
  return byIds(section.listingIds).filter(p => section.code !== 'FLASH_DEALS' || (p.originalPriceAmount ?? 0) > p.priceAmount);
}
