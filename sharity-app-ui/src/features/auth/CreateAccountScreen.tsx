import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { VisitorContextResponse } from '../../services/publicContentApi';
import {
  getRegistrationOptions,
  registerAccount,
  startSocialRegistration,
  type RegistrationCountryOption,
  type RegistrationGenderOption
} from '../../services/authApi';
import { authPalette, authSpacing } from './authTheme';
import { AuthOptionModal, type AuthOption } from './AuthOptionModal';
import { LegalContentModal } from './LegalContentModal';
import { DatePickerModal } from '../../components/ui/DatePickerModal';
import type { AppRoute } from '../../types/navigation';

type Props = {
  onNavigate: (route: AppRoute) => void;
  onSignIn: () => void;
  visitorContext?: VisitorContextResponse | null;
};

type FormState = {
  confirmPassword: string;
  countryCode: string;
  countryName: string;
  dateOfBirth: string;
  detectedCountryCode: string;
  detectedCountryName: string;
  email: string;
  firstName: string;
  gender: string;
  lastName: string;
  password: string;
  phoneDialCode: string;
  phoneNumber: string;
  privacySetting: string;
  termsAccepted: boolean;
  username: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const initialForm: FormState = {
  confirmPassword: '',
  countryCode: '',
  countryName: '',
  dateOfBirth: '',
  detectedCountryCode: '',
  detectedCountryName: '',
  email: '',
  firstName: '',
  gender: '',
  lastName: '',
  password: '',
  phoneDialCode: '',
  phoneNumber: '',
  privacySetting: 'PRIVATE',
  termsAccepted: false,
  username: ''
};

const privacyOptions: AuthOption[] = [
  { key: 'PRIVATE', title: 'Private', subtitle: 'Visible only to you and approved Sharity services' },
  { key: 'LIMITED', title: 'Limited', subtitle: 'Visible to trusted connections and support tools' },
  { key: 'PUBLIC', title: 'Public', subtitle: 'Visible according to your marketplace settings' }
];

export function CreateAccountScreen({ onNavigate, onSignIn, visitorContext }: Props) {
  const { width } = useWindowDimensions();
  const isMobile = width < 760;
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [conflictPrompt, setConflictPrompt] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [registrationOptions, setRegistrationOptions] = useState<{ countries: RegistrationCountryOption[]; genders: RegistrationGenderOption[] }>({
    countries: [],
    genders: []
  });
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [genderPickerVisible, setGenderPickerVisible] = useState(false);
  const [privacyPickerVisible, setPrivacyPickerVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [legalModalSlug, setLegalModalSlug] = useState<'terms' | 'privacy' | null>(null);

  const selectedCountry = useMemo(
    () => registrationOptions.countries.find((country) => country.countryCode === form.countryCode) ?? null,
    [form.countryCode, registrationOptions.countries]
  );
  const selectedGender = useMemo(
    () => registrationOptions.genders.find((gender) => gender.code === form.gender) ?? null,
    [form.gender, registrationOptions.genders]
  );
  const dateOfBirthIso = useMemo(() => parseUsDate(form.dateOfBirth), [form.dateOfBirth]);

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
      if (current.detectedCountryCode && current.detectedCountryName) {
        return current;
      }
      const detected = findCountryByVisitorContext(registrationOptions.countries, visitorContext);
      if (!detected) {
        return current;
      }
      return {
        ...current,
        detectedCountryCode: detected.countryCode,
        detectedCountryName: detected.countryName,
        countryCode: current.countryCode || detected.countryCode,
        countryName: current.countryName || detected.countryName,
        phoneDialCode: current.phoneDialCode || detected.phoneDialCode
      };
    });
  }, [visitorContext, registrationOptions.countries]);

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage(null);
    setConflictPrompt(false);
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  function chooseCountry(country: RegistrationCountryOption) {
    setForm((current) => ({
      ...current,
      countryCode: country.countryCode,
      countryName: country.countryName,
      phoneDialCode: country.phoneDialCode,
      detectedCountryCode: current.detectedCountryCode || country.countryCode,
      detectedCountryName: current.detectedCountryName || country.countryName
    }));
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

  function openLegal(slug: 'terms' | 'privacy') {
    setLegalModalSlug(slug);
  }

  function openDatePicker() {
    setDatePickerVisible(true);
  }

  async function submit() {
    if (submitting) {
      return;
    }
    const nextErrors: FormErrors = {};

    if (!form.firstName.trim()) {
      nextErrors.firstName = 'First name is required.';
    }
    if (!form.lastName.trim()) {
      nextErrors.lastName = 'Last name is required.';
    }
    if (!form.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!form.password) {
      nextErrors.password = 'Password is required.';
    } else if (form.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.';
    }
    if (!form.confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.';
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }
    if (!selectedCountry) {
      nextErrors.countryCode = 'Choose your country.';
    }
    if (!form.phoneNumber.trim()) {
      nextErrors.phoneNumber = 'Phone number is required.';
    } else if (!/^\d{10}$/.test(form.phoneNumber.trim())) {
      nextErrors.phoneNumber = 'Phone number must be exactly 10 digits.';
    }
    if (!form.dateOfBirth.trim()) {
      nextErrors.dateOfBirth = 'Date of birth is required.';
    } else if (!dateOfBirthIso) {
      nextErrors.dateOfBirth = 'Use the mm/dd/yyyy format or pick a date.';
    }
    if (!selectedGender) {
      nextErrors.gender = 'Choose your gender.';
    }
    if (!form.username.trim()) {
      nextErrors.username = 'Username is required.';
    }
    if (!form.privacySetting.trim()) {
      nextErrors.privacySetting = 'Choose a privacy setting.';
    }
    if (!form.termsAccepted) {
      nextErrors.termsAccepted = 'You must accept the terms to continue.';
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setMessage('Please fix the highlighted fields.');
      return;
    }

    const country = selectedCountry;
    if (!country) {
      setMessage('Please choose your country.');
      return;
    }

    setSubmitting(true);
    setMessage(null);
    setConflictPrompt(false);
    try {
      await registerAccount({
        appVersion: 'web',
        countryCode: country.countryCode,
        countryName: country.countryName,
        dateOfBirth: dateOfBirthIso,
        detectedCountryCode: form.detectedCountryCode || country.countryCode,
        detectedCountryName: form.detectedCountryName || country.countryName,
        devicePlatform: 'WEB',
        email: form.email.trim(),
        firstName: form.firstName.trim() || undefined,
        gender: normalizeGender(form.gender),
        lastName: form.lastName.trim() || undefined,
        locale: getLocale(),
        password: form.password,
        phoneDialCode: country.phoneDialCode,
        phoneNumber: form.phoneNumber.trim(),
        privacySetting: form.privacySetting,
        termsAccepted: form.termsAccepted,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        username: form.username.trim() || form.email.trim()
      });
      setMessage('Account created. Please check your email to verify your account, then sign in.');
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : 'Unable to create account.';
      setMessage(nextMessage);
      setConflictPrompt(nextMessage.toLowerCase().includes('already registered'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Back" onPress={() => onNavigate('welcome')} style={styles.backButton}>
            <Ionicons color={authPalette.text} name="arrow-back-outline" size={22} />
          </Pressable>

          <View style={styles.brandWrap}>
            <View style={styles.brandMark}>
              <Text style={styles.brandLetter}>S</Text>
            </View>
            <View>
              <Text style={styles.brandName}>Sharity</Text>
              <Text style={styles.brandSubcopy}>
                {visitorContext?.countryName ? visitorContext.countryName : 'Public registration'}
              </Text>
            </View>
          </View>

          <Pressable onPress={onSignIn} style={styles.headerAction}>
            <Text style={styles.headerActionText}>Sign in</Text>
          </Pressable>
        </View>

        <View style={styles.shell}>
          <View style={styles.hero}>
            <Text style={styles.kicker}>CREATE ACCOUNT</Text>
            <Text style={[styles.title, isMobile && styles.titleMobile]}>Create your account</Text>
            <Text style={styles.subtitle}>Join Sharity and start shopping today.</Text>
          </View>

          <View style={styles.card}>
            <Pressable onPress={() => startSocialRegistration('Google')} style={styles.socialButton}>
              <Ionicons color="#4285F4" name="logo-google" size={20} />
              <Text style={styles.socialText}>Continue with Google</Text>
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR SIGN UP WITH EMAIL</Text>
              <View style={styles.divider} />
            </View>

            <View style={[styles.row, isMobile && styles.rowStack]}>
              <Field
                error={fieldErrors.password}
                label="Password"
                onChangeText={(value) => update('password', value)}
                placeholder="Password"
                rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                secureTextEntry={!showPassword}
                value={form.password}
                onRightIconPress={() => setShowPassword((current) => !current)}
              />
              <Field
                error={fieldErrors.confirmPassword}
                label="Confirm Password"
                onChangeText={(value) => update('confirmPassword', value)}
                placeholder="Confirm password"
                rightIcon={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                secureTextEntry={!showConfirmPassword}
                value={form.confirmPassword}
                onRightIconPress={() => setShowConfirmPassword((current) => !current)}
              />
            </View>

            <Field
              autoCapitalize="none"
              error={fieldErrors.email}
              keyboardType="email-address"
              label="Email"
              onChangeText={(value) => update('email', value)}
              placeholder="john.doe@example.com"
              value={form.email}
            />

            <Field
              autoCapitalize="none"
              error={fieldErrors.username}
              label="Username / Alias"
              onChangeText={(value) => update('username', value)}
              placeholder="john_doe"
              value={form.username}
            />

            <SelectField
              error={fieldErrors.countryCode}
              label="Country"
              description={selectedCountry ? `${selectedCountry.countryCode} - ${selectedCountry.phoneDialCode}` : 'Choose your country'}
              onPress={() => setCountryPickerVisible(true)}
              value={selectedCountry ? selectedCountry.countryName : 'Select country'}
            />

            <View>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.phoneRow}>
                <TextInput
                  keyboardType="phone-pad"
                  maxLength={10}
                  onChangeText={(value) => update('phoneNumber', value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="123 456 7890"
                  placeholderTextColor={authPalette.textMuted}
                  style={[styles.phoneInput, fieldErrors.phoneNumber && styles.inputError]}
                  value={form.phoneNumber}
                />
              </View>
              {fieldErrors.phoneNumber ? <Text style={styles.fieldError}>{fieldErrors.phoneNumber}</Text> : null}
            </View>

            <View style={[styles.row, isMobile && styles.rowStack]}>
              <DateField
                error={fieldErrors.dateOfBirth}
                label="Date of Birth"
                onChangeText={(value) => update('dateOfBirth', value)}
                onPress={openDatePicker}
                required
                value={form.dateOfBirth}
                datePickerVisible={datePickerVisible}
                onDatePickerOpen={() => setDatePickerVisible(true)}
                onDatePickerClose={() => setDatePickerVisible(false)}
              />
              <SelectField
                error={fieldErrors.gender}
                label="Gender"
                onPress={() => setGenderPickerVisible(true)}
                value={selectedGender ? selectedGender.label : 'Select gender'}
              />
            </View>

            <SelectField
              error={fieldErrors.privacySetting}
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
            {fieldErrors.termsAccepted ? <Text style={styles.fieldError}>{fieldErrors.termsAccepted}</Text> : null}

            {message ? <Text style={message.includes('created') ? styles.successText : styles.errorText}>{message}</Text> : null}
            {conflictPrompt ? (
              <Pressable onPress={onSignIn} style={styles.conflictAction}>
                <Text style={styles.conflictActionText}>Sign in to link Google from Login & Security</Text>
              </Pressable>
            ) : null}

            <Pressable onPress={submit} style={[styles.submitButton, submitting && styles.submitButtonDisabled]}>
              <Text style={styles.submitText}>{submitting ? 'Creating account...' : 'Create Account'}</Text>
            </Pressable>

            <View style={styles.signInRow}>
              <Text style={styles.haveAccount}>Already have an account? </Text>
              <Pressable onPress={onSignIn}>
                <Text style={styles.signInLink}>Sign in</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      <AuthOptionModal
        description="Select the country that best matches your current market."
        onClose={() => setCountryPickerVisible(false)}
        onSelect={(option) => chooseCountry(optionToCountry(option))}
        options={registrationOptions.countries.map(countryToOption)}
        title="Choose your country"
        visible={countryPickerVisible}
      />

      <AuthOptionModal
        description="Pick the option that describes you best."
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

      <DatePickerModal
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        onDateSelect={(date) => update('dateOfBirth', date)}
        value={form.dateOfBirth}
        title="Select your date of birth"
      />
    </SafeAreaView>
  );
}

function Field({
  autoCapitalize,
  error,
  keyboardType,
  label,
  onChangeText,
  onRightIconPress,
  placeholder,
  rightIcon,
  secureTextEntry,
  value
}: FieldProps) {
  const isDateField = label === 'Date of Birth';
  const webDateProps = isDateField ? ({ type: 'date' } as any) : {};
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          autoCapitalize={autoCapitalize}
          {...webDateProps}
          keyboardType={keyboardType}
          onChangeText={(next) => onChangeText(isDateField ? displayDateValue(next) : next)}
          placeholder={isDateField ? 'mm/dd/yyyy' : placeholder}
          placeholderTextColor={authPalette.textMuted}
          secureTextEntry={secureTextEntry}
          style={styles.input}
          value={isDateField ? browserDateValue(value) : value}
        />
        {isDateField ? (
          <View style={styles.inputIcon}>
            <Ionicons color={authPalette.textMuted} name="calendar-outline" size={22} />
          </View>
        ) : rightIcon ? (
          <Pressable onPress={onRightIconPress} style={styles.inputIcon}>
            <Ionicons color={authPalette.textMuted} name={rightIcon} size={22} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

function DateField({
  error,
  label,
  onChangeText,
  onPress,
  required,
  value,
  datePickerVisible,
  onDatePickerOpen,
  onDatePickerClose
}: {
  error?: string;
  label: string;
  onChangeText: (value: string) => void;
  onPress: () => void;
  required?: boolean;
  value: string;
  datePickerVisible?: boolean;
  onDatePickerOpen?: () => void;
  onDatePickerClose?: () => void;
}) {
  const displayValue = displayDateValue(value);
  const browserValue = browserDateValue(value);
  const isWeb = Platform.OS === 'web';

  const handleCalendarPress = () => {
    if (isWeb) {
      onPress();
    } else if (onDatePickerOpen) {
      onDatePickerOpen();
    }
  };

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
            keyboardType="number-pad"
            editable={false}
          />
          <Pressable accessibilityRole="button" hitSlop={10} onPress={handleCalendarPress} style={styles.dateIconButton}>
            <Ionicons color={authPalette.textMuted} name="calendar-outline" size={20} />
          </Pressable>
        </View>
      )}
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

type FieldProps = {
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  keyboardType?: 'default' | 'email-address' | 'numbers-and-punctuation' | 'phone-pad';
  label: string;
  onChangeText: (value: string) => void;
  onRightIconPress?: () => void;
  placeholder: string;
  rightIcon?: ComponentProps<typeof Ionicons>['name'];
  secureTextEntry?: boolean;
  value: string;
};

 function SelectField({ description, error, label, onPress, value }: { description?: string; error?: string; label: string; onPress: () => void; value: string }) {
  const isPlaceholder = value.startsWith('Select');
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable accessibilityRole="button" hitSlop={12} onPressIn={onPress} style={styles.selectWrap}>
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
    detectedCountryCode: current.detectedCountryCode || visitorContext?.countryCode || preferred.countryCode,
    detectedCountryName: current.detectedCountryName || visitorContext?.countryName || preferred.countryName,
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

function normalizeGender(value: string) {
  return value.trim().toUpperCase();
}

function getLocale() {
  return Intl.DateTimeFormat().resolvedOptions().locale ?? 'en-US';
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

function formatIsoToUsDate(value: string) {
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

function browserDateValue(value: string) {
  return parseUsDate(value) ?? '';
}

function displayDateValue(value: string) {
  if (!value.trim()) {
    return '';
  }
  return formatIsoToUsDate(value) || value;
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
  headerAction: {
    marginLeft: 'auto'
  },
  headerActionText: {
    color: authPalette.text,
    fontSize: 15,
    fontWeight: '900'
  },
  shell: {
    alignSelf: 'center',
    maxWidth: 1100,
    paddingHorizontal: authSpacing.xl,
    width: '100%'
  },
  hero: {
    marginTop: 34,
    marginBottom: 30
  },
  kicker: {
    color: '#7E8BC0',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0
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
    marginTop: authSpacing.sm
  },
  card: {
    backgroundColor: authPalette.card,
    borderColor: authPalette.border,
    borderRadius: 28,
    borderWidth: 1,
    padding: authSpacing.xl
  },
  socialButton: {
    alignItems: 'center',
    backgroundColor: authPalette.cardAlt,
    borderColor: authPalette.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: authSpacing.sm,
    justifyContent: 'center',
    minHeight: 58
  },
  socialText: {
    color: authPalette.text,
    fontSize: 16,
    fontWeight: '900'
  },
  dividerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: authSpacing.sm,
    marginBottom: authSpacing.xl,
    marginTop: authSpacing.xl
  },
  divider: {
    backgroundColor: authPalette.border,
    flex: 1,
    height: 1
  },
  dividerText: {
    color: authPalette.textMuted,
    fontSize: 13,
    fontWeight: '800'
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
    gap: authSpacing.xs
  },
  label: {
    color: authPalette.text,
    fontSize: 15,
    fontWeight: '900'
  },
  required: {
    color: authPalette.danger
  },
  inputWrap: {
    alignItems: 'center',
    backgroundColor: authPalette.input,
    borderRadius: 18,
    flexDirection: 'row',
    gap: authSpacing.sm,
    minHeight: 62,
    paddingHorizontal: authSpacing.md
  },
  inputError: {
    borderColor: authPalette.danger,
    borderWidth: 1.5
  },
  input: {
    color: authPalette.text,
    flex: 1,
    fontSize: 16,
    minHeight: 62,
    outlineStyle: 'none' as never
  },
  inputIcon: {
    alignItems: 'center',
    height: 62,
    justifyContent: 'center',
    width: 28
  },
  dateWrap: {
    alignItems: 'center',
    backgroundColor: authPalette.input,
    borderRadius: 18,
    flexDirection: 'row',
    gap: authSpacing.sm,
    minHeight: 62,
    paddingLeft: authSpacing.md,
    paddingRight: 8
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
  dateInput: {
    color: authPalette.text,
    flex: 1,
    fontSize: 16,
    minHeight: 62,
    outlineStyle: 'none' as never
  },
  dateIconButton: {
    alignItems: 'center',
    height: 46,
    justifyContent: 'center',
    width: 40
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
  fieldError: {
    color: authPalette.danger,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 6
  },
  checkboxRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: authSpacing.sm,
    marginTop: authSpacing.md
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
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18
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
    minWidth: 152,
    minHeight: 62,
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
  signInRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: authSpacing.lg
  },
  haveAccount: {
    color: authPalette.textMuted,
    fontSize: 15
  },
  signInLink: {
    color: authPalette.text,
    fontSize: 15,
    fontWeight: '900'
  },
  errorText: {
    color: authPalette.danger,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center'
  },
  successText: {
    color: authPalette.success,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center'
  },
  conflictAction: {
    alignItems: 'center',
    backgroundColor: authPalette.cardAlt,
    borderColor: authPalette.border,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: authSpacing.lg
  },
  conflictActionText: {
    color: authPalette.text,
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center'
  }
});
