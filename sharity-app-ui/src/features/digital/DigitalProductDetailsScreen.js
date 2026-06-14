import { ProductDetailsScreen } from '../products/ProductDetailsScreen';
export function DigitalProductDetailsScreen({ listingPublicId, onNavigate }) {
    return <ProductDetailsScreen mode="digital" onNavigate={onNavigate} productId={listingPublicId}/>;
}
