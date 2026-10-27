import { useEffect, useState } from 'react';
import { adminService } from '../../shared/api/adminService.js';
import { Alert, Button, Card, LoadingState } from '../../shared/components/Ui.jsx';

const descriptions = {
  BEST_SELLING: 'Ranks available products by confirmed orders across all time.',
  TRENDING: 'Ranks available products by confirmed orders in the last 7 days.',
  RECENTLY_VIEWED: 'Products opened by this shopper, saved on their device for 30 days. Shoppers can clear their history.',
  RECOMMENDED_DEALS: 'Discounted products in the shopper’s recently viewed categories.',
  FLASH_DEALS: 'Selected discounted products, visible only during your campaign window.',
  ALL_PRODUCTS: 'The complete catalog, including search and category filters.',
};
const localDate = value => value ? new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';
export function StorefrontPage() {
  const [sections, setSections] = useState(null);
  const [products, setProducts] = useState([]);
  const [draft, setDraft] = useState({ listingIds: [], startsAt: '', endsAt: '' });
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const load = async () => {
    setError('');
    try {
      const rows = await adminService.storefrontSections();
      if (!Array.isArray(rows)) throw new Error();
      setSections(rows);
      const flash = rows.find(s => s.code === 'FLASH_DEALS');
      if (flash) setDraft({ listingIds: flash.listingIds, startsAt: localDate(flash.startsAt), endsAt: localDate(flash.endsAt) });
    } catch { setError('Unable to load storefront settings. Please try again.'); }
    try { const listings = await adminService.storefrontProducts(); setProducts(Array.isArray(listings) ? listings : []); } catch { setProducts([]); }
  };
  useEffect(() => { void load(); }, []);
  const save = async (section, campaign) => {
    setBusy(section.code); setError(''); setMessage('');
    const payload = campaign ? { enabled: section.enabled, listingIds: draft.listingIds, startsAt: draft.startsAt ? new Date(draft.startsAt).toISOString() : null, endsAt: draft.endsAt ? new Date(draft.endsAt).toISOString() : null }
      : { enabled: !section.enabled, listingIds: section.listingIds, startsAt: section.startsAt, endsAt: section.endsAt };
    try {
      const saved = await adminService.updateStorefrontSection(section.code, payload);
      setSections(rows => rows.map(s => s.code === saved.code ? saved : s));
      setMessage(`${section.title} ${campaign ? 'campaign saved' : saved.enabled ? 'enabled' : 'disabled'}.`);
    } catch { setError('Changes were not saved. Check that campaign dates are valid and selected products are discounted and available, then try again.'); }
    finally { setBusy(''); }
  };
  const deals = products.filter(p => p.stockQuantity > 0 && p.originalPriceAmount > p.priceAmount && !['SOLD', 'REMOVED', 'INACTIVE'].includes(p.listingStatus));
  const flash = sections?.find(s => s.code === 'FLASH_DEALS');
  return <div className="page-stack storefront-settings">
    <div className="section-head"><div><h1>Storefront</h1><p>Choose the collections shoppers see on your main pages.</p></div><a className="btn btn-secondary" href="/app/home" target="_blank" rel="noreferrer">Open storefront</a></div>
    <Card><strong>Enabled sections appear when products are available</strong><p>Empty collections are hidden automatically. Rankings use confirmed order data; demo orders count in the demo environment. Updates apply when shoppers open or return to the page.</p></Card>
    {error && <div role="alert"><Alert type="error">{error}</Alert>{!sections && <Button onClick={load}>Retry</Button>}</div>}
    {message && <div role="status"><Alert>{message}</Alert></div>}
    {!sections && !error && <LoadingState label="Loading storefront settings" />}
    <div className="storefront-section-grid">{sections?.map(section => <Card key={section.code}>
      <div className="storefront-section-heading"><h2>{section.title}</h2><label className="storefront-switch"><input type="checkbox" role="switch" aria-label={`${section.title} enabled`} checked={section.enabled} disabled={!!busy} onChange={() => save(section, false)} /><span aria-hidden="true" /></label></div>
      <p>{descriptions[section.code]}</p><small>{section.enabled ? 'Enabled · hidden when empty' : 'Disabled · hidden from shoppers'}</small>
    </Card>)}</div>
    {flash && <Card><h2>Flash Deals campaign</h2><p>Select up to 12 available discounted products. Dates use your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone}). No products or an inactive schedule means this section stays hidden.</p>
      <form onSubmit={event => { event.preventDefault(); void save(flash, true); }}>
        <div className="storefront-dates"><label className="field"><span>Starts</span><input aria-label="Campaign starts" type="datetime-local" required={draft.listingIds.length > 0} value={draft.startsAt} onChange={e => setDraft(v => ({ ...v, startsAt: e.target.value }))} /></label>
        <label className="field"><span>Ends</span><input aria-label="Campaign ends" type="datetime-local" min={draft.startsAt || undefined} required={draft.listingIds.length > 0 || !!draft.startsAt} value={draft.endsAt} onChange={e => setDraft(v => ({ ...v, endsAt: e.target.value }))} /></label></div>
        <fieldset className="storefront-deals"><legend>Discounted products · {draft.listingIds.length}/12 selected</legend>
          {!deals.length && <p>No eligible discounted products are available.</p>}
          {[...new Set([...draft.listingIds, ...deals.map(p => p.publicId)])].map(id => { const product = deals.find(p => p.publicId === id); return <label key={id}><input type="checkbox" checked={draft.listingIds.includes(id)} disabled={!!busy || (!draft.listingIds.includes(id) && draft.listingIds.length >= 12)} onChange={e => setDraft(v => ({ ...v, listingIds: e.target.checked ? [...v.listingIds, id] : v.listingIds.filter(value => value !== id) }))} /><span>{product ? `${product.title} · ${product.currencyCode} ${Number(product.priceAmount).toFixed(2)}` : `Unavailable product (${id}) — remove before enabling`}</span></label>; })}
        </fieldset><Button type="submit" disabled={!!busy}>{busy === 'FLASH_DEALS' ? 'Saving…' : 'Save campaign'}</Button>
      </form>
    </Card>}
  </div>;
}
