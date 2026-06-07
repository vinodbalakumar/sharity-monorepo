import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { VisitorContextResponse } from '../../services/publicContentApi';
import {
  completeSocialRegistration,
  getRegistrationOptions,
  getSocialRegistrationSession,
  uploadSocialProfileImage,
  type RegistrationCountryOption,
  type RegistrationGenderOption,
  type SocialRegistrationSession
} from '../../services/authApi';
import { authPalette, authSpacing } from './authTheme';
import { AuthOptionModal, type AuthOption } from './AuthOptionModal';
import { LegalContentModal } from './LegalContentModal';
import type { AppRoute } from '../../types/navigation';

type SocialProvider = 'Google';

type Props = {
  onCancel: () => void;
  onNavigate: (route: AppRoute) => void;
  onSignIn: () => void;
  provider: SocialProvider;
  visitorContext?: VisitorContextResponse | null;
};

type FormState = {
  countryCode: string;
  countryName: string;
  dateOfBirth: string;
  gender: string;
  phoneDialCode: string;
  phoneNumber: string;
  privacySetting: string;
  termsAccepted: boolean;
  username: string;
};

type FormErrors = Partial<Record<keyof FormState, string>> & {
  profileImageUrl?: string;
};

const initialForm: FormState = {
  countryCode: '',
  countryName: '',
  dateOfBirth: '',
  gender: '',
  phoneDialCode: '',
  phoneNumber: '',
  privacySetting: 'PRIVATE',
  termsAccepted: false,
  username: ''
};

const MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_PROFILE_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const privacyOptions: AuthOption[] = [
  { key: 'PRIVATE', title: 'Private', subtitle: 'Visible only to you and approved Sharity services' },
  { key: 'LIMITED', title: 'Limited', subtitle: 'Visible to trusted connections and support tools' },
  { key: 'PUBLIC', title: 'Public', subtitle: 'Visible according to your marketplace settings' }
];

