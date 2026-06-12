import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button, Card, Input, Paragraph, XStack } from 'tamagui';

import { InteriorShell } from '../../components/appShell/InteriorShell';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { colors, radius, spacing } from '../../theme';
import { authPalette } from '../auth/authTheme';
import type { AppRoute } from '../../types/navigation';
import { getBrowserSessionSummary, logoutBrowserSession } from '../../services/sessionService';
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
  const { isCompactPhone, isSingleColumn } = useResponsiveLayout();
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
      const browserSession = await getBrowserSessionSummary();
      const links = await getCurrentUserSocialLinks().catch(() => []);
      setUser(currentUser);
      setSessions(mergeSessions(currentSessions, browserSession));
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
        <View style={[styles.container, isCompactPhone && styles.containerCompact]}>

          {loading ? <StateCard title="Loading account details..." /> : null}
          {error ? <StateCard title={error} actionLabel="Reload" onAction={load} /> : null}
          {message ? <StateCard title={message} /> : null}

          {!loading && user ? (
            <>
              <View style={[styles.grid, isSingleColumn && styles.gridStacked]}>
              <View style={[styles.leftColumn, isSingleColumn && styles.leftColumnStacked]}>
                <Card style={styles.card}>
                  <View style={styles.hero}>
                    <Pressable
                      accessibilityLabel={form.profileImageUrl ? 'Change profile photo' : 'Add profile photo'}
                      accessibilityRole="button"
                      disabled={uploadingImage}
                      onPress={changeProfileImage}
                      style={[styles.avatarPressable, uploadingImage && styles.avatarPressableDisabled]}
                    >
                      <View style={styles.avatarWrap}>
                        {user.profile.profileImageUrl ? (
                          <Image source={user.profile.profileImageUrl} style={styles.avatar as never} contentFit="cover" />
                        ) : (
                          <View style={styles.avatarFallback}>
                            <Text style={styles.avatarInitials}>{initials(displayName)}</Text>
                          </View>
                        )}
                        <View style={styles.avatarEditBadge}>
                          {uploadingImage ? (
                            <ActivityIndicator color={authPalette.white} size="small" />
                          ) : (
                            <Ionicons color={authPalette.white} name="camera-outline" size={16} />
                          )}
                        </View>
                      </View>
                    </Pressable>
                    <Text style={styles.avatarHint}>{uploadingImage ? 'Uploading photo...' : form.profileImageUrl ? 'Tap photo to change it' : 'Tap avatar to add a photo'}</Text>
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
                      <View key={session.id} style={[styles.sessionRow, isCompactPhone && styles.sessionRowCompact]}>
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
                  <View style={[styles.formGrid, isCompactPhone && styles.formGridCompact]}>
                    <Field compact={isCompactPhone} label="First name" value={form.firstName} onChangeText={(value) => setForm((current) => ({ ...current, firstName: value }))} />
                    <Field compact={isCompactPhone} label="Last name" value={form.lastName} onChangeText={(value) => setForm((current) => ({ ...current, lastName: value }))} />
                    <Field compact={isCompactPhone} label="Phone number" value={form.phoneNumber} onChangeText={setPhone} keyboardType="phone-pad" helper="10 digits only" />
                    <DateField compact={isCompactPhone} label="Date of birth" value={form.dateOfBirth} onChangeText={(value) => setForm((current) => ({ ...current, dateOfBirth: value }))} />
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
                    <View style={[styles.chipRow, isCompactPhone && styles.chipRowCompact]}>
                      {genders.map((gender) => {
                        const selected = form.gender === gender.code;
                        return (
                          <Pressable key={gender.code} accessibilityLabel={`Gender ${gender.label}`} onPress={() => setForm((current) => ({ ...current, gender: gender.code }))} style={[styles.chip, isCompactPhone && styles.chipCompact, selected && styles.chipActive]}>
                            <Text style={[styles.chipTitle, selected && styles.chipTitleActive]}>{gender.label}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </Subsection>

                  <Subsection title="Privacy setting">
                    <View style={[styles.chipRow, isCompactPhone && styles.chipRowCompact]}>
                      {privacyOptions.map((option) => {
                        const selected = form.privacySetting === option;
                        return (
                          <Pressable key={option} accessibilityLabel={`Privacy ${option}`} onPress={() => setForm((current) => ({ ...current, privacySetting: option }))} style={[styles.chip, isCompactPhone && styles.chipCompact, selected && styles.chipActive]}>
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

              <View style={[styles.actionsFooter, isCompactPhone && styles.actionsFooterCompact]}>
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
  compact,
  label,
  value,
  onChangeText,
  helper,
  keyboardType,
  type
}: {
  compact?: boolean;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  helper?: string;
  keyboardType?: 'default' | 'phone-pad';
  type?: string;
}) {
  return (
    <View style={[styles.field, compact && styles.fieldCompact]}>
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

function DateField({
  compact,
  label,
  value,
  onChangeText
}: {
  compact?: boolean;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  const isWeb = Platform.OS === 'web';
  const browserValue = profileBrowserDateValue(value);
  const displayValue = profileDisplayDateValue(value);

  return (
    <View style={[styles.field, compact && styles.fieldCompact]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.dateWrap}>
        {isWeb ? (
          <View style={styles.webDateInputShell}>
            <input
              aria-label={label}
              onChange={(event) => onChangeText(profileDisplayDateValue(event.currentTarget.value))}
              style={styles.webDateInput as never}
              type="date"
              value={browserValue}
            />
          </View>
        ) : (
          <TextInput
            keyboardType="number-pad"
            onChangeText={(next) => onChangeText(profileDisplayDateValue(next))}
            placeholder="mm/dd/yyyy"
            placeholderTextColor={colors.textSecondary}
            style={styles.dateInput}
            value={displayValue}
          />
        )}
        {!isWeb ? (
          <View pointerEvents="none" style={styles.dateIconWrap}>
            <Ionicons color={colors.textSecondary} name="calendar-outline" size={18} />
          </View>
        ) : null}
      </View>
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

function profileParseUsDate(value: string) {
  if (!value.trim()) {
    return null;
  }
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
  if (!match) {
    return null;
  }
  const month = match[1];
  const day = match[2];
  const year = match[3];
  if (!month || !day || !year) {
    return null;
  }
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function profileFormatIsoToUsDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    return '';
  }
  const year = match[1];
  const month = match[2];
  const day = match[3];
  if (!year || !month || !day) {
    return '';
  }
  return `${month}/${day}/${year}`;
}

function profileBrowserDateValue(value: string) {
  if (!value.trim()) {
    return '';
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return value.trim();
  }
  return profileParseUsDate(value) ?? '';
}

function profileDisplayDateValue(value: string) {
  if (!value.trim()) {
    return '';
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return profileFormatIsoToUsDate(value);
  }
  return value;
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

function mergeSessions(sessions: UserSession[], browserSession: Awaited<ReturnType<typeof getBrowserSessionSummary>>): UserSession[] {
  if (!browserSession?.authenticated) {
    return sessions;
  }

  const currentSession: UserSession = {
    id: -1,
    deviceName: 'Current browser session',
    ipAddress: 'Managed by the web sign-in session',
    lastUsedAt: null,
    userAgent: browserSession.name ?? browserSession.email ?? 'Browser session'
  };

  return [currentSession, ...sessions];
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
  containerCompact: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md
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
  gridStacked: {
    flexDirection: 'column'
  },
  leftColumn: {
    gap: spacing.lg,
    width: 380
  },
  leftColumnStacked: {
    width: '100%'
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
    gap: spacing.xs
  },
  avatarPressable: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarPressableDisabled: {
    opacity: 0.8
  },
  avatarWrap: {
    height: 96,
    position: 'relative',
    width: 96
  },
  avatar: {
    borderRadius: 42,
    height: 84,
    width: 84
  },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: '#EAEAFE',
    borderRadius: 48,
    height: 96,
    justifyContent: 'center',
    width: 96
  },
  avatarInitials: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '900'
  },
  avatarEditBadge: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: colors.surface,
    borderRadius: 999,
    borderWidth: 3,
    bottom: -2,
    height: 30,
    justifyContent: 'center',
    position: 'absolute',
    right: -2,
    width: 30
  },
  avatarHint: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center'
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
  sessionRowCompact: {
    alignItems: 'flex-start',
    flexDirection: 'column'
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
  currentSessionBadge: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    paddingVertical: 10
  },
  formGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between'
  },
  formGridCompact: {
    gap: spacing.sm
  },
  field: {
    flexBasis: '48%',
    gap: 6,
    minWidth: 240
  },
  fieldCompact: {
    flexBasis: '100%',
    minWidth: 0
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
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 48,
    paddingHorizontal: 14
  },
  dateWrap: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 48,
    paddingLeft: 14,
    paddingRight: 8
  },
  webDateInputShell: {
    flex: 1,
    minWidth: 0
  },
  webDateInput: {
    appearance: 'none' as never,
    backgroundColor: 'transparent',
    borderWidth: 0,
    color: colors.textPrimary,
    fontSize: 14,
    height: 46,
    outlineStyle: 'none' as never,
    width: '100%'
  },
  dateInput: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: 14,
    minHeight: 46,
    outlineStyle: 'none' as never,
    paddingVertical: 10
  },
  dateIconWrap: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 32
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
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingRight: spacing.sm
  },
  chipRowCompact: {
    flexDirection: 'column',
    paddingRight: 0
  },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 2,
    minWidth: 120,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  chipCompact: {
    minWidth: 0,
    width: '100%'
  },
  chipActive: {
    backgroundColor: colors.surfaceVariant,
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
    ,textAlign: 'center'
    ,width: '100%'
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




