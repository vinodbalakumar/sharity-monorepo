import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton, AppCard } from '../../components/ui';
import { InteriorShell } from '../../components/appShell';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type InvoiceScreenProps = {
  invoiceId: string;
  onNavigate: (screen: string) => void;
};

const mockInvoiceDetails = {
  id: 'INV-001',
  date: '2026-05-15',
  dueDate: '2026-06-15',
  status: 'paid' as 'paid' | 'pending' | 'overdue',
  paymentDate: '2026-05-20',
  amount: 299.99,
  description: 'Premium Plan - Monthly Subscription',
  items: [
    { description: 'Premium Plan (1 month)', quantity: 1, unitPrice: 299.99, total: 299.99 }
  ],
  subtotal: 299.99,
  tax: 0,
  discount: 0,
  total: 299.99,
  billTo: {
    name: 'John Doe',
    email: 'john@example.com',
    address: '123 Main St, Anytown, USA 12345'
  },
  from: {
    name: 'Sharity Inc.',
    email: 'billing@sharity.com',
    address: '456 Tech Ave, Silicon Valley, CA 94025'
  },
  notes: 'Thank you for your subscription!',
  paymentMethod: 'Visa ending in 4242'
};

export function InvoiceScreen({ invoiceId, onNavigate }: InvoiceScreenProps) {
  const invoice = mockInvoiceDetails;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'overdue':
        return colors.error;
      default:
        return colors.gray400;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'overdue':
        return 'alert-circle';
      default:
        return 'help-circle';
    }
  };

  return (
    <InteriorShell onNavigate={onNavigate} title="Invoice Details">
      <View>
        {/* Invoice Header */}
        <AppCard variant="elevated" padding="large" style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.invoiceNumber}>{invoice.id}</Text>
              <Text style={styles.invoiceDate}>{invoice.date}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(invoice.status) + '20' }
              ]}
            >
              <Ionicons
                name={getStatusIcon(invoice.status) as any}
                size={16}
                color={getStatusColor(invoice.status)}
              />
              <Text style={[styles.statusText, { color: getStatusColor(invoice.status) }]}>
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </Text>
            </View>
          </View>

          <View style={[styles.amountSection]}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <Text style={styles.amountValue}>${invoice.total.toFixed(2)}</Text>
          </View>

          {invoice.status === 'paid' && (
            <View style={styles.paidInfo}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.paidText}>Paid on {invoice.paymentDate}</Text>
            </View>
          )}
        </AppCard>

        {/* Bill To / From */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Billing Information</Text>
          <View style={styles.billingRow}>
            <AppCard variant="outlined" padding="medium" style={styles.billingCard}>
              <Text style={styles.billingLabel}>Bill To</Text>
              <Text style={styles.billingName}>{invoice.billTo.name}</Text>
              <Text style={styles.billingText}>{invoice.billTo.email}</Text>
              <Text style={styles.billingText}>{invoice.billTo.address}</Text>
            </AppCard>
            <AppCard variant="outlined" padding="medium" style={styles.billingCard}>
              <Text style={styles.billingLabel}>From</Text>
              <Text style={styles.billingName}>{invoice.from.name}</Text>
              <Text style={styles.billingText}>{invoice.from.email}</Text>
              <Text style={styles.billingText}>{invoice.from.address}</Text>
            </AppCard>
          </View>
        </View>

        {/* Line Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          <AppCard variant="outlined" padding="none">
            <View style={styles.itemHeader}>
              <Text style={[styles.itemHeaderText, { flex: 1 }]}>Description</Text>
              <Text style={[styles.itemHeaderText, { width: 60, textAlign: 'right' }]}>Qty</Text>
              <Text style={[styles.itemHeaderText, { width: 80, textAlign: 'right' }]}>Price</Text>
              <Text style={[styles.itemHeaderText, { width: 80, textAlign: 'right' }]}>Total</Text>
            </View>
            <View style={styles.itemDivider} />
            {invoice.items.map((item, index) => (
              <View key={index}>
                <View style={styles.itemRow}>
                  <Text style={[styles.itemText, { flex: 1 }]}>{item.description}</Text>
                  <Text style={[styles.itemText, { width: 60, textAlign: 'right' }]}>{item.quantity}</Text>
                  <Text style={[styles.itemText, { width: 80, textAlign: 'right' }]}>${item.unitPrice.toFixed(2)}</Text>
                  <Text style={[styles.itemText, { width: 80, textAlign: 'right' }]}>${item.total.toFixed(2)}</Text>
                </View>
              </View>
            ))}
            <View style={styles.itemDivider} />
            <View style={styles.summarySection}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>${invoice.subtotal.toFixed(2)}</Text>
              </View>
              {invoice.tax > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tax</Text>
                  <Text style={styles.summaryValue}>${invoice.tax.toFixed(2)}</Text>
                </View>
              )}
              {invoice.discount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.success }]}>Discount</Text>
                  <Text style={[styles.summaryValue, { color: colors.success }]}>-${invoice.discount.toFixed(2)}</Text>
                </View>
              )}
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>${invoice.total.toFixed(2)}</Text>
              </View>
            </View>
          </AppCard>
        </View>

        {/* Payment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <AppCard variant="outlined" padding="medium">
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Method</Text>
              <Text style={styles.detailValue}>{invoice.paymentMethod}</Text>
            </View>
            {invoice.status === 'paid' && (
              <>
                <View style={styles.detailDivider} />
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Payment Date</Text>
                  <Text style={styles.detailValue}>{invoice.paymentDate}</Text>
                </View>
              </>
            )}
            {invoice.status === 'pending' && (
              <>
                <View style={styles.detailDivider} />
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Due Date</Text>
                  <Text style={styles.detailValue}>{invoice.dueDate}</Text>
                </View>
              </>
            )}
          </AppCard>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <AppCard variant="outlined" padding="medium">
              <Text style={styles.notesText}>{invoice.notes}</Text>
            </AppCard>
          </View>
        )}

        {/* Actions */}
        {invoice.status === 'pending' && (
          <View style={styles.section}>
            <AppButton
              variant="primary"
              size="large"
              onPress={() => onNavigate('payment')}
            >
              Pay Now
            </AppButton>
          </View>
        )}

        <View style={styles.section}>
          <AppButton
            variant="secondary"
            size="large"
            onPress={() => {}}
          >
            Download PDF
          </AppButton>
        </View>
      </View>
    </InteriorShell>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    paddingHorizontal: 0,
    paddingVertical: 0
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg
  },
  invoiceNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary
  },
  invoiceDate: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600'
  },
  amountSection: {
    backgroundColor: colors.surfaceVariant,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.md
  },
  amountLabel: {
    fontSize: 14,
    color: colors.textSecondary
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
    marginTop: spacing.xs
  },
  paidInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  paidText: {
    fontSize: 13,
    color: colors.success,
    fontWeight: '500'
  },
  section: {
    gap: spacing.md
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary
  },
  billingRow: {
    flexDirection: 'row',
    gap: spacing.md
  },
  billingCard: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 0
  },
  billingLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: spacing.sm
  },
  billingName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  billingText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18
  },
  itemHeader: {
    flexDirection: 'row',
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md
  },
  itemHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase'
  },
  itemRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center'
  },
  itemText: {
    fontSize: 14,
    color: colors.textPrimary
  },
  itemDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md
  },
  summarySection: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textSecondary
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary
  },
  totalRow: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary
  },
  detailDivider: {
    height: 1,
    backgroundColor: colors.border
  },
  notesText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20
  }
});
