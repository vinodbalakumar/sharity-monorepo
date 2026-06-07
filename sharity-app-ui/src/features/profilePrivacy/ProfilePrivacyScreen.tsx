import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Input, Paragraph, XStack } from 'tamagui';

import { InteriorShell } from '../../components/appShell/InteriorShell';
import { colors, radius, spacing } from '../../theme';
import { authPalette } from '../auth/authTheme';
import type { AppRoute } from '../../types/navigation';
import { logoutBrowserSession } from '../../services/sessionService';
import { getRegistrationOptions } from '../../services/authApi';
import { getCurrentUser, getCurrentUserSessions, getCurrentUserSocialLinks, revokeAllCurrentUserSessions, revokeCurrentUserSession, startGoogleLink, updateCurrentUserProfile, uploadCurrentUserProfileImage, type CurrentUser, type SocialLink, type UserSession } from '../../services/userApi';

type Props = {
  onNavigate: (route: AppRoute) => void;
};

type CountryOption = {
  countryCode: string;
  countryName: string;
  phoneDialCode: string;
  defaultCurrencyCode: string;
};

type GenderOption = {
  code: string;
  label: string;
};

const privacyOptions = ['PRIVATE', 'VISIBLE_AFTER_ORDER', 'PUBLIC_WITHIN_SHARITY'] as const;
const PROFILE_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;

