import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AppBadge,
  AppButton,
  AppCard,
  AppCheckbox,
  AppDivider,
  AppLoadingIndicator,
  AppRadioButton,
  AppSnackbar,
  AppTextInput
} from '../../components/ui';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { colors, radii, spacing, typography } from '../../theme';
import type { AppRoute } from '../../types/navigation';
import {
  acknowledgePolicies,
  prepareCheckout,
  selectPaymentMethod,
  startPayment
} from './checkoutMockApi';
import type { CheckoutOrderGroup, CheckoutResponse, PaymentMethod, ShippingAddress } from './checkoutTypes';

type CheckoutScreenProps = {
  onNavigate: (route: AppRoute) => void;
};

type AddressFormState = Omit<ShippingAddress, 'id'>;

const emptyAddress: AddressFormState = {
  addressLine1: '',
  addressLine2: '',
  city: '',
  country: 'USA',
  deliveryInstructions: '',
  fullName: '',
  phoneNumber: '',
  postalCode: '',
  state: ''
};

export function CheckoutScreen({ onNavigate }: CheckoutScreenProps) {
  const { isDesktop, isMobile, isTablet } = useResponsiveLayout();
  const [checkout, setCheckout] = useState<CheckoutResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('PAYPAL');
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [address, setAddress] = useState<AddressFormState>(emptyAddress);

  const loadCheckout = useCallback(async () => {
    setError(false);
    setLoading(true);
    try {
      const response = await prepareCheckout({
        cartId: 'cart-001',
        couponCode: 'SHARITY10',
        selectedPaymentMethod
      });
      setCheckout(response);
      if (response.shippingAddress) {
        const { id, ...addressWithoutId } = response.shippingAddress;
        void id;
        setAddress(addressWithoutId);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [selectedPaymentMethod]);

  useEffect(() => {
    loadCheckout();
  }, [loadCheckout]);

  const hasDigital = useMemo(() => checkout?.orderGroups.some((group) => !group.shippingRequired) ?? false, [checkout]);
  const hasElectronics = useMemo(() => checkout?.orderGroups.some((group) => group.shippingRequired) ?? false, [checkout]);
  const needsSeparateOrderWarning = useMemo(() => {
    if (!checkout) {
      return false;
    }
    const sellers = new Set(checkout.orderGroups.map((group) => group.sellerId));
    const marketplaces = new Set(checkout.orderGroups.map((group) => group.marketplaceCode));
    return sellers.size > 1 || marketplaces.size > 1 || (hasDigital && hasElectronics);
  }, [checkout, hasDigital, hasElectronics]);

  async function completeCheckout() {
    if (!checkout) {
      return;
    }
    if (checkout.shippingRequired && !addressIsValid(address)) {
      setSnackbarMessage('Shipping address is required for electronics products.');
      return;
    }
    if (!acknowledged) {
      setSnackbarMessage('Please confirm that you understand the refund, return, and digital access rules.');
      return;
    }

    await selectPaymentMethod(checkout.checkoutId, selectedPaymentMethod);
    await acknowledgePolicies(checkout.checkoutId, acknowledged, acknowledged);
    const payment = await startPayment(checkout.checkoutId, selectedPaymentMethod);
    setSnackbarMessage(`Mock ${payment.provider} payment session ready. Real provider redirect will be integrated later.`);
    onNavigate('paymentSuccess');
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <Header onNavigate={onNavigate} />
        <View style={styles.centerState}>
          <AppLoadingIndicator />
          <Text style={styles.bodyText}>Preparing checkout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.screen}>
        <Header onNavigate={onNavigate} />
        <View style={styles.centerState}>
          <Text style={styles.pageTitle}>Unable to prepare checkout. Please try again.</Text>
          <AppButton onPress={loadCheckout}>Retry</AppButton>
        </View>
      </SafeAreaView>
    );
  }

  if (!checkout?.orderGroups.length) {
    return (
      <SafeAreaView style={styles.screen}>
        <Header onNavigate={onNavigate} />
        <View style={styles.centerState}>
          <Text style={styles.pageTitle}>No items available for checkout.</Text>
          <AppButton onPress={() => onNavigate('cart')}>Go to Cart</AppButton>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.shell}>
        {isDesktop ? <CheckoutSidebar onNavigate={onNavigate} /> : null}
        <View style={styles.main}>
          <Header onNavigate={onNavigate} />
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={[styles.layout, (isMobile || isTablet) && styles.layoutSingle]}>
              <View style={styles.stepsColumn}>
                <CheckoutStepHeader />
                {needsSeparateOrderWarning ? <SeparateOrderWarningCard message={checkout.warnings[0]?.message} /> : null}
                <CheckoutOrderGroupCard groups={checkout.orderGroups} />
                {checkout.shippingRequired ? <ShippingAddressCard address={address} onChangeAddress={setAddress} /> : null}
                {hasDigital ? <DigitalAccessRuleCard rules={checkout.digitalAccessRules} /> : null}
                <RefundReturnPolicyCard
                  acknowledged={acknowledged}
                  onToggleAcknowledged={() => setAcknowledged((current) => !current)}
                  rules={checkout.refundReturnRules}
                />
                <PaymentMethodCard
                  methods={checkout.availablePaymentMethods}
                  onSelect={setSelectedPaymentMethod}
                  selectedPaymentMethod={selectedPaymentMethod}
                />
                <ReviewOrderStep
                  acknowledged={acknowledged}
                  checkout={checkout}
                  hasDigital={hasDigital}
                  hasElectronics={hasElectronics}
                  selectedPaymentMethod={selectedPaymentMethod}
                />
                {!isDesktop ? <CheckoutSummaryCard checkout={checkout} hasDigital={hasDigital} hasElectronics={hasElectronics} /> : null}
                {!isDesktop ? (
                  <AppButton onPress={() => onNavigate('cart')} variant="outline">
                    Back to Cart
                  </AppButton>
                ) : null}
              </View>
              {isDesktop ? (
                <View style={styles.summaryColumn}>
                  <CheckoutSummaryCard checkout={checkout} hasDigital={hasDigital} hasElectronics={hasElectronics} />
                  <AppButton onPress={completeCheckout} size="fullWidth">
                    Complete Secure Checkout
                  </AppButton>
                  <AppButton onPress={() => onNavigate('cart')} size="fullWidth" variant="outline">
                    Back to Cart
                  </AppButton>
                </View>
              ) : null}
            </View>
          </ScrollView>
        </View>
      </View>
      {!isDesktop ? <StickyPaymentBar onComplete={completeCheckout} total={checkout.summary.totalPayable} /> : null}
      <AppSnackbar message={snackbarMessage} onDismiss={() => setSnackbarMessage('')} visible={Boolean(snackbarMessage)} />
    </SafeAreaView>
  );
}

function Header({ onNavigate }: { onNavigate: (route: AppRoute) => void }) {
  return (
    <View style={styles.header}>
      <Pressable accessibilityLabel="Back to cart" onPress={() => onNavigate('cart')} style={styles.iconButton}>
        <Ionicons color={colors.textPrimary} name="chevron-back" size={20} />
      </Pressable>
      <View>
        <Text style={styles.headerTitle}>Checkout</Text>
        <Text style={styles.captionText}>Final order review before payment</Text>
      </View>
      <View style={styles.headerActions}>
        <Pressable accessibilityLabel="Security" style={styles.iconButton}>
          <Ionicons color={colors.textPrimary} name="lock-closed-outline" size={20} />
        </Pressable>
      </View>
    </View>
  );
}

function CheckoutSidebar({ onNavigate }: { onNavigate: (route: AppRoute) => void }) {
  return (
    <View style={styles.sidebar}>
      <Text style={styles.headerTitle}>Sharity</Text>
      {[
        ['Cart', 'cart-outline', 'cart'],
        ['Checkout', 'shield-checkmark-outline', 'checkout'],
        ['Marketplace', 'storefront-outline', 'marketplaces']
      ].map(([label, icon, route]) => (
        <Pressable key={label} onPress={() => onNavigate(route as AppRoute)} style={[styles.sidebarItem, label === 'Checkout' && styles.sidebarItemActive]}>
          <Ionicons color={label === 'Checkout' ? colors.white : colors.textPrimary} name={icon as keyof typeof Ionicons.glyphMap} size={18} />
          <Text style={[styles.sidebarText, label === 'Checkout' && styles.sidebarTextActive]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function CheckoutStepHeader() {
  return (
    <AppCard style={styles.card}>
      <Text style={styles.pageTitle}>Complete checkout safely</Text>
      <Text style={styles.bodyText}>Cart validation, shipping, payment method, policy acknowledgment, and final review happen before payment starts.</Text>
      <View style={styles.badgeWrap}>
        {['Order Groups', 'Shipping', 'Rules', 'Payment', 'Review'].map((step) => (
          <AppBadge key={step} label={step} variant="info" />
        ))}
      </View>
    </AppCard>
  );
}

function SeparateOrderWarningCard({ message }: { message?: string }) {
  return (
    <AppCard style={styles.card}>
      <View style={styles.warningRow}>
        <Ionicons color={colors.warning} name="alert-circle-outline" size={22} />
        <Text style={styles.bodyText}>
          {message || 'Your checkout may create separate orders by marketplace and seller.'}
        </Text>
      </View>
    </AppCard>
  );
}

function CheckoutOrderGroupCard({ groups }: { groups: CheckoutOrderGroup[] }) {
  return (
    <AppCard style={styles.card}>
      <Text style={styles.sectionTitle}>Order Groups</Text>
      <View style={styles.groupList}>
        {groups.map((group) => (
          <CheckoutSellerGroupCard group={group} key={group.groupId} />
        ))}
      </View>
    </AppCard>
  );
}

function CheckoutSellerGroupCard({ group }: { group: CheckoutOrderGroup }) {
  return (
    <View style={styles.sellerGroup}>
      <View style={styles.groupHeader}>
        <View>
          <Text style={styles.cardTitle}>{group.marketplaceName}</Text>
          <Text style={styles.bodyText}>Seller: {group.sellerDisplayName}</Text>
          <Text style={styles.captionText}>{group.deliveryType.replaceAll('_', ' ')}</Text>
        </View>
        <View style={styles.badgeWrap}>
          <AppBadge label={group.sellerVerified ? 'Verified Seller' : 'Seller Review'} variant={group.sellerVerified ? 'verified' : 'warning'} />
          <AppBadge label={group.shippingRequired ? 'Shipping required' : 'No shipping'} variant={group.shippingRequired ? 'warning' : 'success'} />
          <AppBadge label={formatMoney(group.groupSubtotal)} variant="marketplace" />
        </View>
      </View>
      {group.items.map((item) => (
        <CheckoutItemSummaryCard item={item} key={item.productId} />
      ))}
    </View>
  );
}

function CheckoutItemSummaryCard({ item }: { item: CheckoutOrderGroup['items'][number] }) {
  return (
    <View style={styles.itemRow}>
      <Ionicons color={colors.primary} name={item.shippingRequired ? 'hardware-chip-outline' : 'keypad-outline'} size={22} />
      <View style={styles.itemText}>
        <Text style={styles.cardTitle}>{item.productTitle}</Text>
        <Text style={styles.captionText}>
          {item.productType.replaceAll('_', ' ')} - Qty {item.quantity} - {item.deliveryType.replaceAll('_', ' ')}
        </Text>
        <Text style={styles.bodyText}>{item.refundReturnSummary}</Text>
      </View>
      <Text style={styles.priceText}>{formatMoney(item.price * item.quantity)}</Text>
    </View>
  );
}

function ShippingAddressCard({
  address,
  onChangeAddress
}: {
  address: AddressFormState;
  onChangeAddress: (address: AddressFormState) => void;
}) {
  return (
    <AppCard style={styles.card}>
      <Text style={styles.sectionTitle}>Shipping Address</Text>
      <Text style={styles.bodyText}>Shipping is required for electronics products. Digital products do not require shipping.</Text>
      <AddressForm address={address} onChangeAddress={onChangeAddress} />
    </AppCard>
  );
}

function AddressForm({
  address,
  onChangeAddress
}: {
  address: AddressFormState;
  onChangeAddress: (address: AddressFormState) => void;
}) {
  function update(field: keyof AddressFormState, value: string) {
    onChangeAddress({ ...address, [field]: value });
  }

  return (
    <View style={styles.formGrid}>
      <AppTextInput label="Full name" onChangeText={(value) => update('fullName', value)} value={address.fullName} />
      <AppTextInput label="Phone number" onChangeText={(value) => update('phoneNumber', value)} value={address.phoneNumber} />
      <AppTextInput label="Address line 1" onChangeText={(value) => update('addressLine1', value)} value={address.addressLine1} />
      <AppTextInput label="Address line 2" onChangeText={(value) => update('addressLine2', value)} value={address.addressLine2 || ''} />
      <AppTextInput label="City" onChangeText={(value) => update('city', value)} value={address.city} />
      <AppTextInput label="State" onChangeText={(value) => update('state', value)} value={address.state} />
      <AppTextInput label="ZIP/postal code" onChangeText={(value) => update('postalCode', value)} value={address.postalCode} />
      <AppTextInput label="Country" onChangeText={(value) => update('country', value)} value={address.country} />
      <AppTextInput label="Delivery instructions" onChangeText={(value) => update('deliveryInstructions', value)} value={address.deliveryInstructions || ''} />
      <View style={styles.badgeWrap}>
        <AppButton variant="outline">Add New Address</AppButton>
        <AppButton variant="outline">Edit Address</AppButton>
        <AppButton>Use This Address</AppButton>
      </View>
    </View>
  );
}

function DigitalAccessRuleCard({ rules }: { rules: string[] }) {
  return (
    <AppCard style={styles.card}>
      <Text style={styles.sectionTitle}>Digital Access Rules</Text>
      <Text style={styles.bodyText}>Digital codes, downloads, subscriptions, and online access will be available after successful payment. Some high-risk digital items may require a short review before access is granted.</Text>
      {rules.map((rule) => (
        <Text key={rule} style={styles.bodyText}>- {rule}</Text>
      ))}
    </AppCard>
  );
}

function RefundReturnPolicyCard({
  acknowledged,
  onToggleAcknowledged,
  rules
}: {
  acknowledged: boolean;
  onToggleAcknowledged: () => void;
  rules: string[];
}) {
  return (
    <AppCard style={styles.card}>
      <Text style={styles.sectionTitle}>Refund / Return Rules</Text>
      {rules.map((rule) => (
        <Text key={rule} style={styles.bodyText}>- {rule}</Text>
      ))}
      <Pressable onPress={onToggleAcknowledged} style={styles.checkboxRow}>
        <AppCheckbox checked={acknowledged} onPress={onToggleAcknowledged} />
        <Text style={styles.bodyText}>I understand the refund, return, and digital access rules.</Text>
      </Pressable>
    </AppCard>
  );
}

function PaymentMethodCard({
  methods,
  onSelect,
  selectedPaymentMethod
}: {
  methods: PaymentMethod[];
  onSelect: (code: string) => void;
  selectedPaymentMethod: string;
}) {
  return (
    <AppCard style={styles.card}>
      <Text style={styles.sectionTitle}>Payment Method</Text>
      <Text style={styles.bodyText}>PayPal is available for MVP. Billing details may be collected securely by the payment provider if required.</Text>
      <PaymentMethodSelector methods={methods} onSelect={onSelect} selectedPaymentMethod={selectedPaymentMethod} />
    </AppCard>
  );
}

function PaymentMethodSelector({
  methods,
  onSelect,
  selectedPaymentMethod
}: {
  methods: PaymentMethod[];
  onSelect: (code: string) => void;
  selectedPaymentMethod: string;
}) {
  return (
    <View style={styles.paymentList}>
      {methods.map((method) => {
        const available = method.status === 'AVAILABLE';
        const selected = selectedPaymentMethod === method.code;
        return (
          <Pressable
            key={method.code}
            onPress={() => (available ? onSelect(method.code) : undefined)}
            style={[styles.paymentRow, selected && styles.paymentRowSelected]}
          >
            <AppRadioButton onPress={() => (available ? onSelect(method.code) : undefined)} selected={selected} value={method.code} />
            <View style={styles.itemText}>
              <Text style={styles.cardTitle}>{method.name}</Text>
              <Text style={styles.bodyText}>{method.description}</Text>
            </View>
            <AppBadge label={available ? 'Available' : 'Coming Soon'} variant={available ? 'success' : 'comingSoon'} />
          </Pressable>
        );
      })}
    </View>
  );
}

function ReviewOrderStep({
  acknowledged,
  checkout,
  hasDigital,
  hasElectronics,
  selectedPaymentMethod
}: {
  acknowledged: boolean;
  checkout: CheckoutResponse;
  hasDigital: boolean;
  hasElectronics: boolean;
  selectedPaymentMethod: string;
}) {
  return (
    <AppCard style={styles.card}>
      <Text style={styles.sectionTitle}>Review Order</Text>
      <Text style={styles.bodyText}>Groups: {checkout.orderGroups.length}</Text>
      <Text style={styles.bodyText}>Shipping: {checkout.shippingRequired ? 'Required for electronics products' : 'Not required'}</Text>
      <Text style={styles.bodyText}>Payment method: {selectedPaymentMethod}</Text>
      <Text style={styles.bodyText}>Policy acknowledgment: {acknowledged ? 'Confirmed' : 'Required'}</Text>
      <Text style={styles.bodyText}>Digital access rules: {hasDigital ? 'Shown' : 'Not applicable'}</Text>
      <Text style={styles.bodyText}>Electronics return rules: {hasElectronics ? 'Shown' : 'Not applicable'}</Text>
      <Text style={styles.cardTitle}>Total payable: {formatMoney(checkout.summary.totalPayable)}</Text>
    </AppCard>
  );
}

function CheckoutSummaryCard({
  checkout,
  hasDigital,
  hasElectronics
}: {
  checkout: CheckoutResponse;
  hasDigital: boolean;
  hasElectronics: boolean;
}) {
  return (
    <AppCard style={styles.card}>
      <Text style={styles.sectionTitle}>Checkout Summary</Text>
      <SummaryRow label="Subtotal" value={formatMoney(checkout.summary.subtotal)} />
      <SummaryRow label="Marketplace fee" value={formatMoney(checkout.summary.marketplaceFee)} />
      <SummaryRow label="Estimated tax" value={formatMoney(checkout.summary.estimatedTax)} />
      <SummaryRow label="Discounts" value={`-${formatMoney(checkout.summary.discount)}`} />
      <SummaryRow label="Coupon discount" value={`-${formatMoney(checkout.summary.couponDiscount)}`} />
      <SummaryRow label="Shipping" value={shippingLabel(hasDigital, hasElectronics)} />
      <AppDivider />
      <SummaryRow strong label="Total payable" value={formatMoney(checkout.summary.totalPayable)} />
    </AppCard>
  );
}

function SummaryRow({ label, strong, value }: { label: string; strong?: boolean; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.bodyText, strong && styles.strongText]}>{label}</Text>
      <Text style={[styles.bodyText, strong && styles.strongText]}>{value}</Text>
    </View>
  );
}

function StickyPaymentBar({ onComplete, total }: { onComplete: () => void; total: number }) {
  return (
    <View style={styles.stickyBar}>
      <View>
        <Text style={styles.captionText}>Total payable</Text>
        <Text style={styles.stickyTotal}>{formatMoney(total)}</Text>
      </View>
      <AppButton onPress={onComplete}>Complete Secure Checkout</AppButton>
    </View>
  );
}

function addressIsValid(address: AddressFormState) {
  return Boolean(address.fullName && address.phoneNumber && address.addressLine1 && address.city && address.state && address.postalCode && address.country);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' }).format(value);
}

function shippingLabel(hasDigital: boolean, hasElectronics: boolean) {
  if (hasDigital && hasElectronics) {
    return 'Digital: no shipping. Electronics: calculated based on address.';
  }
  if (hasElectronics) {
    return 'Calculated based on address';
  }
  return 'Not required';
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1
  },
  shell: {
    flex: 1,
    flexDirection: 'row'
  },
  sidebar: {
    backgroundColor: colors.surface,
    borderRightColor: colors.border,
    borderRightWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
    width: 236
  },
  sidebarItem: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md
  },
  sidebarItemActive: {
    backgroundColor: colors.primary
  },
  sidebarText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800'
  },
  sidebarTextActive: {
    color: colors.white
  },
  main: {
    flex: 1
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 64,
    paddingHorizontal: spacing.xl
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '900'
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  iconButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing['6xl']
  },
  layout: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.xl
  },
  layoutSingle: {
    flexDirection: 'column'
  },
  stepsColumn: {
    flex: 1,
    gap: spacing.lg,
    width: '100%'
  },
  summaryColumn: {
    gap: spacing.md,
    maxWidth: 390,
    position: 'sticky' as 'relative',
    top: spacing.lg,
    width: 370
  },
  card: {
    backgroundColor: colors.surface
  },
  pageTitle: {
    color: colors.textPrimary,
    fontSize: typography.pageTitle.fontSize,
    fontWeight: typography.pageTitle.fontWeight
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: typography.cardTitle.fontWeight
  },
  bodyText: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight
  },
  captionText: {
    color: colors.softText,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight
  },
  strongText: {
    color: colors.textPrimary,
    fontWeight: '900'
  },
  badgeWrap: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  warningRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm
  },
  groupList: {
    gap: spacing.md
  },
  sellerGroup: {
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md
  },
  groupHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between'
  },
  itemRow: {
    alignItems: 'flex-start',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.md
  },
  itemText: {
    flex: 1,
    gap: spacing.xs
  },
  priceText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '900'
  },
  formGrid: {
    gap: spacing.md
  },
  checkboxRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm
  },
  paymentList: {
    gap: spacing.sm
  },
  paymentRow: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md
  },
  paymentRowSelected: {
    borderColor: colors.primary
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between'
  },
  stickyBar: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    padding: spacing.md
  },
  stickyTotal: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '900'
  },
  centerState: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
    padding: spacing.xl
  }
});
