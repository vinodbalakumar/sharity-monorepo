import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Input, Paragraph, YStack, XStack } from 'tamagui';

import { InteriorShell } from '../../components/appShell/InteriorShell';
import { AppLoadingIndicator, AppTextInput } from '../../components/ui';
import { colors, radii, spacing } from '../../theme';
import type { AppRoute } from '../../types/navigation';
import { getBffCsrfToken } from '../../services/sessionService';
import { createProviderAccount, enrollProviderModule, getMyModules, getMyProviderAccounts, getMyCapabilities, type ProviderAccount } from '../../services/platformAuthorizationApi';
import { getCurrentUser, type CurrentUser } from '../../services/userApi';

type SellerListingScreenProps = {
  onNavigate: (route: AppRoute) => void;
};

type ListingMarketplaceOption = {
  marketplaceCode: string;
  name: string;
  enabled: boolean;
  reason?: string | null;
};

type ListingCategoryOption = {
  categoryCode: string;
  name: string;
  marketplaceCode: string;
  enabled: boolean;
  defaultForMarketplace: boolean;
  reason?: string | null;
};

type ListingReachScopeOption = {
  code: 'NATIONAL' | 'GLOBAL';
  label: string;
  description: string;
};

type ListingPolicyRequirement = {
  requirementCode: string;
  label: string;
  required: boolean;
  accepted: boolean;
  policyRoute: string;
};

type ListingFormConfig = {
  marketplaces: ListingMarketplaceOption[];
  categories: ListingCategoryOption[];
  deliveryTypes: string[];
  currencies: string[];
  reachScopes: ListingReachScopeOption[];
  policyRequirements: ListingPolicyRequirement[];
  userSafeMessage: string;
};

type SellerListingDraftRequest = {
  providerAccountPublicId: string;
  categoryCode: string;
  currency: string;
  deliveryType: string;
  fulfillmentScope: 'NATIONAL' | 'GLOBAL';
  longDescription?: string;
  marketplaceCode: string;
  price: number;
  shortDescription?: string;
  stockQuantity: number;
  title: string;
};

type SellerListingDraftResponse = {
  draftId: string;
  status: string;
  title: string;
  categoryCode: string;
  fulfillmentScope: string;
  price: number;
  currency: string;
  mediaIds: string[];
  availableActions: string[];
  updatedAt: string;
};

type ModuleItem = {
  moduleCode: string;
  moduleName: string;
  status: string;
  displayOrder: number;
  providerAccessEnabled: boolean;
  requiresProviderApproval: boolean;
  availableToCustomer: boolean;
  providerAccessActive: boolean;
};

const sellerScopeOptions: Array<{ value: 'NATIONAL' | 'GLOBAL'; label: string; description: string }> = [
  {
    value: 'NATIONAL',
    label: 'National seller',
    description: 'Visible only in your registered country.'
  },
  {
    value: 'GLOBAL',
    label: 'Global seller',
    description: 'Visible across supported regions when allowed.'
  }
];

const initialForm = {
  title: '',
  shortDescription: '',
  longDescription: '',
  price: '',
  currency: 'USD',
  marketplaceCode: '',
  categoryCode: '',
  deliveryType: 'DIGITAL',
  fulfillmentScope: 'NATIONAL' as const,
  stockQuantity: '1'
};

