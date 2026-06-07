import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton, AppCard } from '../../components/ui';
import { InteriorShell } from '../../components/appShell';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type BillingScreenProps = {
  onNavigate: (screen: string) => void;
};

type Invoice = {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  description: string;
};

const mockInvoices: Invoice[] = [
  { id: 'INV-001', date: '2026-05-15', amount: 299.99, status: 'paid', description: 'Premium Plan - Monthly' },
  { id: 'INV-002', date: '2026-04-15', amount: 299.99, status: 'paid', description: 'Premium Plan - Monthly' },
  { id: 'INV-003', date: '2026-03-15', amount: 299.99, status: 'paid', description: 'Premium Plan - Monthly' },
  { id: 'INV-004', date: '2026-06-15', amount: 299.99, status: 'pending', description: 'Premium Plan - Monthly' }
];

export function BillingScreen({ onNavigate }: BillingScreenProps) {
  const paidInvoices = mockInvoices.filter(inv => inv.status === 'paid');
  const pendingInvoices = mockInvoices.filter(inv => inv.status === 'pending');
  const totalSpent = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <InteriorShell onNavigate={onNavigate} title="Billing & Payments" subtitle="Manage your invoices and payment methods">
      <View>
        {/* Summary Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Summary</Text>
          <AppCard variant="elevated" padding="large" style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.summaryLabel}>Total Spent</Text>
                <Text style={styles.summaryAmount}>${totalSpent.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.summaryLabel}>Active Invoices</Text>
                <Text style={styles.summaryAmount}>{pendingInvoices.length}</Text>
              </View>
            </View>
          </AppCard>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <AppCard variant="outlined" padding="medium">
            <View style={styles.paymentMethodRow}>
              <View style={styles.cardIcon}>
                <Ionicons name="card" size={24} color={colors.primary} />
              </View>
              <View style={styles.cardDetails}>
                <Text style={styles.cardLabel}>Visa ending in 4242</Text>
                <Text style={styles.cardSubtext}>Expires 12/2026</Text>
              </View>
              <Pressable style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit</Text>
              </Pressable>
            </View>
          </AppCard>
          <AppButton
            variant="secondary"
            size="large"
            style={{ marginTop: spacing.md }}
          >
            Add Payment Method
          </AppButton>
        </View>

        {/* Invoices */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Invoices</Text>

          {pendingInvoices.length > 0 && (
            <View style={styles.subsection}>
              <Text style={styles.subheading}>Pending ({pendingInvoices.length})</Text>
              {pendingInvoices.map((invoice) => (
                <InvoiceRow key={invoice.id} invoice={invoice} onNavigate={onNavigate} />
              ))}
            </View>
          )}

          {paidInvoices.length > 0 && (
            <View style={styles.subsection}>
              <Text style={styles.subheading}>Paid ({paidInvoices.length})</Text>
              {paidInvoices.slice(0, 3).map((invoice) => (
                <InvoiceRow key={invoice.id} invoice={invoice} onNavigate={onNavigate} />
              ))}
              {paidInvoices.length > 3 && (
                <Pressable style={styles.viewMoreButton}>
                  <Text style={styles.viewMoreText}>View all invoices ({paidInvoices.length})</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>

        {/* Billing Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Billing Settings</Text>
          <AppCard variant="outlined" padding="medium">
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Auto-renew subscription</Text>
              <Text style={styles.toggleIndicator}>●</Text>
            </View>
          </AppCard>
          <AppCard variant="outlined" padding="medium" style={{ marginTop: spacing.md }}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Email receipts</Text>
              <Text style={styles.toggleIndicator}>●</Text>
            </View>
          </AppCard>
        </View>

        {/* Danger Zone */}
        <View style={[styles.section, styles.dangerZone]}>
          <Text style={styles.sectionTitle}>Cancel Subscription</Text>
          <Text style={styles.dangerText}>
            Canceling your subscription will remove access to premium features. You can reactivate anytime.
          </Text>
          <AppButton
            variant="danger"
            size="large"
            style={{ marginTop: spacing.md }}
          >
            Cancel Subscription
          </AppButton>
        </View>
      </View>
    </InteriorShell>
  );
}

function InvoiceRow({ invoice, onNavigate }: { invoice: Invoice; onNavigate: (screen: string) => void }) {
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
    <Pressable
      onPress={() => onNavigate(`invoice-${invoice.id}`)}
      style={({ pressed }) => [
        styles.invoiceRow,
        { opacity: pressed ? 0.7 : 1 }
      ]}
    >
      <View style={styles.invoiceContent}>
        <View>
          <Text style={styles.invoiceId}>{invoice.id}</Text>
          <Text style={styles.invoiceDesc}>{invoice.description}</Text>
        </View>
        <Text style={styles.invoiceDate}>{invoice.date}</Text>
      </View>
      <View style={styles.invoiceRight}>
        <Text style={styles.invoiceAmount}>${invoice.amount.toFixed(2)}</Text>
        <View style={[styles.invoiceStatus, { borderLeftColor: getStatusColor(invoice.status) }]}>
          <Ionicons
            name={getStatusIcon(invoice.status) as any}
            size={16}
            color={getStatusColor(invoice.status)}
          />
          <Text style={[styles.invoiceStatusText, { color: getStatusColor(invoice.status) }]}>
            {invoice.status}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary
  },
  subsection: {
    gap: spacing.sm
  },
  subheading: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm
  },
  summaryCard: {
    paddingHorizontal: 0,
    paddingVertical: 0
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary
  },
  summaryDivider: {
    width: 1,
    height: 50,
    backgroundColor: colors.border
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardDetails: {
    flex: 1
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary
  },
  cardSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs
  },
  editButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm
  },
  invoiceContent: {
    flex: 1
  },
  invoiceId: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary
  },
  invoiceDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs
  },
  invoiceDate: {
    fontSize: 12,
    color: colors.textSecondary
  },
  invoiceRight: {
    alignItems: 'flex-end',
    gap: spacing.sm
  },
  invoiceAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary
  },
  invoiceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingLeft: spacing.sm,
    borderLeftWidth: 2
  },
  invoiceStatusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize'
  },
  viewMoreButton: {
    paddingVertical: spacing.md,
    alignItems: 'center'
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md
  },
  settingLabel: {
    fontSize: 14,
    color: colors.textPrimary
  },
  toggleIndicator: {
    fontSize: 18,
    color: colors.success
  },
  dangerZone: {
    paddingBottom: spacing.lg * 2
  },
  dangerText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20
  }
});
