import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Input, Paragraph } from 'tamagui';

import { InteriorShell } from '../../components/appShell/InteriorShell';
import { colors, radius, spacing } from '../../theme';
import type { AppRoute } from '../../types/navigation';
import { getRegistrationOptions } from '../../services/authApi';
import { getCurrentUser, type CurrentUser } from '../../services/userApi';
import { createProviderAccount, enrollProviderModule, getMyModules, getMyProviderAccounts, type ProviderAccount } from '../../services/platformAuthorizationApi';

type Props = { onNavigate: (route: AppRoute) => void };
type ModuleItem = { moduleCode: string; moduleName: string; status: string; displayOrder: number; providerAccessEnabled: boolean; requiresProviderApproval: boolean; availableToCustomer: boolean; providerAccessActive: boolean };

export function SellerVerificationScreen({ onNavigate }: Props) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [providerAccounts, setProviderAccounts] = useState<ProviderAccount[]>([]);
  const [allModules, setAllModules] = useState<ModuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [newProviderName, setNewProviderName] = useState('');

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [user, accounts, modules, registrationOptions] = await Promise.all([
        getCurrentUser(),
        getMyProviderAccounts(),
        getMyModules(),
        getRegistrationOptions()
      ]);
      setCurrentUser(user);
      setProviderAccounts(accounts);
      setAllModules(modules);
      const chosen = accounts[0];
      setSelectedProviderId(chosen?.publicId ?? '');
      setNewProviderName(chosen?.displayName ?? user.username);
      if (!chosen && registrationOptions.countries.length > 0) {
        setMessage('Create a provider account with your live profile details to unlock seller access.');
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load seller verification.');
    } finally {
      setLoading(false);
    }
  }

  const selectedProvider = useMemo(() => providerAccounts.find((account) => account.publicId === selectedProviderId) ?? providerAccounts[0] ?? null, [providerAccounts, selectedProviderId]);

  async function createAccount() {
    if (!currentUser) {
      return;
    }
    const countryCode = currentUser.profile.countryCode ?? 'USA';
    const defaultCurrencyCode = countryCode === 'IND' ? 'INR' : 'USD';
    try {
      setMessage('');
      const account = await createProviderAccount({
        displayName: newProviderName.trim() || currentUser.username,
        providerType: 'INDIVIDUAL',
        countryCode,
        defaultCurrencyCode
      });
      setProviderAccounts((current) => [account, ...current]);
      setSelectedProviderId(account.publicId);
      setMessage('Provider account created from live account data.');
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Unable to create provider account.');
    }
  }

  async function enroll(moduleCode: string) {
    if (!selectedProvider) {
      return;
    }
    try {
      const updated = await enrollProviderModule(selectedProvider.publicId, moduleCode);
      setProviderAccounts((current) => current.map((account) => (account.publicId === updated.publicId ? updated : account)));
      setMessage(`${moduleCode} enrollment updated.`);
    } catch (enrollError) {
      setError(enrollError instanceof Error ? enrollError.message : 'Unable to enroll module.');
    }
  }

  return (
    <InteriorShell activeLabel="Sell" onNavigate={onNavigate} scrollable={false} subtitle="Live seller account status and module access" title="Verification & Payout Eligibility">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>Seller access</Text>
              <Text style={styles.title}>Verification & Payout Eligibility</Text>
              <Text style={styles.subtitle}>Use your real provider account and module enrollments to unlock selling, service, and payout access.</Text>
            </View>
          </View>

          {loading ? <StateCard title="Loading provider access..." /> : null}
          {error ? <StateCard title={error} actionLabel="Reload" onAction={load} /> : null}
          {message ? <StateCard title={message} /> : null}

          {!loading ? (
            <View style={styles.grid}>
              <View style={styles.leftColumn}>
                <Card style={styles.card}>
                  <SectionTitle title="Create / select provider account" />
                  <Input value={newProviderName} onChangeText={setNewProviderName} placeholder="Display name" style={styles.input} />
                  <Button accessibilityLabel="Create provider account" onPress={createAccount} theme="purple" style={styles.actionButton}>
                    Create Account
                  </Button>
                  <View style={styles.accountList}>
                    {providerAccounts.length === 0 ? <Paragraph color="$gray10">No provider account yet.</Paragraph> : null}
                    {providerAccounts.map((account) => {
                      const selected = account.publicId === selectedProviderId;
                      return (
                        <Pressable key={account.publicId} accessibilityLabel={`Select provider account ${account.displayName}`} onPress={() => setSelectedProviderId(account.publicId)} style={[styles.accountRow, selected && styles.accountRowActive]}>
                          <View style={styles.accountMeta}>
                            <Text style={styles.accountTitle}>{account.displayName}</Text>
                            <Text style={styles.accountText}>{account.providerType} · {account.countryCode} · {account.defaultCurrencyCode}</Text>
                            <Text style={styles.accountText}>{account.verificationStatus} · {account.overallStatus}</Text>
                          </View>
                          <Pill label={account.payoutsEnabled ? 'Payouts on' : 'Payouts off'} tone={account.payoutsEnabled ? 'success' : 'warning'} />
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
                      <SummaryRow label="Status" value={selectedProvider.overallStatus} />
                      <SummaryRow label="Verification" value={selectedProvider.verificationStatus} />
                      <SummaryRow label="Payouts enabled" value={selectedProvider.payoutsEnabled ? 'Yes' : 'No'} />
                      <SummaryRow label="Charges enabled" value={selectedProvider.chargesEnabled ? 'Yes' : 'No'} />
                    </View>
                  ) : (
                    <Paragraph color="$gray10">Create a provider account to view live seller eligibility.</Paragraph>
                  )}
                </Card>
              </View>

              <View style={styles.rightColumn}>
                <Card style={styles.card}>
                  <SectionTitle title="Module access" />
                  <Text style={styles.helper}>Available modules come directly from the platform authorization service.</Text>
                  <View style={styles.moduleList}>
                    {allModules.map((module) => <ModuleRow key={module.moduleCode} module={module} onEnroll={enroll} selectedProvider={selectedProvider} />)}
                  </View>
                </Card>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </InteriorShell>
  );
}

function ModuleRow({ module, onEnroll, selectedProvider }: { module: ModuleItem; onEnroll: (moduleCode: string) => void; selectedProvider: ProviderAccount | null }) {
  const enrollment = selectedProvider?.enrollments.find((item) => item.moduleCode === module.moduleCode);
  const status = enrollment?.enrollmentStatus ?? module.status;
  return (
    <View style={styles.moduleRow}>
      <View style={styles.moduleMeta}>
        <Text style={styles.moduleTitle}>{module.moduleName}</Text>
        <Text style={styles.moduleText}>{module.moduleCode} · {status}</Text>
        <Text style={styles.moduleText}>{module.providerAccessEnabled ? 'Provider access enabled' : 'Provider access closed'}</Text>
      </View>
      <View style={styles.moduleActions}>
        <Pill label={status} tone={status === 'APPROVED' || status === 'ACTIVE' ? 'success' : 'warning'} />
        {selectedProvider ? (
          <Button accessibilityLabel={`Enroll ${module.moduleName}`} onPress={() => onEnroll(module.moduleCode)} size="$2">
            Enroll
          </Button>
        ) : null}
      </View>
    </View>
  );
}

function StateCard({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={styles.stateCard}>
      <Text style={styles.stateText}>{title}</Text>
      {actionLabel ? <Button accessibilityLabel={actionLabel} onPress={onAction} size="$2">{actionLabel}</Button> : null}
    </View>
  );
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

function Pill({ label, tone }: { label: string; tone: 'success' | 'warning' | 'info' | 'neutral' }) {
  return <Text style={[styles.pill, tone === 'success' && styles.pillSuccess, tone === 'warning' && styles.pillWarning, tone === 'info' && styles.pillInfo]}>{label}</Text>;
}

const styles = StyleSheet.create({
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
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
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
    maxWidth: 860
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
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: spacing.sm
  },
  helper: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: spacing.md
  },
  input: {
    backgroundColor: '#fff',
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 48,
    marginBottom: spacing.md,
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
  stateCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.large,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg
  },
  stateText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800'
  },
  pill: {
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  pillInfo: {
    backgroundColor: '#EAF1FF',
    color: '#185FA5'
  },
  pillSuccess: {
    backgroundColor: '#E7F8F1',
    color: '#0F6E56'
  },
  pillWarning: {
    backgroundColor: '#FAEEDA',
    color: '#854F0B'
  }
});



