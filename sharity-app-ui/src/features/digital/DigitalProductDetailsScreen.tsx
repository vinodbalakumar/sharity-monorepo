import { ProductDetailsScreen } from '../products/ProductDetailsScreen';
import type { AppRoute } from '../../types/navigation';

type DigitalProductDetailsScreenProps = {
  onOpenProduct?: (id:string)=>void;
  listingPublicId: string | null;
  onNavigate: (route: AppRoute) => void;
};

export function DigitalProductDetailsScreen({ listingPublicId, onNavigate, onOpenProduct }: DigitalProductDetailsScreenProps) {
  return <ProductDetailsScreen onOpenProduct={onOpenProduct} mode="digital" onNavigate={onNavigate} productId={listingPublicId} />;
}