export function CompleteSocialRegistrationScreen({ onCancel, onNavigate, onSignIn, provider, visitorContext }: Props) {
  const { width } = useWindowDimensions();
  const isMobile = width < 760;
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [conflictPrompt, setConflictPrompt] = useState(false);
  const [session, setSession] = useState<SocialRegistrationSession | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [profileImageName, setProfileImageName] = useState('');
  const [registrationOptions, setRegistrationOptions] = useState<{ countries: RegistrationCountryOption[]; genders: RegistrationGenderOption[] }>({
    countries: [],
    genders: []
  });
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [genderPickerVisible, setGenderPickerVisible] = useState(false);
  const [privacyPickerVisible, setPrivacyPickerVisible] = useState(false);
  const [legalModalSlug, setLegalModalSlug] = useState<'terms' | 'privacy' | null>(null);

  const selectedCountry = useMemo(
    () => registrationOptions.countries.find((country) => country.countryCode === form.countryCode) ?? null,
    [form.countryCode, registrationOptions.countries]
  );
  const selectedGender = useMemo(
    () => registrationOptions.genders.find((gender) => gender.code === form.gender) ?? null,
    [form.gender, registrationOptions.genders]
  );

  useEffect(() => {
    let isMounted = true;
    getSocialRegistrationSession()
      .then((nextSession) => {
        if (!isMounted) {
          return;
        }
        setSession(nextSession);
        setForm((current) => ({
          ...current,
          username: current.username || usernameFromSession(nextSession)
        }));
      })
      .catch((error) => {
        if (isMounted) {
          setMessage(error instanceof Error ? error.message : 'Social registration session is not available.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    getRegistrationOptions()
      .then((options) => {
        if (!mounted) {
          return;
        }
        setRegistrationOptions(options);
        setForm((current) => applyCountryDefaults(current, options.countries, visitorContext));
      })
      .catch((error) => {
        if (mounted) {
          setMessage(error instanceof Error ? error.message : 'Unable to load registration options.');
        }
      });

    return () => {
      mounted = false;
    };
  }, [visitorContext]);

  useEffect(() => {
    if (!visitorContext || registrationOptions.countries.length === 0) {
      return;
    }
    setForm((current) => {
      if (current.countryCode && current.countryName && current.phoneDialCode) {
        return current;
      }
      const detected = findCountryByVisitorContext(registrationOptions.countries, visitorContext);
      if (!detected) {
        return current;
      }
      return {
        ...current,
        countryCode: current.countryCode || detected.countryCode,
        countryName: current.countryName || detected.countryName,
        phoneDialCode: current.phoneDialCode || detected.phoneDialCode
      };
    });
  }, [visitorContext, registrationOptions.countries]);

  function update(field: keyof FormState, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setMessage(null);
    setConflictPrompt(false);
  }

  function chooseCountry(country: RegistrationCountryOption) {
    setForm((current) => ({
      ...current,
      countryCode: country.countryCode,
      countryName: country.countryName,
      phoneDialCode: country.phoneDialCode
    }));
    setErrors((current) => ({ ...current, countryCode: undefined, phoneNumber: undefined }));
    setCountryPickerVisible(false);
    setMessage(null);
  }

  function chooseGender(gender: RegistrationGenderOption) {
    update('gender', gender.code);
    setGenderPickerVisible(false);
  }

  function choosePrivacy(option: AuthOption) {
    update('privacySetting', option.key);
    setPrivacyPickerVisible(false);
  }

  function chooseDateOfBirth(displayValue: string) {
    update('dateOfBirth', displayValue);
  }

  function openLegal(slug: 'terms' | 'privacy') {
    setLegalModalSlug(slug);
  }

  function validateForm() {
    const nextErrors: FormErrors = {};
    if (!selectedCountry) {
      nextErrors.countryCode = 'Please choose your country.';
    }
    if (!form.username.trim()) {
      nextErrors.username = 'Username is required.';
    } else if (form.username.trim().length > 100) {
      nextErrors.username = 'Username must be 100 characters or less.';
    }
    if (!form.phoneNumber.trim()) {
      nextErrors.phoneNumber = 'Phone number is required.';
    } else if (!/^\d{10}$/.test(form.phoneNumber.trim())) {
      nextErrors.phoneNumber = 'Phone number must be exactly 10 digits.';
    }
    const dateOfBirthIso = parseUsDate(form.dateOfBirth);
    if (!form.dateOfBirth.trim()) {
      nextErrors.dateOfBirth = 'Date of birth is required.';
    } else if (!dateOfBirthIso) {
      nextErrors.dateOfBirth = 'Use date of birth format mm/dd/yyyy.';
    } else if (isFutureDate(dateOfBirthIso)) {
      nextErrors.dateOfBirth = 'Date of birth cannot be in the future.';
    } else if (!isAtLeastAge(dateOfBirthIso, 13)) {
      nextErrors.dateOfBirth = 'You must be at least 13 years old.';
    }
    if (!selectedGender) {
      nextErrors.gender = 'Please choose your gender.';
    }
    if (!form.privacySetting.trim()) {
      nextErrors.privacySetting = 'Please choose a privacy setting.';
    }
    if (!form.termsAccepted) {
      nextErrors.termsAccepted = 'You must accept the terms to complete registration.';
    }
    return nextErrors;
  }

  async function complete() {
    if (submitting || uploadingProfileImage) {
      return;
    }
    const nextErrors = validateForm();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setMessage('Please review the highlighted fields.');
      return;
    }
    const dateOfBirthIso = parseUsDate(form.dateOfBirth);
    if (!selectedCountry || !selectedGender || !dateOfBirthIso) {
      setMessage('Please review the highlighted fields.');
      return;
    }

    setSubmitting(true);
    setMessage(null);
    setConflictPrompt(false);
    try {
      await completeSocialRegistration({
        countryCode: selectedCountry.countryCode,
        countryName: selectedCountry.countryName,
        dateOfBirth: dateOfBirthIso,
        gender: normalizeGender(form.gender),
        locale: getLocale(),
        phoneDialCode: selectedCountry.phoneDialCode,
        phoneNumber: form.phoneNumber.trim(),
        privacySetting: form.privacySetting,
        profileImageUrl: profileImageUrl || undefined,
        termsAccepted: form.termsAccepted,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        username: form.username.trim()
      });
      setMessage(null);
      onSignIn();
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : 'Unable to complete registration.';
      setMessage(nextMessage);
      setConflictPrompt(nextMessage.toLowerCase().includes('already registered'));
    } finally {
      setSubmitting(false);
    }
  }

  async function pickProfileImage() {
    if (uploadingProfileImage || submitting) {
      return;
    }
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      setErrors((current) => ({ ...current, profileImageUrl: 'Profile photo upload is available in the web app.' }));
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.style.position = 'fixed';
    input.style.left = '-9999px';
    input.style.top = '-9999px';

    input.onchange = async () => {
      const file = input.files?.[0];
      input.remove();
      if (!file) {
        return;
      }
      if (!ALLOWED_PROFILE_IMAGE_TYPES.has(file.type)) {
        setErrors((current) => ({ ...current, profileImageUrl: 'Use a JPG, PNG, or WEBP file.' }));
        return;
      }
      if (file.size > MAX_PROFILE_IMAGE_BYTES) {
        setErrors((current) => ({ ...current, profileImageUrl: 'Profile photo must be 5 MB or smaller.' }));
        return;
      }

      setUploadingProfileImage(true);
      setErrors((current) => ({ ...current, profileImageUrl: undefined }));
      setMessage(null);
      try {
        const response = await uploadSocialProfileImage(file);
        setProfileImageUrl(response.profileImageUrl);
        setProfileImageName(file.name);
      } catch (error) {
        const nextMessage = error instanceof Error ? error.message : 'Unable to upload profile photo.';
        setErrors((current) => ({ ...current, profileImageUrl: nextMessage }));
      } finally {
        setUploadingProfileImage(false);
      }
    };

    document.body.appendChild(input);
    input.click();
  }

  function removeProfileImage() {
    setProfileImageUrl('');
    setProfileImageName('');
    setErrors((current) => ({ ...current, profileImageUrl: undefined }));
  }

  function openDatePicker() {
    // Native branch keeps a visible picker button; web uses the native date input directly.
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Back" onPress={() => onNavigate('register')} style={styles.backButton}>
            <Ionicons color={authPalette.text} name="arrow-back-outline" size={22} />
          </Pressable>

          <View style={styles.brandWrap}>
            <View style={styles.brandMark}>
              <Text style={styles.brandLetter}>S</Text>
            </View>
            <View>
              <Text style={styles.brandName}>Sharity</Text>
              <Text style={styles.brandSubcopy}>{visitorContext?.countryName ?? 'Account completion'}</Text>
            </View>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.shell}>
          <View style={styles.hero}>
            <View style={styles.successBubble}>
              <Ionicons color={authPalette.success} name="checkmark-circle-outline" size={34} />
            </View>
            <Text style={styles.kicker}>SOCIAL REGISTRATION</Text>
            <Text style={[styles.title, isMobile && styles.titleMobile]}>Complete your registration</Text>
            <Text style={styles.subtitle}>
              You've successfully signed in with {provider}. Please provide a few more details to finish your account.
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.providerCard}>
              <Ionicons color={authPalette.success} name="checkmark-circle-outline" size={26} />
              <View style={styles.providerCopy}>
                <Text style={styles.providerTitle}>Information from {provider}</Text>
                <Text style={styles.providerText}>{providerSummary(session)}</Text>
              </View>
            </View>

            <View style={styles.sectionIntro}>
              <Text style={styles.sectionTitle}>Additional information required</Text>
              <Text style={styles.sectionText}>Complete the fields below to activate your account.</Text>
            </View>

            <View style={styles.photoSection}>
              <View style={styles.photoPreview}>
                {profileImageUrl ? (
                  <Image contentFit="cover" source={{ uri: profileImageUrl }} style={styles.photoImage} />
                ) : (
                  <View style={styles.photoFallback}>
                    <Ionicons color={authPalette.textMuted} name="camera-outline" size={28} />
                  </View>
                )}
              </View>
              <View style={styles.photoCopy}>
                <Text style={styles.photoTitle}>Profile photo</Text>
                <Text style={styles.photoText}>Upload a clear image for your account profile.</Text>
                <View style={styles.photoActions}>
                  <Pressable
                    accessibilityRole="button"
                    disabled={uploadingProfileImage}
                    onPress={pickProfileImage}
                    style={[styles.photoButton, uploadingProfileImage && styles.photoButtonDisabled]}
                  >
                    {uploadingProfileImage ? (
                      <ActivityIndicator color={authPalette.white} />
                    ) : (
                      <Ionicons color={authPalette.white} name="cloud-upload-outline" size={18} />
                    )}
                    <Text style={styles.photoButtonText}>{profileImageUrl ? 'Change photo' : 'Upload photo'}</Text>
                  </Pressable>
                  {profileImageUrl ? (
                    <Pressable onPress={removeProfileImage} style={styles.photoLinkButton}>
                      <Text style={styles.photoLinkText}>Remove</Text>
                    </Pressable>
                  ) : null}
                </View>
                <Text style={styles.photoHint}>JPEG, PNG, or WEBP. Max 5 MB. Stored privately and attached to your account.</Text>
                {profileImageName ? <Text style={styles.photoFileName}>{profileImageName}</Text> : null}
              </View>
            </View>
            {errors.profileImageUrl ? <Text style={styles.fieldError}>{errors.profileImageUrl}</Text> : null}

            <SelectField
              label="Country"
              description={selectedCountry ? `${selectedCountry.countryCode} - ${selectedCountry.phoneDialCode}` : 'Choose your country'}
              error={errors.countryCode}
              onPress={() => setCountryPickerVisible(true)}
              value={selectedCountry ? selectedCountry.countryName : 'Select country'}
            />

            <TextField
              error={errors.username}
              label="Username / Alias"
              onChangeText={(value) => update('username', value)}
              placeholder={session?.email ? usernameFromEmail(session.email) : 'Choose a username'}
              required
              value={form.username}
            />

            <View style={styles.field}>
              <Text style={styles.label}>Phone Number <Text style={styles.required}>*</Text></Text>
              <View style={styles.phoneRow}>
                <TextInput
                  keyboardType="phone-pad"
                  maxLength={10}
                  onChangeText={(value) => update('phoneNumber', value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="123 456 7890"
                  placeholderTextColor={authPalette.textMuted}
                  style={[styles.phoneInput, errors.phoneNumber && styles.inputError]}
                  value={form.phoneNumber}
                />
              </View>
              {errors.phoneNumber ? <Text style={styles.fieldError}>{errors.phoneNumber}</Text> : null}
            </View>

            <View style={[styles.row, isMobile && styles.rowStack]}>
              <DateField
                error={errors.dateOfBirth}
                label="Date of Birth"
                onChangeText={(value) => update('dateOfBirth', value)}
                value={form.dateOfBirth}
                onPress={openDatePicker}
                required
              />
              <SelectField
                error={errors.gender}
                label="Gender"
                onPress={() => setGenderPickerVisible(true)}
                value={selectedGender ? selectedGender.label : 'Select gender'}
              />
            </View>

            <SelectField
              error={errors.privacySetting}
              label="Privacy Setting"
              onPress={() => setPrivacyPickerVisible(true)}
              value={privacyLabel(form.privacySetting) || 'Select privacy setting'}
            />

            <Pressable
              accessibilityRole="checkbox"
              onPress={() => update('termsAccepted', !form.termsAccepted)}
              style={styles.checkboxRow}
            >
              <View style={[styles.checkbox, form.termsAccepted && styles.checkboxChecked]}>
                {form.termsAccepted ? <Ionicons color={authPalette.white} name="checkmark" size={14} /> : null}
              </View>
              <Text style={styles.checkboxLabel}>I accept the Terms and Privacy Policy</Text>
            </Pressable>
            <View style={styles.legalLinksRow}>
              <Pressable onPress={() => openLegal('terms')} style={styles.legalLink}>
                <Text style={styles.legalLinkText}>View Terms</Text>
              </Pressable>
              <Pressable onPress={() => openLegal('privacy')} style={styles.legalLink}>
                <Text style={styles.legalLinkText}>View Privacy</Text>
              </Pressable>
            </View>
            {errors.termsAccepted ? <Text style={styles.fieldError}>{errors.termsAccepted}</Text> : null}

            {message ? <Text style={styles.errorText}>{message}</Text> : null}
            {conflictPrompt ? (
              <Pressable onPress={onSignIn} style={styles.conflictAction}>
                <Text style={styles.conflictActionText}>Sign in to link Google from Login & Security</Text>
              </Pressable>
            ) : null}

            <Pressable onPress={complete} style={[styles.submitButton, (submitting || uploadingProfileImage) && styles.submitButtonDisabled]}>
              <Text style={styles.submitText}>{submitting ? 'Completing...' : 'Complete Registration'}</Text>
            </Pressable>

            <Pressable onPress={onCancel} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel and return to home</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <AuthOptionModal
        description="Pick the country that best matches your current market."
        onClose={() => setCountryPickerVisible(false)}
        onSelect={(option) => chooseCountry(optionToCountry(option))}
        options={registrationOptions.countries.map(countryToOption)}
        title="Choose your country"
        visible={countryPickerVisible}
      />

      <AuthOptionModal
        description="Choose the option that best describes you."
        onClose={() => setGenderPickerVisible(false)}
        onSelect={(option) => chooseGender({ code: option.key, label: option.title })}
        options={registrationOptions.genders.map((gender) => ({
          key: gender.code,
          subtitle: gender.code,
          title: gender.label
        }))}
        title="Choose gender"
        visible={genderPickerVisible}
      />

      <AuthOptionModal
        description="Control who can see your public profile details."
        onClose={() => setPrivacyPickerVisible(false)}
        onSelect={choosePrivacy}
        options={privacyOptions}
        title="Privacy setting"
        visible={privacyPickerVisible}
      />

      <LegalContentModal
        context={visitorContext}
        onClose={() => setLegalModalSlug(null)}
        slug={legalModalSlug ?? 'terms'}
        title={legalModalSlug === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
        visible={legalModalSlug !== null}
      />
    </SafeAreaView>
  );
}

function TextField({
  label,
  onChangeText,
  placeholder,
  required,
  error,
  value
}: {
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  required?: boolean;
  error?: string;
  value: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label} {required ? <Text style={styles.required}>*</Text> : null}
      </Text>
      <View style={[styles.inputWrap, error && styles.inputError]}>
        <TextInput
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={authPalette.textMuted}
          style={styles.input}
          value={value}
        />
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

function DateField({
  label,
  onChangeText,
  onPress,
  required,
  error,
  value
}: {
  label: string;
  onChangeText: (value: string) => void;
  onPress: () => void;
  required?: boolean;
  error?: string;
  value: string;
}) {
  const displayValue = displayDateValue(value);
  const browserValue = browserDateValue(value);
  const isWeb = Platform.OS === 'web';
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label} {required ? <Text style={styles.required}>*</Text> : null}
      </Text>
      {isWeb ? (
        <View style={[styles.dateWrap, error && styles.inputError]}>
          <TextInput
            {...({ type: 'date' } as any)}
            onChangeText={(next) => onChangeText(displayDateValue(next))}
            placeholder="mm/dd/yyyy"
            placeholderTextColor={authPalette.textMuted}
            style={styles.dateInputWeb}
            value={browserValue}
          />
          <View pointerEvents="none" style={styles.dateIconButton}>
            <Ionicons color={authPalette.textMuted} name="calendar-outline" size={20} />
          </View>
        </View>
      ) : (
        <View style={[styles.dateWrap, error && styles.inputError]}>
          <TextInput
            onChangeText={(next) => onChangeText(displayDateValue(next))}
            placeholder="mm/dd/yyyy"
            placeholderTextColor={authPalette.textMuted}
            style={styles.dateInput}
            value={displayValue}
          />
          <Pressable accessibilityRole="button" hitSlop={10} onPress={onPress} style={styles.dateIconButton}>
            <Ionicons color={authPalette.textMuted} name="calendar-outline" size={20} />
          </Pressable>
        </View>
      )}
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

function SelectField({
  description,
  error,
  label,
  onPress,
  value
}: {
  description?: string;
  error?: string;
  label: string;
  onPress: () => void;
  value: string;
}) {
  const isPlaceholder = value.startsWith('Select');
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={onPress} style={[styles.selectWrap, error && styles.inputError]}>
        <View style={styles.selectCopy}>
          <Text style={[styles.selectText, isPlaceholder && styles.selectPlaceholder]}>{value}</Text>
          {description ? <Text style={styles.selectDescription}>{description}</Text> : null}
        </View>
        <Ionicons color={authPalette.textMuted} name="chevron-down-outline" size={18} />
      </Pressable>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

function optionToCountry(option: AuthOption): RegistrationCountryOption {
  return {
    countryCode: option.key,
    countryName: option.title,
    defaultCurrencyCode: option.subtitle?.split(' - ').at(1) ?? '',
    phoneDialCode: option.subtitle?.split(' - ').at(0) ?? ''
  };
}

function countryToOption(country: RegistrationCountryOption): AuthOption {
  return {
    badge: country.countryCode,
    key: country.countryCode,
    subtitle: `${country.phoneDialCode} - ${country.defaultCurrencyCode}`,
    title: country.countryName
  };
}

function applyCountryDefaults(
  current: FormState,
  countries: RegistrationCountryOption[],
  visitorContext?: VisitorContextResponse | null
) {
  const preferred = findCountryByVisitorContext(countries, visitorContext) ?? countries[0] ?? null;
  if (!preferred) {
    return current;
  }
  return {
    ...current,
    countryCode: current.countryCode || preferred.countryCode,
    countryName: current.countryName || preferred.countryName,
    phoneDialCode: current.phoneDialCode || preferred.phoneDialCode
  };
}

function findCountryByVisitorContext(
  countries: RegistrationCountryOption[],
  visitorContext?: VisitorContextResponse | null
) {
  if (!visitorContext?.countryCode) {
    return null;
  }
  return countries.find((country) => country.countryCode === visitorContext.countryCode) ?? null;
}

function usernameFromSession(session: SocialRegistrationSession) {
  return usernameFromEmail(session.email ?? session.displayName ?? '');
}

function usernameFromEmail(value: string) {
  const localPart = value.split('@')[0] ?? '';
  return localPart.replace(/[^a-zA-Z0-9_.-]/g, '').toLowerCase();
}

function normalizeGender(value: string) {
  return value.trim().toUpperCase();
}

function getLocale() {
  return Intl.DateTimeFormat().resolvedOptions().locale ?? 'en-US';
}

function parseUsDate(value: string) {
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

function displayDateFromIso(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    return '';
  }
  return `${match[2]}/${match[3]}/${match[1]}`;
}

function browserDateValue(value: string) {
  if (!value.trim()) {
    return '';
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return value.trim();
  }
  return parseUsDate(value) ?? '';
}

function displayDateValue(value: string) {
  if (!value.trim()) {
    return '';
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return displayDateFromIso(value);
  }
  return value;
}

function isFutureDate(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date > today;
}

function isAtLeastAge(isoDate: string, years: number) {
  const date = new Date(`${isoDate}T00:00:00`);
  const today = new Date();
  const age = today.getFullYear() - date.getFullYear();
  const monthDelta = today.getMonth() - date.getMonth();
  const dayDelta = today.getDate() - date.getDate();
  const adjustedAge = monthDelta < 0 || (monthDelta === 0 && dayDelta < 0) ? age - 1 : age;
  return adjustedAge >= years;
}

function providerSummary(session: SocialRegistrationSession | null) {
  if (!session) {
    return 'Loading account information...';
  }
  const name = session.displayName || [session.firstName, session.lastName].filter(Boolean).join(' ');
  return [name || 'Provider account', session.email].filter(Boolean).join(' - ');
}

function privacyLabel(value: string) {
  if (!value) {
    return '';
  }
  if (value === 'PREFER_NOT_TO_SAY') {
    return 'Prefer not to say';
  }
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: authPalette.page,
    flex: 1
  },
  page: {
    backgroundColor: authPalette.page,
    paddingBottom: 48
  },
  header: {
    alignItems: 'center',
    backgroundColor: authPalette.header,
    borderBottomColor: authPalette.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: authSpacing.md,
    minHeight: 78,
    paddingHorizontal: authSpacing.xl
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: authPalette.input,
    borderRadius: 999,
    height: 44,
    justifyContent: 'center',
    width: 44
  },
  brandWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: authSpacing.sm,
    marginLeft: authSpacing.sm
  },
  brandMark: {
    alignItems: 'center',
    backgroundColor: authPalette.accent,
    borderRadius: 12,
    height: 40,
    justifyContent: 'center',
    width: 40
  },
  brandLetter: {
    color: authPalette.white,
    fontSize: 20,
    fontWeight: '900'
  },
  brandName: {
    color: authPalette.text,
    fontSize: 22,
    fontWeight: '900'
  },
  brandSubcopy: {
    color: authPalette.textMuted,
    fontSize: 13,
    marginTop: 2
  },
  headerSpacer: {
    marginLeft: 'auto',
    width: 44
  },
  shell: {
    alignSelf: 'center',
    maxWidth: 1100,
    paddingHorizontal: authSpacing.xl,
    width: '100%'
  },
  hero: {
    marginBottom: 30,
    marginTop: 34
  },
  successBubble: {
    alignItems: 'center',
    backgroundColor: authPalette.card,
    borderColor: authPalette.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 86,
    justifyContent: 'center',
    width: 86
  },
  kicker: {
    color: '#7E8BC0',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0,
    marginTop: authSpacing.lg
  },
  title: {
    color: authPalette.text,
    fontSize: 48,
    fontWeight: '900',
    marginTop: authSpacing.sm
  },
  titleMobile: {
    fontSize: 34
  },
  subtitle: {
    color: authPalette.textMuted,
    fontSize: 18,
    lineHeight: 26,
    marginTop: authSpacing.sm
  },
  card: {
    backgroundColor: authPalette.card,
    borderColor: authPalette.border,
    borderRadius: 28,
    borderWidth: 1,
    padding: authSpacing.xl
  },
  providerCard: {
    alignItems: 'center',
    backgroundColor: authPalette.cardAlt,
    borderColor: authPalette.border,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: authSpacing.md,
    minHeight: 120,
    paddingHorizontal: authSpacing.lg
  },
  providerCopy: {
    flex: 1,
    gap: authSpacing.xs
  },
  providerTitle: {
    color: authPalette.text,
    fontSize: 18,
    fontWeight: '900'
  },
  providerText: {
    color: authPalette.textMuted,
    fontSize: 15,
    lineHeight: 21
  },
  sectionIntro: {
    gap: authSpacing.sm,
    marginTop: authSpacing.xl
  },
  sectionTitle: {
    color: authPalette.text,
    fontSize: 24,
    fontWeight: '900'
  },
  sectionText: {
    color: authPalette.textMuted,
    fontSize: 16,
    lineHeight: 24
  },
  photoSection: {
    alignItems: 'center',
    backgroundColor: authPalette.cardAlt,
    borderColor: authPalette.border,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: authSpacing.lg,
    marginTop: authSpacing.xl,
    padding: authSpacing.lg
  },
  photoPreview: {
    alignItems: 'center',
    backgroundColor: authPalette.input,
    borderColor: authPalette.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 84,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 84
  },
  photoImage: {
    height: '100%',
    width: '100%'
  },
  photoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%'
  },
  photoCopy: {
    flex: 1,
    gap: 8
  },
  photoTitle: {
    color: authPalette.text,
    fontSize: 17,
    fontWeight: '900'
  },
  photoText: {
    color: authPalette.textMuted,
    fontSize: 14,
    lineHeight: 20
  },
  photoActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: authSpacing.sm,
    marginTop: 4
  },
  photoButton: {
    alignItems: 'center',
    backgroundColor: authPalette.accent,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 8,
    minHeight: 42,
    paddingHorizontal: authSpacing.lg,
    paddingVertical: 10
  },
  photoButtonDisabled: {
    opacity: 0.72
  },
  photoButtonText: {
    color: authPalette.white,
    fontSize: 14,
    fontWeight: '900'
  },
  photoLinkButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: authSpacing.sm
  },
  photoLinkText: {
    color: authPalette.textMuted,
    fontSize: 14,
    fontWeight: '800'
  },
  photoHint: {
    color: authPalette.textMuted,
    fontSize: 12,
    lineHeight: 18
  },
  photoFileName: {
    color: authPalette.textMuted,
    fontSize: 12,
    fontWeight: '700'
  },
  row: {
    flexDirection: 'row',
    gap: authSpacing.lg
  },
  rowStack: {
    flexDirection: 'column'
  },
  field: {
    flex: 1,
    gap: authSpacing.xs,
    marginTop: authSpacing.lg
  },
  label: {
    color: authPalette.text,
    fontSize: 15,
    fontWeight: '900'
  },
  required: {
    color: '#F87171'
  },
  inputWrap: {
    alignItems: 'center',
    backgroundColor: authPalette.input,
    borderRadius: 18,
    flexDirection: 'row',
    minHeight: 62,
    paddingHorizontal: authSpacing.md
  },
  dateWrap: {
    alignItems: 'center',
    backgroundColor: authPalette.input,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 62,
    paddingHorizontal: authSpacing.md
  },
  dateDisplay: {
    color: authPalette.text,
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    paddingVertical: 18
  },
  dateInputWeb: {
    color: authPalette.text,
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    minHeight: 62,
    outlineStyle: 'none' as never,
    paddingHorizontal: 0,
    paddingVertical: 18
  },
  datePlaceholder: {
    color: authPalette.textMuted,
    fontWeight: '600'
  },
  input: {
    color: authPalette.text,
    flex: 1,
    fontSize: 16,
    outlineStyle: 'none' as never
  },
  dateValue: {
    color: authPalette.text,
    fontSize: 16,
    fontWeight: '700'
  },
  inputError: {
    borderColor: '#F87171',
    borderWidth: 1
  },
  selectWrap: {
    alignItems: 'center',
    backgroundColor: authPalette.input,
    borderRadius: 18,
    flexDirection: 'row',
    gap: authSpacing.sm,
    minHeight: 66,
    paddingHorizontal: authSpacing.md
  },
  selectCopy: {
    flex: 1,
    gap: 4
  },
  selectText: {
    color: authPalette.text,
    fontSize: 16,
    fontWeight: '900'
  },
  selectPlaceholder: {
    color: authPalette.textMuted,
    fontWeight: '800'
  },
  selectDescription: {
    color: authPalette.textMuted,
    fontSize: 12
  },
  phoneRow: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: authSpacing.sm
  },
  phoneRowStack: {
    flexDirection: 'column'
  },
  phoneCode: {
    alignItems: 'center',
    backgroundColor: authPalette.input,
    borderRadius: 18,
    flexDirection: 'row',
    gap: authSpacing.sm,
    justifyContent: 'center',
    minHeight: 62,
    minWidth: 152,
    paddingHorizontal: authSpacing.md
  },
  phoneCodeText: {
    color: authPalette.text,
    fontSize: 13,
    fontWeight: '900'
  },
  phoneDialText: {
    color: authPalette.textMuted,
    fontSize: 13,
    fontWeight: '800'
  },
  phoneInput: {
    backgroundColor: authPalette.input,
    borderRadius: 18,
    color: authPalette.text,
    flex: 1,
    fontSize: 16,
    minWidth: 0,
    minHeight: 62,
    outlineStyle: 'none' as never,
    paddingHorizontal: authSpacing.md
  },
  dateInput: {
    color: authPalette.text,
    flex: 1,
    fontSize: 16,
    minHeight: 62,
    outlineStyle: 'none' as never,
    paddingHorizontal: authSpacing.md
  },
  dateIconButton: {
    alignItems: 'center',
    height: 62,
    justifyContent: 'center',
    width: 38
  },
  checkboxRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: authSpacing.sm,
    marginTop: authSpacing.lg
  },
  checkbox: {
    alignItems: 'center',
    backgroundColor: authPalette.input,
    borderColor: authPalette.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 22,
    justifyContent: 'center',
    width: 22
  },
  checkboxChecked: {
    backgroundColor: authPalette.accent,
    borderColor: authPalette.accent
  },
  checkboxLabel: {
    color: authPalette.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '700'
  },
  legalLinksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: authSpacing.md,
    marginTop: authSpacing.sm
  },
  legalLink: {
    alignItems: 'center',
    backgroundColor: authPalette.cardAlt,
    borderColor: authPalette.border,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: authSpacing.md
  },
  legalLinkText: {
    color: authPalette.text,
    fontSize: 13,
    fontWeight: '900'
  },
  fieldError: {
    color: authPalette.danger,
    fontSize: 13,
    fontWeight: '800'
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: authPalette.accent,
    borderRadius: 999,
    height: 62,
    justifyContent: 'center',
    marginTop: authSpacing.xl
  },
  submitButtonDisabled: {
    opacity: 0.72
  },
  submitText: {
    color: authPalette.white,
    fontSize: 16,
    fontWeight: '900'
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: authSpacing.xs
  },
  cancelText: {
    color: authPalette.textMuted,
    fontSize: 15,
    fontWeight: '700'
  },
  errorText: {
    color: authPalette.danger,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: authSpacing.lg
  },
  conflictAction: {
    alignItems: 'center',
    backgroundColor: authPalette.cardAlt,
    borderColor: authPalette.border,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 56,
    marginTop: authSpacing.md,
    paddingHorizontal: authSpacing.lg
  },
  conflictActionText: {
    color: authPalette.text,
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center'
  }
});
