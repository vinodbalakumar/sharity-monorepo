import type { AppRoute } from '../../types/navigation';
import { PurchaseDetailsView } from './PurchaseDetailsView';
type Props = { orderId: string | null; receiptId: string | null; onNavigate: (route: AppRoute) => void; onOpenOrder?: (orderId: string) => void; onOpenIssue?: (orderId: string) => void };
export function OrderReceiptScreen({ receiptId: _receiptId, ...props }: Props) {
  return <PurchaseDetailsView {...props} variant="receipt" />;
}
