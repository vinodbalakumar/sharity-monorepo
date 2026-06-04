import { ProductDetailsScreen } from '../products/ProductDetailsScreen';
import type { AppRoute } from '../../types/navigation';

type DigitalProductDetailsScreenProps = {
  listingPublicId: string | null;
  onNavigate: (route: AppRoute) => void;
};

export function DigitalProductDetailsScreen({ listingPublicId, onNavigate }: DigitalProductDetailsScreenProps) {
  return <ProductDetailsScreen mode="digital" onNavigate={onNavigate} productId={listingPublicId} />;
}
