import { InteriorShell } from '../../components/appShell';
import type { AppRoute } from '../../types/navigation';
import { MarketplaceCatalog } from './MarketplaceCatalog';

type Props = { onNavigate: (route: AppRoute) => void; onOpenListing: (id: string) => void };
function Catalog({ onNavigate, onOpenListing, title, vertical }: Props & { title: string; vertical: string }) {
  return <InteriorShell activeLabel="Marketplace" onNavigate={onNavigate} title={title}>
    <MarketplaceCatalog title={title} vertical={vertical} onNavigate={onNavigate} onOpenProduct={onOpenListing} />
  </InteriorShell>;
}
export function DigitalMarketplaceListingsScreen(props: Props) {
  return <Catalog {...props} title="Digital discoveries" vertical="MARKETPLACE" />;
}
export function JewelryMarketplaceListingsScreen(props: Props) {
  return <Catalog {...props} title="Jewellery & accessories" vertical="JEWELLERY" />;
}
export function ElectronicsMarketplaceHomeScreen({ onNavigate, onOpenProduct }: { onNavigate: Props['onNavigate']; onOpenProduct: Props['onOpenListing'] }) {
  return <Catalog onNavigate={onNavigate} onOpenListing={onOpenProduct} title="Electronics & gadgets" vertical="ELECTRONICS" />;
}
