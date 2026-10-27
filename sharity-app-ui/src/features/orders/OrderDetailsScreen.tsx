import type { AppRoute } from '../../types/navigation';
import { PurchaseDetailsView } from './PurchaseDetailsView';
type Props = { orderId: string | null; onNavigate: (route: AppRoute) => void; onOpenReceipt?: (orderId: string, receiptId: string) => void; onOpenTracking?: (orderId: string) => void; onOpenRefundReturn?: (orderId: string) => void; onOpenDispute?: (orderId: string) => void };
export function OrderDetailsScreen({ onOpenRefundReturn, ...props }: Props) {
  return <PurchaseDetailsView {...props} onOpenIssue={onOpenRefundReturn} />;
}