export function SellerListingScreen({ onNavigate }: SellerListingScreenProps) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [providerAccounts, setProviderAccounts] = useState<ProviderAccount[]>([]);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [formConfig, setFormConfig] = useState<ListingFormConfig | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    void load();
  }, []);

  const selectedProvider = useMemo(
    () => providerAccounts.find((account) => account.publicId === selectedProviderId) ?? providerAccounts[0] ?? null,
    [providerAccounts, selectedProviderId]
  );

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [user, accounts, liveModules, config] = await Promise.all([
        getCurrentUser(),
        getMyProviderAccounts(),
        getMyModules(),
        loadListingFormConfig()
      ]);
      setCurrentUser(user);
      setProviderAccounts(accounts);
      setModules(liveModules);
      setFormConfig(config);

      const firstProvider = accounts[0] ?? null;
      setSelectedProviderId(firstProvider?.publicId ?? '');

      const marketplaceCode = config.marketplaces.find((marketplace) => marketplace.enabled)?.marketplaceCode ?? 'DIGITAL';
      const categoryCode = config.categories.find((category) => category.marketplaceCode === marketplaceCode && category.enabled)?.categoryCode
        ?? config.categories.find((category) => category.enabled)?.categoryCode
        ?? '';

      setForm((current) => ({
        ...current,
        marketplaceCode,
        categoryCode,
        currency: config.currencies[0] ?? current.currency,
        deliveryType: config.deliveryTypes[0] ?? current.deliveryType
      }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load seller workspace.');
    } finally {
      setLoading(false);
    }
  }

  async function loadListingFormConfig(): Promise<ListingFormConfig> {
    const response = await fetch(`${process.env.EXPO_PUBLIC_BFF_BASE_URL ?? '/bff'}/api/marketplace-service/api/seller/listings/create/form-config`, {
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error(`Unable to load seller listing options (${response.status})`);
    }
    return (await response.json()) as ListingFormConfig;
  }

  function selectMarketplace(marketplaceCode: string) {
    const nextCategory = formConfig?.categories.find((category) => category.marketplaceCode === marketplaceCode && category.enabled)?.categoryCode
      ?? formConfig?.categories.find((category) => category.enabled)?.categoryCode
      ?? '';
    setForm((current) => ({
      ...current,
      marketplaceCode,
      categoryCode: nextCategory
    }));
  }

  function setNumericField(key: 'price' | 'stockQuantity', value: string) {
    const sanitized = value.replace(/[^\d.]/g, '');
    setForm((current) => ({ ...current, [key]: sanitized }));
  }

  async function createProvider() {
    if (!currentUser) {
      return;
    }
    try {
      setMessage('');
      const created = await createProviderAccount({
        displayName: `${currentUser.profile.firstName ?? ''} ${currentUser.profile.lastName ?? ''}`.trim() || currentUser.username,
        providerType: 'INDIVIDUAL',
        sellerScope: 'NATIONAL',
        countryCode: currentUser.profile.countryCode ?? 'USA',
        defaultCurrencyCode: currentUser.profile.countryCode === 'IND' ? 'INR' : 'USD'
      });
      setProviderAccounts((current) => [created, ...current]);
      setSelectedProviderId(created.publicId);
      setMessage('Provider account created from live profile data.');
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Unable to create provider account.');
    }
  }

  async function enroll(moduleCode: string) {
    if (!selectedProvider) {
      return;
    }
    try {
      setMessage('');
      const updated = await enrollProviderModule(selectedProvider.publicId, moduleCode);
      setProviderAccounts((current) => current.map((account) => (account.publicId === updated.publicId ? updated : account)));
      setMessage(`${moduleCode} enrollment updated.`);
    } catch (enrollError) {
      setError(enrollError instanceof Error ? enrollError.message : 'Unable to enroll module.');
    }
  }

  async function submitDraft() {
    if (!selectedProvider) {
      setError('Create or select a provider account first.');
      return;
    }
    if (!formConfig) {
      setError('Seller listing options are not ready yet.');
      return;
    }
    if (!form.title.trim() || !form.price.trim() || !form.marketplaceCode || !form.categoryCode) {
      setError('Please fill the required seller listing fields.');
      return;
    }

    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const csrf = await getBffCsrfToken();
      const response = await fetch(`${process.env.EXPO_PUBLIC_BFF_BASE_URL ?? '/bff'}/api/marketplace-service/api/seller/listings/drafts`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrf.csrfToken ? { 'X-CSRF-TOKEN': csrf.csrfToken } : {})
        },
        body: JSON.stringify({
          providerAccountPublicId: selectedProvider.publicId,
          categoryCode: form.categoryCode,
          currency: form.currency,
          deliveryType: form.deliveryType,
          fulfillmentScope: form.fulfillmentScope,
          longDescription: form.longDescription || undefined,
          marketplaceCode: form.marketplaceCode,
          price: Number(form.price),
          shortDescription: form.shortDescription || undefined,
          stockQuantity: Number(form.stockQuantity) || 1,
          title: form.title.trim()
        } satisfies SellerListingDraftRequest)
      });

      if (!response.ok) {
        const detail = await safeErrorMessage(response);
        throw new Error(detail);
      }

      const created = (await response.json()) as SellerListingDraftResponse;
      setMessage(`Draft ${created.draftId} created successfully.`);
      setForm(initialForm);
      await load();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create seller draft.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <InteriorShell activeLabel="Sell" onNavigate={onNavigate} scrollable={false} subtitle="Live seller account status and module access" title="Verification & Payout Eligibility">
        <View style={styles.center}>
          <AppLoadingIndicator />
          <Text style={styles.centerText}>Loading seller workspace...</Text>
        </View>
      </InteriorShell>
    );
  }

  return (
    <InteriorShell activeLabel="Sell" onNavigate={onNavigate} scrollable={false} subtitle="Live seller account status and module access" title="Verification & Payout Eligibility">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>Seller access</Text>
              <Text style={styles.title}>Verification & Payout Eligibility</Text>
              <Text style={styles.subtitle}>Use your live provider account and module enrollments to unlock selling, service, and payout access.</Text>
            </View>
          </View>

          {error ? <MessageCard title={error} actionLabel="Reload" onAction={load} tone="error" /> : null}
          {message ? <MessageCard title={message} tone="success" /> : null}

          <View style={styles.grid}>
            <View style={styles.leftColumn}>
              <Card style={styles.card}>
                <SectionTitle title="Create or select provider account" />
                <Input
                  placeholder={currentUser?.username ?? 'Display name'}
                  value={currentUser ? `${currentUser.profile.firstName ?? ''} ${currentUser.profile.lastName ?? ''}`.trim() : ''}
                  onChangeText={() => undefined}
                  editable={false}
                  style={styles.disabledInput}
                />
                <Paragraph style={styles.helper}>Provider identity comes from your live account profile.</Paragraph>
                <Button accessibilityLabel="Create provider account" onPress={createProvider} theme="purple" style={styles.actionButton}>
                  Create account
                </Button>
                <View style={styles.accountList}>
                  {providerAccounts.length === 0 ? <Paragraph style={styles.muted}>No provider account yet.</Paragraph> : null}
                  {providerAccounts.map((account) => {
                    const selected = account.publicId === selectedProviderId;
                    return (
                      <Pressable
                        key={account.publicId}
                        accessibilityLabel={`Select provider account ${account.displayName}`}
                        onPress={() => setSelectedProviderId(account.publicId)}
                        style={[styles.accountRow, selected && styles.accountRowActive]}
                      >
                        <View style={styles.accountMeta}>
                          <Text style={styles.accountTitle}>{account.displayName}</Text>
                          <Text style={styles.accountText}>{account.providerType} · {account.countryCode} · {account.defaultCurrencyCode}</Text>
                          <Text style={styles.accountText}>{account.verificationStatus} · {account.overallStatus}</Text>
                        </View>
                        <Badge label={account.payoutsEnabled ? 'Payouts on' : 'Payouts off'} tone={account.payoutsEnabled ? 'success' : 'warning'} />
                      </Pressable>
                    );
                  })}
                </View>
              </Card>

              <Card style={styles.card}>
                <SectionTitle title="Current provider account" />
                {selectedProvider ? (
                  <View style={styles.summaryRows}>
                    <SummaryRow label="Display name" value={selectedProvider.displayName} />
                    <SummaryRow label="Seller scope" value={selectedProvider.sellerScope} />
                    <SummaryRow label="Verification" value={selectedProvider.verificationStatus} />
                    <SummaryRow label="Status" value={selectedProvider.overallStatus} />
                    <SummaryRow label="Payouts enabled" value={selectedProvider.payoutsEnabled ? 'Yes' : 'No'} />
                    <SummaryRow label="Charges enabled" value={selectedProvider.chargesEnabled ? 'Yes' : 'No'} />
                  </View>
                ) : (
                  <Paragraph style={styles.muted}>Select or create a provider account to continue.</Paragraph>
                )}
              </Card>
            </View>

            <View style={styles.rightColumn}>
              <Card style={styles.card}>
                <SectionTitle title="Create listing draft" />
                <Paragraph style={styles.helper}>{formConfig?.userSafeMessage ?? 'Listing options are loaded from the live marketplace catalog.'}</Paragraph>

                <SectionLabel label="Marketplace" />
                <View style={styles.chipRow}>
                  {formConfig?.marketplaces.map((marketplace) => (
                    <Pressable
                      key={marketplace.marketplaceCode}
                      accessibilityLabel={`Marketplace ${marketplace.name}`}
                      onPress={() => marketplace.enabled && selectMarketplace(marketplace.marketplaceCode)}
                      style={[
                        styles.chip,
                        form.marketplaceCode === marketplace.marketplaceCode && styles.chipActive,
                        !marketplace.enabled && styles.chipDisabled
                      ]}
                    >
                      <Text style={[styles.chipTitle, form.marketplaceCode === marketplace.marketplaceCode && styles.chipTitleActive]}>{marketplace.name}</Text>
                      <Text style={[styles.chipText, form.marketplaceCode === marketplace.marketplaceCode && styles.chipTextActive]}>
                        {marketplace.enabled ? marketplace.marketplaceCode : marketplace.reason ?? 'Unavailable'}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <SectionLabel label="Category" />
                <View style={styles.chipRow}>
                  {formConfig?.categories
                    .filter((category) => !form.marketplaceCode || category.marketplaceCode === form.marketplaceCode)
                    .map((category) => (
                      <Pressable
                        key={category.categoryCode}
                        accessibilityLabel={`Category ${category.name}`}
                        onPress={() => category.enabled && setForm((current) => ({ ...current, categoryCode: category.categoryCode }))}
                        style={[
                          styles.chip,
                          form.categoryCode === category.categoryCode && styles.chipActive,
                          !category.enabled && styles.chipDisabled
                        ]}
                      >
                        <Text style={[styles.chipTitle, form.categoryCode === category.categoryCode && styles.chipTitleActive]}>{category.name}</Text>
                        <Text style={[styles.chipText, form.categoryCode === category.categoryCode && styles.chipTextActive]}>
                          {category.enabled ? category.marketplaceCode : category.reason ?? 'Unavailable'}
                        </Text>
                      </Pressable>
                    ))}
                </View>

                <View style={styles.formGrid}>
                  <Field label="Title *" value={form.title} onChangeText={(value) => setForm((current) => ({ ...current, title: value }))} />
                  <Field label="Short description" value={form.shortDescription} onChangeText={(value) => setForm((current) => ({ ...current, shortDescription: value }))} />
                  <Field label="Full description" value={form.longDescription} onChangeText={(value) => setForm((current) => ({ ...current, longDescription: value }))} multiline numberOfLines={4} />
                  <XStack gap="$3" flexWrap="wrap">
                    <View style={styles.halfField}>
                      <Field label="Price *" value={form.price} onChangeText={(value) => setNumericField('price', value)} keyboardType="decimal-pad" />
                    </View>
                    <View style={styles.halfField}>
                      <Field label="Stock" value={form.stockQuantity} onChangeText={(value) => setNumericField('stockQuantity', value)} keyboardType="number-pad" />
                    </View>
                  </XStack>

                  <XStack gap="$3" flexWrap="wrap">
                    <View style={styles.halfField}>
                      <SelectField label="Currency" value={form.currency} options={formConfig?.currencies ?? ['USD']} onChange={(value) => setForm((current) => ({ ...current, currency: value }))} />
                    </View>
                    <View style={styles.halfField}>
                      <SelectField label="Delivery type" value={form.deliveryType} options={formConfig?.deliveryTypes ?? ['DIGITAL']} onChange={(value) => setForm((current) => ({ ...current, deliveryType: value }))} />
                    </View>
                  </XStack>

                  <SectionLabel label="Seller scope" />
                  <View style={styles.chipRow}>
                    {sellerScopeOptions.map((option) => (
                      <Pressable
                        key={option.value}
                        accessibilityLabel={`Scope ${option.label}`}
                        onPress={() => setForm((current) => ({ ...current, fulfillmentScope: option.value }))}
                        style={[styles.chip, form.fulfillmentScope === option.value && styles.chipActive]}
                      >
                        <Text style={[styles.chipTitle, form.fulfillmentScope === option.value && styles.chipTitleActive]}>{option.label}</Text>
                        <Text style={[styles.chipText, form.fulfillmentScope === option.value && styles.chipTextActive]}>{option.description}</Text>
                      </Pressable>
                    ))}
                  </View>

                  <View style={styles.policyBox}>
                    {formConfig?.policyRequirements.map((policy) => (
                      <View key={policy.requirementCode} style={styles.policyRow}>
                        <Ionicons color={policy.required ? colors.primary : colors.textSecondary} name={policy.accepted ? 'checkmark-circle' : 'ellipse-outline'} size={18} />
                        <Paragraph style={styles.policyText}>{policy.label}</Paragraph>
                      </View>
                    ))}
                  </View>

                  <Button accessibilityLabel="Create listing draft" disabled={submitting} onPress={submitDraft} theme="purple" style={styles.submitButton}>
                    {submitting ? 'Creating draft...' : 'Create draft'}
                  </Button>
                </View>
              </Card>

              <Card style={styles.card}>
                <SectionTitle title="Module access" />
                <Paragraph style={styles.helper}>Available modules come directly from the authorization service.</Paragraph>
                <View style={styles.moduleList}>
                  {modules.map((module) => (
                    <View key={module.moduleCode} style={styles.moduleRow}>
                      <View style={styles.moduleMeta}>
                        <Text style={styles.moduleTitle}>{module.moduleName}</Text>
                        <Text style={styles.moduleText}>{module.moduleCode} · {module.status}</Text>
                        <Text style={styles.moduleText}>{module.providerAccessEnabled ? 'Provider access enabled' : 'Provider access closed'}</Text>
                      </View>
                      <View style={styles.moduleActions}>
                        <Badge label={module.providerAccessActive ? 'Active' : 'Review'} tone={module.providerAccessActive ? 'success' : 'warning'} />
                        {selectedProvider ? (
                          <Button accessibilityLabel={`Enroll ${module.moduleName}`} onPress={() => enroll(module.moduleCode)} size="$2">
                            Enroll
                          </Button>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              </Card>
            </View>
          </View>
        </View>
      </ScrollView>
    </InteriorShell>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  multiline,
  numberOfLines
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
  multiline?: boolean;
  numberOfLines?: number;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <AppTextInput
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        onChangeText={onChangeText}
        placeholder={label}
        value={value}
      />
    </View>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.selectWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectScroll}>
          {options.map((option) => (
            <Pressable
              key={option}
              accessibilityLabel={`${label} ${option}`}
              onPress={() => onChange(option)}
              style={[styles.selectChip, value === option && styles.selectChipActive]}
            >
              <Text style={[styles.selectChipText, value === option && styles.selectChipTextActive]}>{option}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function Badge({ label, tone }: { label: string; tone: 'success' | 'warning' | 'info' | 'error' }) {
  return <Text style={[styles.badge, tone === 'success' && styles.badgeSuccess, tone === 'warning' && styles.badgeWarning, tone === 'info' && styles.badgeInfo, tone === 'error' && styles.badgeError]}>{label}</Text>;
}

function MessageCard({ title, actionLabel, onAction, tone }: { title: string; actionLabel?: string; onAction?: () => void; tone?: 'success' | 'error' }) {
  return (
    <Card style={[styles.messageCard, tone === 'error' && styles.messageCardError]}>
      <YStack gap="$2" ai="center">
        <Text style={styles.messageText}>{title}</Text>
        {actionLabel ? (
          <Button accessibilityLabel={actionLabel} onPress={onAction} size="$2">
            {actionLabel}
          </Button>
        ) : null}
      </YStack>
    </Card>
  );
}

async function safeErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return body.detail ?? body.message ?? body.error ?? `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md
  },
  centerText: {
    color: colors.textSecondary,
    fontSize: 15
  },
  content: {
    paddingBottom: spacing['6xl']
  },
  container: {
    gap: spacing.lg,
    marginHorizontal: 'auto',
    maxWidth: 1240,
    padding: spacing.lg,
    width: '100%'
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800'
  },
  title: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: '900'
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 880
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.lg
  },
  leftColumn: {
    gap: spacing.lg,
    width: 380
  },
  rightColumn: {
    flex: 1,
    minWidth: 0
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: spacing.sm
  },
  sectionLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginTop: spacing.md,
    marginBottom: spacing.sm
  },
  helper: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: spacing.md
  },
  muted: {
    color: colors.textSecondary,
    fontSize: 13
  },
  disabledInput: {
    backgroundColor: colors.surfaceVariant,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.textSecondary,
    height: 48,
    marginBottom: spacing.sm,
    paddingHorizontal: 14
  },
  actionButton: {
    marginBottom: spacing.md
  },
  accountList: {
    gap: spacing.sm
  },
  accountRow: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    padding: spacing.md
  },
  accountRowActive: {
    borderColor: colors.primary,
    backgroundColor: '#F1FBF7'
  },
  accountMeta: {
    flex: 1
  },
  accountTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800'
  },
  accountText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2
  },
  summaryRows: {
    gap: spacing.sm
  },
  summaryRow: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '800'
  },
  summaryValue: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '900'
  },
  field: {
    gap: spacing.xs,
    marginBottom: spacing.md
  },
  label: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '800'
  },
  formGrid: {
    gap: spacing.xs
  },
  halfField: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '48%'
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
    padding: spacing.md,
    minWidth: 160
  },
  chipDisabled: {
    opacity: 0.55
  },
  chipActive: {
    backgroundColor: '#EEF5FF',
    borderColor: colors.primary
  },
  chipTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '800'
  },
  chipTitleActive: {
    color: colors.primary
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 12
  },
  chipTextActive: {
    color: colors.primary
  },
  selectWrap: {
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 4
  },
  selectScroll: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8
  },
  selectChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  selectChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  selectChipText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '800'
  },
  selectChipTextActive: {
    color: colors.white
  },
  policyBox: {
    backgroundColor: colors.surfaceVariant,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.md
  },
  policyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm
  },
  policyText: {
    color: colors.textPrimary,
    fontSize: 13,
    flex: 1
  },
  submitButton: {
    marginTop: spacing.sm
  },
  moduleList: {
    gap: spacing.sm
  },
  moduleRow: {
    alignItems: 'center',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    paddingVertical: spacing.md
  },
  moduleMeta: {
    flex: 1,
    gap: 2
  },
  moduleTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800'
  },
  moduleText: {
    color: colors.textSecondary,
    fontSize: 12
  },
  moduleActions: {
    alignItems: 'flex-end',
    gap: spacing.sm
  },
  badge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  badgeInfo: {
    backgroundColor: '#EAF1FF',
    color: '#185FA5'
  },
  badgeSuccess: {
    backgroundColor: '#E7F8F1',
    color: '#0F6E56'
  },
  badgeWarning: {
    backgroundColor: '#FAEEDA',
    color: '#854F0B'
  },
  badgeError: {
    backgroundColor: '#FCEBEB',
    color: '#A32D2D'
  },
  messageCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md
  },
  messageCardError: {
    backgroundColor: '#FFF4F4'
  },
  messageText: {
    color: colors.textPrimary,
    fontSize: 14,
    textAlign: 'center'
  }
});