export function ProfilePrivacyScreen({ onNavigate }: Props) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [genders, setGenders] = useState<GenderOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    countryCode: '',
    countryName: '',
    phoneDialCode: '',
    dateOfBirth: '',
    gender: '',
    profileImageUrl: '',
    privacySetting: 'VISIBLE_AFTER_ORDER'
  });
  const googleLinked = socialLinks.some((link) => link.provider.toUpperCase() === 'GOOGLE');

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [currentUser, currentSessions, registrationOptions] = await Promise.all([
        getCurrentUser(),
        getCurrentUserSessions(),
        getRegistrationOptions()
      ]);
      const links = await getCurrentUserSocialLinks().catch(() => []);
      setUser(currentUser);
      setSessions(currentSessions);
      setSocialLinks(links);
      setCountries(registrationOptions.countries);
      setGenders(registrationOptions.genders);
      setForm({
        firstName: currentUser.profile.firstName ?? '',
        lastName: currentUser.profile.lastName ?? '',
        phoneNumber: currentUser.profile.phoneNumber ?? '',
        countryCode: currentUser.profile.countryCode ?? '',
        countryName: currentUser.profile.countryName ?? '',
        phoneDialCode: currentUser.profile.phoneDialCode ?? '',
        dateOfBirth: currentUser.profile.dateOfBirth ?? '',
        gender: currentUser.profile.gender ?? '',
        profileImageUrl: currentUser.profile.profileImageUrl ?? '',
        privacySetting: currentUser.profile.privacySetting ?? 'VISIBLE_AFTER_ORDER'
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load profile');
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    setSaving(true);
    setError('');
    try {
      const updated = await updateCurrentUserProfile({
        ...form,
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender || null,
        profileImageUrl: form.profileImageUrl || null,
        privacySetting: form.privacySetting || null
      });
      setUser((current) => current ? { ...current, profile: { ...current.profile, ...updated } } : current);
      setMessage('Profile updated from live account data.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save profile');
    } finally {
      setSaving(false);
    }
  }

  async function changeProfileImage() {
    if (uploadingImage) {
      return;
    }
    const confirmed = await confirmProfileImageUpload();
    if (!confirmed) {
      return;
    }
    setUploadingImage(true);
    setError('');
    setMessage('');
    try {
      let filePayload: Blob & { name?: string };
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/jpeg,image/png,image/webp';
        input.style.position = 'fixed';
        input.style.left = '-9999px';
        input.style.top = '-9999px';
        const selected = await new Promise<File | null>((resolve) => {
          input.onchange = () => {
            const file = input.files?.[0] ?? null;
            input.remove();
            resolve(file);
          };
          document.body.appendChild(input);
          input.click();
        });
        if (!selected) {
          setUploadingImage(false);
          return;
        }
        filePayload = selected;
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          throw new Error('Photo library permission is required to update your profile image');
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.9,
          mediaTypes: ImagePicker.MediaTypeOptions.Images
        });
        if (result.canceled) {
          setUploadingImage(false);
          return;
        }
        const asset = result.assets[0];
        if (!asset) {
          setUploadingImage(false);
          return;
        }
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        filePayload = blob as Blob & { name?: string };
        filePayload.name = asset.fileName ?? 'profile-image.jpg';
      }
      const fileSize = typeof filePayload.size === 'number' ? filePayload.size : 0;
      if (fileSize > PROFILE_IMAGE_MAX_SIZE_BYTES) {
        throw new Error('Profile photo must be 5 MB or smaller.');
      }
      const updated = await uploadCurrentUserProfileImage(filePayload);
      setForm((current) => ({ ...current, profileImageUrl: updated.profileImageUrl }));
      setUser((current) => current ? { ...current, profile: { ...current.profile, profileImageUrl: updated.profileImageUrl } } : current);
      setMessage('Profile image updated.');
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.location.reload();
        return;
      }
      await load();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload profile image');
    } finally {
      setUploadingImage(false);
    }
  }

  async function signOut() {
    try {
      await logoutBrowserSession();
      onNavigate('welcome');
    } catch {
      setError('Unable to sign out right now.');
    }
  }

  async function revokeSession(sessionId: number) {
    try {
      await revokeCurrentUserSession(sessionId);
      setSessions((current) => current.filter((session) => session.id !== sessionId));
      setMessage('Session revoked.');
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : 'Unable to revoke session');
    }
  }

  async function revokeAllSessions() {
    try {
      await revokeAllCurrentUserSessions();
      setSessions([]);
      setMessage('All sessions revoked.');
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : 'Unable to revoke sessions');
    }
  }

  function selectCountry(country: CountryOption) {
    setForm((current) => ({
      ...current,
      countryCode: country.countryCode,
      countryName: country.countryName,
      phoneDialCode: country.phoneDialCode
    }));
  }

  function setPhone(value: string) {
    setForm((current) => ({
      ...current,
      phoneNumber: value.replace(/\D/g, '').slice(0, 10)
    }));
  }

  function confirmProfileImageUpload(): Promise<boolean> {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return Promise.resolve(window.confirm('Upload this photo to your profile?'));
    }
    return new Promise((resolve) => {
      Alert.alert(
        'Upload profile photo',
        'Do you want to upload this photo to your profile now?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Upload', style: 'default', onPress: () => resolve(true) }
        ],
        { cancelable: true, onDismiss: () => resolve(false) }
      );
    });
  }

  const displayName = useMemo(() => {
    const first = form.firstName.trim();
    const last = form.lastName.trim();
    return [first, last].filter(Boolean).join(' ') || user?.username || user?.email || 'Sharity user';
  }, [form.firstName, form.lastName, user?.email, user?.username]);

  return (
    <InteriorShell activeLabel="Profile" onNavigate={onNavigate} scrollable={false} subtitle="Real account profile, sessions, and privacy settings" title="Profile & Privacy">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>

          {loading ? <StateCard title="Loading account details..." /> : null}
          {error ? <StateCard title={error} actionLabel="Reload" onAction={load} /> : null}
          {message ? <StateCard title={message} /> : null}

          {!loading && user ? (
            <>
              <View style={styles.grid}>
              <View style={styles.leftColumn}>
                <Card style={styles.card}>
                  <View style={styles.hero}>
                    <View style={styles.avatarWrap}>
                      {user.profile.profileImageUrl ? (
                        <Image source={user.profile.profileImageUrl} style={styles.avatar} contentFit="cover" />
                      ) : (
                        <View style={styles.avatarFallback}>
                          <Text style={styles.avatarInitials}>{initials(displayName)}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.displayName}>{displayName}</Text>
                    <Text style={styles.subcopy}>{user.email}</Text>
                    <XStack gap="$2" flexWrap="wrap" justifyContent="center">
                      <Pill label={user.status} tone="info" />
                      <Pill label={user.profileCompletionStatus} tone={user.profileCompletionStatus === 'COMPLETE' ? 'success' : 'warning'} />
                      {user.roles.map((role) => <Pill key={role} label={role} tone="neutral" />)}
                    </XStack>
                  </View>
                </Card>

                <Card style={styles.card}>
                  <SectionTitle title="Sessions" />
                  <View style={styles.sessionActions}>
                    <Button accessibilityLabel="Revoke all sessions" onPress={revokeAllSessions} theme="red">
                      Revoke All
                    </Button>
                  </View>
                  <ScrollView
                    contentContainerStyle={styles.sessionList}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator
                    style={styles.sessionScroll}
                  >
                    {sessions.length === 0 ? <Paragraph color="$gray10">No active sessions found.</Paragraph> : null}
                    {sessions.map((session) => (
                      <View key={session.id} style={styles.sessionRow}>
                        <View style={styles.sessionMeta}>
                          <Text style={styles.sessionTitle}>{session.deviceName ?? 'Unknown device'}</Text>
                          <Text style={styles.sessionText}>{session.ipAddress ?? 'Unknown IP'}</Text>
                          <Text style={styles.sessionText}>{session.lastUsedAt ? `Last used ${formatDate(session.lastUsedAt)}` : 'No recent usage data'}</Text>
                        </View>
                        <Button accessibilityLabel={`Revoke session ${session.id}`} onPress={() => revokeSession(session.id)} size="$2">
                          Revoke
                        </Button>
                      </View>
                    ))}
                  </ScrollView>
                </Card>
              </View>

              <View style={styles.rightColumn}>
                <Card style={styles.card}>
                  <SectionTitle title="Profile details" />
                  <View style={styles.formGrid}>
                    <Field label="First name" value={form.firstName} onChangeText={(value) => setForm((current) => ({ ...current, firstName: value }))} />
                    <Field label="Last name" value={form.lastName} onChangeText={(value) => setForm((current) => ({ ...current, lastName: value }))} />
                    <Field label="Phone number" value={form.phoneNumber} onChangeText={setPhone} keyboardType="phone-pad" helper="10 digits only" />
                    <Field label="Date of birth" value={form.dateOfBirth} onChangeText={(value) => setForm((current) => ({ ...current, dateOfBirth: value }))} type={Platform.OS === 'web' ? 'date' : 'text'} helper="Web uses the native date picker." />
                    <View style={styles.field}>
                      <Text style={styles.label}>Profile image</Text>
                      <View style={styles.imageControl}>
                        <View style={styles.imagePreviewSmall}>
                          {form.profileImageUrl ? (
                            <Image contentFit="cover" source={{ uri: form.profileImageUrl }} style={styles.imagePreviewPhoto} />
                          ) : (
                            <View style={styles.imagePreviewFallback}>
                              <Ionicons color={authPalette.textMuted} name="person-circle-outline" size={28} />
                            </View>
                          )}
                        </View>
                        <View style={styles.imageControlCopy}>
                          <Text style={styles.imageControlTitle}>{form.profileImageUrl ? 'Photo on file' : 'No profile photo yet'}</Text>
                          <Text style={styles.imageControlText}>Upload a JPG, PNG, or WEBP photo from your device. Max size: 5 MB.</Text>
                          <View style={styles.imageControlActions}>
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={form.profileImageUrl ? 'Update profile photo' : 'Add profile photo'}
                              disabled={uploadingImage}
                              onPress={changeProfileImage}
                              style={[styles.photoButton, uploadingImage && styles.photoButtonDisabled]}
                            >
                              {uploadingImage ? (
                                <ActivityIndicator color={authPalette.white} />
                              ) : (
                                <Ionicons color={authPalette.white} name="cloud-upload-outline" size={18} />
                              )}
                              <Text style={styles.photoButtonText}>{form.profileImageUrl ? 'Update photo' : 'Add photo'}</Text>
                            </Pressable>
                            {form.profileImageUrl ? (
                              <Pressable accessibilityLabel="Remove profile photo" onPress={() => setForm((current) => ({ ...current, profileImageUrl: '' }))} style={styles.photoLinkButton}>
                                <Text style={styles.photoLinkText}>Remove</Text>
                              </Pressable>
                            ) : null}
                          </View>
                          <Text style={styles.photoHint}>{uploadingImage ? 'Uploading...' : 'Stored in your account profile. The page refreshes after upload.'}</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <Subsection title="Country">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                      {countries.map((country) => {
                        const selected = form.countryCode === country.countryCode;
                        return (
                          <Pressable key={country.countryCode} accessibilityLabel={`Country ${country.countryName}`} onPress={() => selectCountry(country)} style={[styles.chip, selected && styles.chipActive]}>
                            <Text style={[styles.chipTitle, selected && styles.chipTitleActive]}>{country.countryName}</Text>
                            <Text style={[styles.chipSubcopy, selected && styles.chipSubcopyActive]}>{country.countryCode} · {country.phoneDialCode}</Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </Subsection>

                  <Subsection title="Gender">
                    <View style={styles.chipRow}>
                      {genders.map((gender) => {
                        const selected = form.gender === gender.code;
                        return (
                          <Pressable key={gender.code} accessibilityLabel={`Gender ${gender.label}`} onPress={() => setForm((current) => ({ ...current, gender: gender.code }))} style={[styles.chip, selected && styles.chipActive]}>
                            <Text style={[styles.chipTitle, selected && styles.chipTitleActive]}>{gender.label}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </Subsection>

                  <Subsection title="Privacy setting">
                    <View style={styles.chipRow}>
                      {privacyOptions.map((option) => {
                        const selected = form.privacySetting === option;
                        return (
                          <Pressable key={option} accessibilityLabel={`Privacy ${option}`} onPress={() => setForm((current) => ({ ...current, privacySetting: option }))} style={[styles.chip, selected && styles.chipActive]}>
                            <Text style={[styles.chipTitle, selected && styles.chipTitleActive]}>{privacyLabel(option)}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </Subsection>
                </Card>

                <Card style={styles.card}>
                  <SectionTitle title="Account summary" />
                  <SummaryRow label="Display name" value={displayName} />
                  <SummaryRow label="Country" value={form.countryName || 'Not set'} />
                  <SummaryRow label="Phone code" value={form.phoneDialCode || 'Not set'} />
                  <SummaryRow label="DOB" value={form.dateOfBirth || 'Not set'} />
                  <SummaryRow label="Privacy" value={privacyLabel(form.privacySetting)} />
                  <SummaryRow label="Email verified" value={user.emailVerified ? 'Yes' : 'No'} />
                </Card>
              </View>

              </View>

              <View style={styles.actionsFooter}>
                <Button accessibilityLabel="Save profile" disabled={saving || loading} icon={<Ionicons name="save-outline" size={18} />} onPress={saveProfile} theme="purple">
                  {saving ? 'Saving...' : 'Save Profile'}
                </Button>
                <Button accessibilityLabel="Sign out" icon={<Ionicons name="log-out-outline" size={18} />} onPress={signOut} theme="red">
                  Sign Out
                </Button>
                {!googleLinked ? (
                  <Button accessibilityLabel="Link Google account" icon={<Ionicons name="logo-google" size={18} />} onPress={startGoogleLink}>
                    Link Google
                  </Button>
                ) : null}
              </View>
            </>
          ) : null}
        </View>
      </ScrollView>
    </InteriorShell>
  );
}

function Field({
  label,
  value,
  onChangeText,
  helper,
  keyboardType,
  type
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  helper?: string;
  keyboardType?: 'default' | 'phone-pad';
  type?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Input
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        style={styles.input}
        type={type as never}
        value={value}
      />
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.subsection}>
      <Text style={styles.sectionLabel}>{title}</Text>
      {children}
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <XStack ai="center" jc="space-between" py="$2">
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </XStack>
  );
}

function StateCard({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <Card style={styles.stateCard}>
      <Text style={styles.stateText}>{title}</Text>
      {actionLabel ? <Button accessibilityLabel={actionLabel} onPress={onAction} size="$2">{actionLabel}</Button> : null}
    </Card>
  );
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'S';
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function privacyLabel(value: string) {
  if (value === 'PRIVATE') {
    return 'Private';
  }
  if (value === 'VISIBLE_AFTER_ORDER') {
    return 'Visible after order';
  }
  if (value === 'PUBLIC_WITHIN_SHARITY') {
    return 'Public within Sharity';
  }
  return value;
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
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'flex-end'
  },
  actionsFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'flex-end',
    paddingTop: spacing.sm
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
  hero: {
    alignItems: 'center',
    gap: spacing.sm
  },
  avatarWrap: {
    height: 84,
    width: 84
  },
  avatar: {
    borderRadius: 42,
    height: 84,
    width: 84
  },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: '#EAEAFE',
    borderRadius: 42,
    height: 84,
    justifyContent: 'center',
    width: 84
  },
  avatarInitials: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '900'
  },
  displayName: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '900'
  },
  subcopy: {
    color: colors.textSecondary,
    fontSize: 14
  },
  sessionActions: {
    alignItems: 'flex-end',
    marginBottom: spacing.sm
  },
  sessionScroll: {
    maxHeight: 320
  },
  sessionList: {
    gap: spacing.sm
  },
  sessionRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    paddingBottom: spacing.sm
  },
  sessionMeta: {
    flex: 1,
    gap: 2
  },
  sessionTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800'
  },
  sessionText: {
    color: colors.textSecondary,
    fontSize: 12
  },
  formGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between'
  },
  field: {
    flexBasis: '48%',
    gap: 6,
    minWidth: 240
  },
  imageControl: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md
  },
  imagePreviewSmall: {
    height: 72,
    overflow: 'hidden',
    width: 72
  },
  imagePreviewPhoto: {
    borderRadius: 14,
    height: '100%',
    width: '100%'
  },
  imagePreviewFallback: {
    alignItems: 'center',
    backgroundColor: '#F4F7FB',
    borderRadius: 14,
    height: '100%',
    justifyContent: 'center',
    width: '100%'
  },
  imageControlCopy: {
    flex: 1,
    gap: 6
  },
  inlineEditor: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm
  },
  inlineEditorInput: {
    backgroundColor: '#fff',
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.textPrimary,
    flex: 1,
    fontSize: 14,
    minHeight: 42,
    paddingHorizontal: spacing.sm
  },
  imageControlTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800'
  },
  imageControlText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16
  },
  imageControlActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: 2
  },
  photoButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  photoButtonDisabled: {
    opacity: 0.65
  },
  photoButtonText: {
    color: authPalette.white,
    fontSize: 13,
    fontWeight: '800'
  },
  photoLinkButton: {
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  photoLinkText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '800'
  },
  photoHint: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16
  },
  fieldError: {
    color: authPalette.danger,
    fontSize: 12,
    marginTop: 6
  },
  label: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '800'
  },
  input: {
    backgroundColor: '#fff',
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 48,
    paddingHorizontal: 14
  },
  helper: {
    color: colors.textSecondary,
    fontSize: 12
  },
  subsection: {
    gap: spacing.sm,
    marginTop: spacing.lg
  },
  sectionLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '900'
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingRight: spacing.sm
  },
  chip: {
    backgroundColor: '#fff',
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 2,
    minWidth: 120,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  chipActive: {
    backgroundColor: '#F1FBF7',
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
  chipSubcopy: {
    color: colors.textSecondary,
    fontSize: 11
  },
  chipSubcopyActive: {
    color: colors.primary
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700'
  },
  summaryValue: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '900'
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
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: spacing.sm
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




