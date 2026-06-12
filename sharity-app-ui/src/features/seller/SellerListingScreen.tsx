import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState, type ReactElement } from 'react';
import { ScrollView, View, StyleSheet, Platform } from 'react-native';
import { Button, Card, Input, Text, YStack, XStack, Select } from 'tamagui';

import { InteriorShell } from '../../components/appShell/InteriorShell';
import { AppButton, AppTextInput, AppLoadingIndicator } from '../../components/ui';
import { colors, spacing, radii } from '../../theme';
import type { AppRoute } from '../../types/navigation';

type SellerListingScreenProps = {
  onNavigate: (route: AppRoute) => void;
};

type ListingFormData = {
  title: string;
  shortDescription: string;
  longDescription: string;
  price: string;
  currency: string;
  category: string;
  deliveryMethod: string;
  stock: string;
};

const emptyForm: ListingFormData = {
  title: '',
  shortDescription: '',
  longDescription: '',
  price: '',
  currency: 'USD',
  category: 'digital-products',
  deliveryMethod: 'instant',
  stock: '1'
};

export function SellerListingScreen({ onNavigate }: SellerListingScreenProps) {
  const [step, setStep] = useState<'category' | 'details' | 'review'>('category');
  const [form, setForm] = useState<ListingFormData>(emptyForm);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNext = useCallback(() => {
    if (step === 'category') {
      if (!form.category) {
        setMessage('Please select a category');
        return;
      }
      setStep('details');
    } else if (step === 'details') {
      if (!form.title || !form.price) {
        setMessage('Please fill in title and price');
        return;
      }
      setStep('review');
    }
  }, [step, form.category, form.title, form.price]);

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    try {
      // Call real backend API to create listing
      const response = await fetch('/bff/api/seller/listings', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.longDescription || form.shortDescription,
          price: parseFloat(form.price),
          currency: form.currency,
          category: form.category,
          deliveryMethod: form.deliveryMethod,
          stock: parseInt(form.stock) || 1
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create listing: ${response.statusText}`);
      }

      setMessage('Listing created successfully!');
      setTimeout(() => {
        onNavigate('home');
      }, 1500);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error creating listing');
    } finally {
      setLoading(false);
    }
  }, [form, onNavigate]);

  if (loading) {
    return (
      <InteriorShell onNavigate={onNavigate} title="Create Listing" scrollable={false}>
        <View style={styles.centerContent}>
          <AppLoadingIndicator />
          <Text style={styles.loadingText}>Creating your listing...</Text>
        </View>
      </InteriorShell>
    );
  }

  return (
    <InteriorShell onNavigate={onNavigate} title="Create Listing" scrollable={false}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressStep, step === 'category' && styles.progressStepActive]}>
            <Text style={styles.progressNumber}>1</Text>
            <Text style={styles.progressLabel}>Category</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={[styles.progressStep, step === 'details' && styles.progressStepActive]}>
            <Text style={styles.progressNumber}>2</Text>
            <Text style={styles.progressLabel}>Details</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={[styles.progressStep, step === 'review' && styles.progressStepActive]}>
            <Text style={styles.progressNumber}>3</Text>
            <Text style={styles.progressLabel}>Review</Text>
          </View>
        </View>

        {/* Step 1: Category */}
        {step === 'category' && (
          <YStack gap="$4">
            <Text style={styles.stepTitle}>Choose a Category</Text>
            <View style={styles.categoryGrid}>
              {[
                { value: 'gift-cards', label: 'Gift Cards', icon: 'card-outline' },
                { value: 'game-accounts', label: 'Game Accounts', icon: 'game-controller-outline' },
                { value: 'software', label: 'Software', icon: 'cube-outline' },
                { value: 'courses', label: 'Courses', icon: 'book-outline' },
                { value: 'templates', label: 'Templates', icon: 'document-outline' },
                { value: 'ebooks', label: 'E-Books', icon: 'document-text-outline' }
              ].map((cat) => (
                <Pressable
                  key={cat.value}
                  style={[
                    styles.categoryCard,
                    form.category === cat.value && styles.categoryCardActive
                  ]}
                  onPress={() => setForm({ ...form, category: cat.value })}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={32}
                    color={form.category === cat.value ? colors.primary : colors.textMuted}
                  />
                  <Text style={[styles.categoryLabel, form.category === cat.value && styles.categoryLabelActive]}>
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </YStack>
        )}

        {/* Step 2: Details */}
        {step === 'details' && (
          <YStack gap="$4">
            <Text style={styles.stepTitle}>Listing Details</Text>

            <YStack gap="$2">
              <Text style={styles.label}>Title *</Text>
              <AppTextInput
                placeholder="e.g., Xbox Game Pass 3 Months"
                value={form.title}
                onChangeText={(text) => setForm({ ...form, title: text })}
              />
            </YStack>

            <YStack gap="$2">
              <Text style={styles.label}>Short Description</Text>
              <AppTextInput
                placeholder="Brief one-liner"
                value={form.shortDescription}
                onChangeText={(text) => setForm({ ...form, shortDescription: text })}
                multiline
              />
            </YStack>

            <YStack gap="$2">
              <Text style={styles.label}>Full Description</Text>
              <AppTextInput
                placeholder="Complete details about your product"
                value={form.longDescription}
                onChangeText={(text) => setForm({ ...form, longDescription: text })}
                multiline
                numberOfLines={4}
              />
            </YStack>

            <View style={styles.priceRow}>
              <YStack gap="$2" style={styles.priceField}>
                <Text style={styles.label}>Price *</Text>
                <AppTextInput
                  placeholder="9.99"
                  value={form.price}
                  onChangeText={(text) => setForm({ ...form, price: text })}
                                  />
              </YStack>

              <YStack gap="$2" style={styles.currencyField}>
                <Text style={styles.label}>Currency</Text>
                <View style={styles.currencySelect}>
                  <Text>{form.currency}</Text>
                </View>

                <Text style={styles.inlineLabel}>Seller reach</Text>
                <View style={styles.optionGrid}>
                  {centerData.formConfig.reachScopes.map((item) => (
                    <ScopeCard
                      active={form.fulfillmentScope === item.code}
                      compact={isSingleColumn}
                      key={item.code}
                      option={item}
                      onPress={() => setForm((current) => ({ ...current, fulfillmentScope: item.code }))}
                    />
                  ))}
                </View>
              </YStack>
            </View>

            <YStack gap="$2">
              <Text style={styles.label}>Stock</Text>
              <AppTextInput
                placeholder="1"
                value={form.stock}
                onChangeText={(text) => setForm({ ...form, stock: text })}
                />
            </YStack>
          </YStack>
        )}

        {/* Step 3: Review */}
        {step === 'review' && (
          <YStack gap="$4">
            <Text style={styles.stepTitle}>Review Your Listing</Text>

            <Card style={styles.reviewCard}>
              <YStack gap="$3">
                <View>
                  <Text style={styles.reviewLabel}>Title</Text>
                  <Text style={styles.reviewValue}>{form.title}</Text>
                </View>

                <View>
                  <Text style={styles.reviewLabel}>Category</Text>
                  <Text style={styles.reviewValue}>{form.category}</Text>
                </View>

                <View>
                  <Text style={styles.reviewLabel}>Price</Text>
                  <Text style={styles.reviewValue}>
                    {form.currency} {form.price}
                  </Text>
                </View>

                {form.shortDescription && (
                  <View>
                    <Text style={styles.reviewLabel}>Short Description</Text>
                    <Text style={styles.reviewValue}>{form.shortDescription}</Text>
                  </View>
                )}

                {form.longDescription && (
                  <View>
                    <Text style={styles.reviewLabel}>Full Description</Text>
                    <Text style={styles.reviewValue}>{form.longDescription}</Text>
                  </View>
                )}
              </YStack>
            </Card>

            <View style={styles.trustBadge}>
              <Ionicons name="shield-checkmark" size={16} color={colors.success} />
              <Text style={styles.trustText}>Your listing will be reviewed before going live</Text>
            </View>
          </YStack>
        )}

        {/* Message */}
        {message && (
          <Card style={[styles.messageCard, message.includes('Error') && styles.messageCardError]}>
            <Text style={styles.messageText}>{message}</Text>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {step !== 'category' && (
            <Button
              theme="purple"
              onPress={() => {
                if (step === 'details') setStep('category');
                else setStep('details');
              }}
            >
              Back
            </Button>
          )}

          {step !== 'review' && (
            <Button theme="purple" onPress={handleNext}>
              Next
            </Button>
          )}

          {step === 'review' && (
            <Button theme="purple" onPress={handleSubmit}>
              Publish Listing
            </Button>
          )}
        </View>
      </ScrollView>
    </InteriorShell>
  );
}

const { Pressable } = require('react-native');

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing['6xl']
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md
  },
  loadingText: {
    fontSize: 16,
    color: colors.textMuted
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl
  },
  progressStep: {
    alignItems: 'center',
    gap: spacing.xs
  },
  progressStepActive: {
    opacity: 1
  },
  progressNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceVariant,
    textAlign: 'center',
    lineHeight: 32,
    color: colors.textMuted,
    fontWeight: '600'
  },
  progressLabel: {
    fontSize: 12,
    color: colors.textMuted
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.md
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md
  },
  categoryCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md
  },
  categoryCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center'
  },
  categoryLabelActive: {
    color: colors.white
  },
  priceRow: {
    flexDirection: 'row',
    gap: spacing.md
  },
  priceField: {
    flex: 2
  },
  currencyField: {
    flex: 1
  },
  currencySelect: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: radii.md,
    padding: spacing.md,
    justifyContent: 'center'
  },
  reviewCard: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: radii.lg,
    padding: spacing.lg
  },
  reviewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.xs
  },
  reviewValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    gap: spacing.xs
  },
  trustText: {
    color: colors.successDark,
    fontSize: 12,
    fontWeight: '600'
  },
  messageCard: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: radii.md,
    padding: spacing.md
  },
  messageCardError: {
    backgroundColor: colors.errorLight
  },
  messageText: {
    fontSize: 14,
    color: colors.textPrimary
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'flex-end'
  }
});
