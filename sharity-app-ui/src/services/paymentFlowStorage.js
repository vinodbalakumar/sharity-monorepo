import { appStorage } from '../storage/storage';
const paymentFlowContextKey = 'paymentFlowContext';
export function readPaymentFlowContext() {
    const raw = appStorage.getString(paymentFlowContextKey);
    if (!raw) {
        return {};
    }
    try {
        return JSON.parse(raw);
    }
    catch {
        return {};
    }
}
export function writePaymentFlowContext(update) {
    const current = readPaymentFlowContext();
    const next = {
        ...current,
        ...update
    };
    appStorage.setString(paymentFlowContextKey, JSON.stringify(next));
}
