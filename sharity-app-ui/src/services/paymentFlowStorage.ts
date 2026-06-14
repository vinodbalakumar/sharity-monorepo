import { appStorage } from '../storage/storage';

const paymentFlowContextKey = 'paymentFlowContext';

export type PaymentFlowContext = {
  checkoutId?: string;
  provider?: string;
  status?: string;
};

export function readPaymentFlowContext(): PaymentFlowContext {
  const raw = appStorage.getString(paymentFlowContextKey);
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as PaymentFlowContext;
  } catch {
    return {};
  }
}

export function writePaymentFlowContext(update: PaymentFlowContext): void {
  const current = readPaymentFlowContext();
  const next = {
    ...current,
    ...update
  };

  appStorage.setString(paymentFlowContextKey, JSON.stringify(next));
}

