import type { AppRoute } from '../../types/navigation';
import { PurchaseDetailsView } from './PurchaseDetailsView';
type Props = { orderId: string | null; onNavigate: (route: AppRoute) => void; onOpenRefundReturn?: (orderId: string) => void; onOpenOrder?: (orderId: string) => void };
export function TrackingScreen({ onOpenRefundReturn, ...props }: Props) {
  return <PurchaseDetailsView {...props} variant="tracking" onOpenIssue={onOpenRefundReturn} />;
}
