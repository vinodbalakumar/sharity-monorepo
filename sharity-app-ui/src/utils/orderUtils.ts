export function getOrderStatusColor(status: string): string {
  switch (status?.toUpperCase()) {
    case 'PROCESSING':
    case 'PENDING':
      return '$orange10';
    case 'CONFIRMED':
    case 'ACCEPTED':
      return '$blue10';
    case 'SHIPPED':
    case 'IN_TRANSIT':
      return '$blue10';
    case 'DELIVERED':
    case 'COMPLETED':
      return '$green10';
    case 'REFUND_REQUESTED':
    case 'REFUND_PROCESSING':
      return '$orange10';
    case 'REFUNDED':
      return '$green10';
    case 'DISPUTED':
    case 'UNDER_REVIEW':
      return '$orange10';
    case 'CANCELLED':
    case 'REJECTED':
      return '$red10';
    default:
      return '$gray10';
  }
}

export function getOrderStatusLabel(status: string): string {
  return status?.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()) ?? 'Unknown';
}

export function isOrderCompletable(orderStatus: string): boolean {
  return ['DELIVERED', 'COMPLETED'].includes(orderStatus?.toUpperCase());
}

export function canRequestRefund(orderStatus: string, refundStatus: string | null): boolean {
  const completableStatuses = ['DELIVERED', 'COMPLETED', 'SHIPPED', 'IN_TRANSIT'];
  return completableStatuses.includes(orderStatus?.toUpperCase()) && !refundStatus;
}

export function canInitiateDispute(refundStatus: string | null, disputeStatus: string | null): boolean {
  return !!refundStatus && !disputeStatus;
}

export function canTrackOrder(orderStatus: string): boolean {
  const trackableStatuses = ['PROCESSING', 'CONFIRMED', 'ACCEPTED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'];
  return trackableStatuses.includes(orderStatus?.toUpperCase());
}

export function getPaymentStatusIcon(status: string): 'checkmark-circle' | 'alert-circle' | 'time-outline' | 'close-circle' {
  switch (status?.toUpperCase()) {
    case 'PAID':
    case 'AUTHORIZED':
      return 'checkmark-circle';
    case 'FAILED':
    case 'CANCELLED':
      return 'close-circle';
    case 'PENDING':
    case 'PROCESSING':
      return 'time-outline';
    default:
      return 'alert-circle';
  }
}

export function isPaymentAuthorized(paymentStatus: string): boolean {
  return ['PAID', 'AUTHORIZED', 'CAPTURED'].includes(paymentStatus?.toUpperCase());
}
