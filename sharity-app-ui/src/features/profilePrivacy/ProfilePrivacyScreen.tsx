import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Action, Choice, Field, Section } from "./ProfileControls";
import { styles, webDateStyle } from "./profileStyles";

import { InteriorShell } from "../../components/appShell/InteriorShell";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { colors } from "../../theme";
import type { AppRoute } from "../../types/navigation";
import { getBrowserSessionSummary } from "../../services/sessionService";
import { getRegistrationOptions } from "../../services/authApi";
import {
  getCurrentUser,
  getCurrentUserSessions,
  getCurrentUserSocialLinks,
  revokeAllCurrentUserSessions,
  revokeCurrentUserSession,
  startGoogleLink,
  updateCurrentUserProfile,
  uploadCurrentUserProfileImage,
  type CurrentUser,
  type SocialLink,
  type UserSession,
} from "../../services/userApi";

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

const privacyOptions = ["PRIVATE", "VISIBLE_AFTER_ORDER", "PUBLIC_WITHIN_SHARITY"] as const;
const PROFILE_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;

export function ProfilePrivacyScreen({ onNavigate }: Props) {
  const { isMobile, isSingleColumn } = useResponsiveLayout();
  const [tab, setTab] = useState<"details" | "privacy" | "security">("details");
  const [savedForm, setSavedForm] = useState<typeof form | null>(null);
  const [warning, setWarning] = useState("");
  const [revoking, setRevoking] = useState<number | null>(null);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [genders, setGenders] = useState<GenderOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    countryCode: "",
    countryName: "",
    phoneDialCode: "",
    dateOfBirth: "",
    gender: "",
    profileImageUrl: "",
    privacySetting: "VISIBLE_AFTER_ORDER",
  });
  const googleLinked = socialLinks.some((link) => link.provider.toUpperCase() === "GOOGLE");

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const currentUser = await getCurrentUser();
      const [sessionResult, optionsResult, linksResult, browserResult] = await Promise.allSettled([
        getCurrentUserSessions(),
        getRegistrationOptions(),
        getCurrentUserSocialLinks(),
        getBrowserSessionSummary(),
      ]);
      const currentSessions = sessionResult.status === "fulfilled" ? sessionResult.value : [];
      const browserSession = browserResult.status === "fulfilled" ? browserResult.value : null;
      const links = linksResult.status === "fulfilled" ? linksResult.value : [];
      const registrationOptions =
        optionsResult.status === "fulfilled" ? optionsResult.value : { countries: [], genders: [] };
      setWarning(
        [sessionResult, optionsResult, linksResult].some((result) => result.status === "rejected")
          ? "Some account options are temporarily unavailable. Your personal details are still available."
          : "",
      );
      setUser(currentUser);
      setSessions(mergeSessions(currentSessions, browserSession));
      setSocialLinks(links);
      setCountries(registrationOptions.countries);
      setGenders(registrationOptions.genders);
      const loadedForm = {
        firstName: currentUser.profile.firstName ?? "",
        lastName: currentUser.profile.lastName ?? "",
        phoneNumber: currentUser.profile.phoneNumber ?? "",
        countryCode: currentUser.profile.countryCode ?? "",
        countryName: currentUser.profile.countryName ?? "",
        phoneDialCode: currentUser.profile.phoneDialCode ?? "",
        dateOfBirth: currentUser.profile.dateOfBirth ?? "",
        gender: currentUser.profile.gender ?? "",
        profileImageUrl: currentUser.profile.profileImageUrl ?? "",
        privacySetting: currentUser.profile.privacySetting ?? "VISIBLE_AFTER_ORDER",
      };
      setForm(loadedForm);
      setSavedForm(loadedForm);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load profile");
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    if (saving || !savedForm || JSON.stringify(savedForm) === JSON.stringify(form)) return;
    if (form.dateOfBirth && !toIsoDate(form.dateOfBirth)) {
      setError("Enter a valid date of birth.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const updated = await updateCurrentUserProfile({
        ...form,
        dateOfBirth: toIsoDate(form.dateOfBirth) || null,
        gender: form.gender || null,
        profileImageUrl: form.profileImageUrl || null,
        privacySetting: form.privacySetting || null,
      });
      setUser((current) => (current ? { ...current, profile: { ...current.profile, ...updated } } : current));
      setSavedForm({ ...form });
      setMessage("Your changes have been saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save profile");
    } finally {
      setSaving(false);
    }
  }

  async function changeProfileImage() {
    if (uploadingImage) {
      return;
    }
    setUploadingImage(true);
    setError("");
    setMessage("");
    try {
      let filePayload: Blob & { name?: string };
      if (Platform.OS === "web" && typeof document !== "undefined") {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/jpeg,image/png,image/webp";
        input.style.position = "fixed";
        input.style.left = "-9999px";
        input.style.top = "-9999px";
        const selected = await new Promise<File | null>((resolve) => {
          input.addEventListener('cancel', () => { input.remove(); resolve(null); }, {once:true});
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
          throw new Error("Photo library permission is required to update your profile image");
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.9,
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
        filePayload.name = asset.fileName ?? "profile-image.jpg";
      }
      const fileSize = typeof filePayload.size === "number" ? filePayload.size : 0;
      if (fileSize > PROFILE_IMAGE_MAX_SIZE_BYTES) {
        throw new Error("Profile photo must be 5 MB or smaller.");
      }
      const updated = await uploadCurrentUserProfileImage(filePayload);
      setForm((current) => ({
        ...current,
        profileImageUrl: updated.profileImageUrl,
      }));
      setUser((current) =>
        current
          ? {
              ...current,
              profile: {
                ...current.profile,
                profileImageUrl: updated.profileImageUrl,
              },
            }
          : current,
      );
      setMessage("Profile image updated.");
      setPhotoFailed(false);
      setSavedForm((current) =>
        current ? { ...current, profileImageUrl: updated.profileImageUrl } : current,
      );
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload profile image");
    } finally {
      setUploadingImage(false);
    }
  }

  async function revokeSession(sessionId: number) {
    if (revoking !== null || sessionId < 0) return;
    setRevoking(sessionId);
    setError("");
    setMessage("");
    try {
      await revokeCurrentUserSession(sessionId);
      setSessions((current) => current.filter((session) => session.id !== sessionId));
      setMessage("Session revoked.");
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : "Unable to revoke session");
    } finally {
      setRevoking(null);
    }
  }

  async function revokeAllSessions() {
    if (revoking !== null) return;
    const confirmed =
      Platform.OS === "web"
        ? window.confirm(
            "Revoke all saved device sessions? This browser stays signed in until you choose Sign out.",
          )
        : await new Promise<boolean>((resolve) =>
            Alert.alert(
              "Revoke saved sessions?",
              "This browser stays signed in until you choose Sign out.",
              [
                { text: "Cancel", onPress: () => resolve(false) },
                {
                  text: "Revoke sessions",
                  style: "destructive",
                  onPress: () => resolve(true),
                },
              ],
              { cancelable: true, onDismiss: () => resolve(false) },
            ),
          );
    if (!confirmed) return;
    setRevoking(-2);
    setError("");
    setMessage("");
    try {
      await revokeAllCurrentUserSessions();
      setSessions((current) => current.filter((item) => item.id < 0));
      setMessage("All sessions revoked.");
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : "Unable to revoke sessions");
    } finally {
      setRevoking(null);
    }
  }

  function selectCountry(country: CountryOption) {
    setForm((current) => ({
      ...current,
      countryCode: country.countryCode,
      countryName: country.countryName,
      phoneDialCode: country.phoneDialCode,
    }));
  }

  function setPhone(value: string) {
    setForm((current) => ({
      ...current,
      phoneNumber: value.replace(/\D/g, "").slice(0, 15),
    }));
  }

  const displayName =
    [user?.profile.firstName, user?.profile.lastName].filter(Boolean).join(" ") ||
    user?.username ||
    "Your account";
  const dirty = savedForm !== null && JSON.stringify(form) !== JSON.stringify(savedForm);
  const tabs = [
    { key: "details", label: "Personal details", icon: "person-outline" },
    { key: "privacy", label: "Privacy", icon: "shield-checkmark-outline" },
    {
      key: "security",
      label: "Security & devices",
      icon: "lock-closed-outline",
    },
  ] as const;
  const update = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage("");
  };
  return (
    <InteriorShell activeLabel="Profile" onNavigate={onNavigate} scrollable={false} title="Account settings">
      <ScrollView
        testID="profile-scroll"
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.pageHeading}>
          <Text style={styles.eyebrow}>YOUR ACCOUNT</Text>
          <Text accessibilityRole="header" style={styles.pageTitle}>
            Account settings
          </Text>
          <Text style={styles.description}>Manage your details, privacy and signed-in devices.</Text>
        </View>
        {loading ? (
          <View style={styles.state}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.description}>Loading your account…</Text>
          </View>
        ) : null}
        {error ? (
          <View accessibilityRole="alert" style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            {!user && <Action label="Try again" onPress={load} />}
          </View>
        ) : null}
        {warning ? (
          <View style={styles.notice}>
            <Text style={styles.description}>{warning}</Text>
          </View>
        ) : null}
        {message ? (
          <View accessibilityRole="alert" style={styles.successBanner}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#16714a" />
            <Text style={styles.successText}>{message}</Text>
          </View>
        ) : null}
        {!loading && user ? (
          <View style={[styles.layout, isSingleColumn && styles.stacked]}>
            <View style={[styles.sidebar, isSingleColumn && styles.sidebarMobile]}>
              <View style={[styles.identityCard, isSingleColumn && styles.identityMobile]}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Change profile photo"
                  disabled={uploadingImage || saving}
                  onPress={changeProfileImage}
                  style={styles.avatarButton}
                >
                  {form.profileImageUrl && !photoFailed ? (
                    <Image
                      source={form.profileImageUrl}
                      onError={() => setPhotoFailed(true)}
                      contentFit="cover"
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={[styles.avatar, styles.avatarFallback]}>
                      <Text style={styles.initials}>{initials(displayName)}</Text>
                    </View>
                  )}
                  <View style={styles.camera}>
                    {uploadingImage ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Ionicons name="camera-outline" size={15} color="white" />
                    )}
                  </View>
                </Pressable>
                <View style={[styles.identityText, isSingleColumn && { alignItems: "flex-start" }]}>
                  <Text style={styles.displayName}>{displayName}</Text>
                  <Text style={styles.email}>{user.email}</Text>
                  <View style={styles.verified}>
                    <Ionicons
                      name={user.emailVerified ? "checkmark-circle" : "information-circle-outline"}
                      size={14}
                      color={user.emailVerified ? "#16714a" : colors.textSecondary}
                    />
                    <Text style={styles.verifiedText}>
                      {user.emailVerified ? "Email verified" : "Email not verified"}
                    </Text>
                  </View>
                  <Text style={styles.photoHint}>
                    {uploadingImage ? "Uploading photo…" : "Photo: JPG, PNG or WebP · up to 5 MB"}
                  </Text>
                </View>
              </View>
              <View accessibilityRole="tablist" style={[styles.tabs, isSingleColumn && styles.tabsMobile]}>
                {tabs.map((item) => (
                  <Pressable
                    key={item.key}
                    accessibilityRole="tab"
                    accessibilityLabel={item.label}
                    accessibilityState={{ selected: tab === item.key }}
                    aria-selected={tab === item.key}
                    onPress={() => setTab(item.key)}
                    style={[
                      styles.tab,
                      tab === item.key && styles.tabActive,
                      isSingleColumn && styles.tabMobile,
                    ]}
                  >
                    {!isMobile && (
                      <Ionicons
                        name={item.icon}
                        size={19}
                        color={tab === item.key ? colors.primary : colors.textSecondary}
                      />
                    )}
                    <Text style={[styles.tabText, tab === item.key && { color: colors.primary }]}>
                      {item.label}
                    </Text>
                    {!isSingleColumn && (
                      <Ionicons name="chevron-forward" size={15} color={colors.textSecondary} />
                    )}
                  </Pressable>
                ))}
              </View>
              {!isSingleColumn && (
                <View style={styles.sidebarNote}>
                  <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />
                  <Text style={styles.description}>You can sign out anytime from the top of any screen.</Text>
                </View>
              )}
            </View>
            <View style={styles.mainColumn}>
              {tab === "details" && (
                <View testID="profile-details-panel" style={styles.card}>
                  <Section title="Personal details" description="Keep your contact information up to date." />
                  <View style={[styles.formGrid, isMobile && styles.stacked]}>
                    <Field
                      label="First name"
                      value={form.firstName}
                      onChangeText={(value) => update("firstName", value)}
                      disabled={saving}
                      maxLength={100}
                    />
                    <Field
                      label="Last name"
                      value={form.lastName}
                      onChangeText={(value) => update("lastName", value)}
                      disabled={saving}
                      maxLength={100}
                    />
                  </View>
                  <Field
                    label="Email address"
                    value={user.email}
                    disabled
                    helper="Your email is managed through your sign-in account."
                  />
                  <View style={[styles.formGrid, isMobile && styles.stacked]}>
                    <Field
                      label="Phone number"
                      value={form.phoneNumber}
                      onChangeText={setPhone}
                      disabled={saving}
                      keyboardType="phone-pad"
                      helper={
                        form.phoneDialCode
                          ? "Country calling code: " + form.phoneDialCode
                          : "Choose your country below."
                      }
                      maxLength={15}
                    />
                    <View style={styles.field}>
                      <Text style={styles.label}>Date of birth</Text>
                      {Platform.OS === "web" ? (
                        <input
                          aria-label="Date of birth"
                          type="date"
                          disabled={saving}
                          value={toIsoDate(form.dateOfBirth)}
                          max={new Date().toISOString().slice(0, 10)}
                          onChange={(event) => update("dateOfBirth", event.currentTarget.value)}
                          style={webDateStyle}
                        />
                      ) : (
                        <TextInput
                          accessibilityLabel="Date of birth"
                          editable={!saving}
                          value={form.dateOfBirth}
                          placeholder="YYYY-MM-DD"
                          onChangeText={(value) => update("dateOfBirth", value)}
                          style={styles.input}
                        />
                      )}
                      <Text style={styles.helper}>Used to confirm age eligibility.</Text>
                    </View>
                  </View>
                  <View style={styles.field}>
                    <Text style={styles.label}>Country / region</Text>
                    <View style={styles.options}>
                      {countries.length ? (
                        countries.map((country) => (
                          <Choice
                            key={country.countryCode}
                            label={country.countryName}
                            detail={country.phoneDialCode}
                            selected={form.countryCode === country.countryCode}
                            disabled={saving}
                            onPress={() => selectCountry(country)}
                          />
                        ))
                      ) : (
                        <Text style={styles.description}>
                          {form.countryName || "Country options are unavailable."}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.field}>
                    <Text style={styles.label}>
                      Gender <Text style={styles.helper}>(optional)</Text>
                    </Text>
                    <View style={styles.options}>
                      {genders.map((gender) => (
                        <Choice
                          key={gender.code}
                          label={gender.label}
                          selected={form.gender === gender.code}
                          disabled={saving}
                          onPress={() => update("gender", gender.code)}
                        />
                      ))}
                    </View>
                  </View>
                </View>
              )}
              {tab === "privacy" && (
                <View style={styles.card}>
                  <Section
                    title="Profile privacy"
                    description="Choose a visibility preference for your profile."
                  />
                  {privacyOptions.map((option) => (
                    <Pressable
                      key={option}
                      accessibilityRole="radio"
                      accessibilityLabel={privacyLabel(option)}
                      accessibilityState={{
                        checked: privacyMatches(form.privacySetting, option),
                        disabled: saving,
                      }}
                      aria-checked={privacyMatches(form.privacySetting, option)}
                      disabled={saving}
                      onPress={() => update("privacySetting", option)}
                      style={[
                        styles.privacyOption,
                        privacyMatches(form.privacySetting, option) && styles.choiceSelected,
                      ]}
                    >
                      <Ionicons
                        name={
                          privacyMatches(form.privacySetting, option) ? "radio-button-on" : "radio-button-off"
                        }
                        size={21}
                        color={
                          privacyMatches(form.privacySetting, option) ? colors.primary : colors.textSecondary
                        }
                      />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.label}>{privacyLabel(option)}</Text>
                        <Text style={styles.description}>{privacyDescription(option)}</Text>
                      </View>
                    </Pressable>
                  ))}
                  {form.privacySetting !== "LIMITED" &&
                    !privacyOptions.includes(form.privacySetting as (typeof privacyOptions)[number]) && (
                      <Text style={styles.description}>
                        Current preference: {form.privacySetting}. Select an option to update it.
                      </Text>
                    )}
                  <View style={styles.notice}>
                    <Text style={styles.description}>
                      Payment information and sign-in credentials are separate from this profile preference.
                    </Text>
                  </View>
                </View>
              )}
              {tab === "security" && (
                <View style={styles.card}>
                  <Section
                    title="Security & devices"
                    description="Review your sign-in methods and saved device sessions."
                  />
                  <View style={styles.securityRow}>
                    <View style={styles.securityIcon}>
                      <Ionicons name="logo-google" size={21} color={colors.textPrimary} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.label}>Google account</Text>
                      <Text style={styles.description}>
                        {googleLinked
                          ? "Connected to your Sharity account"
                          : "Connect Google for another way to sign in"}
                      </Text>
                    </View>
                    {googleLinked ? (
                      <Text style={styles.verifiedText}>Connected</Text>
                    ) : (
                      <Action label="Connect" onPress={startGoogleLink} />
                    )}
                  </View>
                  <View style={styles.divider} />
                  <Text style={styles.sectionTitle}>Signed-in devices</Text>
                  <Text style={styles.description}>
                    Use Sign out in the header to end this browser session.
                  </Text>
                  {sessions.length === 0 && (
                    <Text style={styles.description}>No saved device sessions found.</Text>
                  )}
                  {sessions.map((session) => (
                    <View key={session.id} style={styles.securityRow}>
                      <View style={styles.securityIcon}>
                        <Ionicons name="laptop-outline" size={21} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.label}>
                          {session.id < 0 ? "This browser" : session.deviceName || "Saved device"}
                        </Text>
                        <Text style={styles.description}>
                          {session.id < 0
                            ? "Currently signed in"
                            : session.lastUsedAt
                              ? "Last active " + formatDate(session.lastUsedAt)
                              : "Activity time unavailable"}
                        </Text>
                      </View>
                      {session.id < 0 ? (
                        <Text style={styles.currentBadge}>Current</Text>
                      ) : (
                        <Action
                          label={revoking === session.id ? "Revoking…" : "Revoke"}
                          disabled={revoking !== null}
                          onPress={() => revokeSession(session.id)}
                        />
                      )}
                    </View>
                  ))}
                  {sessions.some((session) => session.id > 0) && (
                    <Action
                      label={revoking === -2 ? "Revoking…" : "Revoke saved sessions"}
                      disabled={revoking !== null}
                      onPress={revokeAllSessions}
                    />
                  )}
                </View>
              )}
            </View>
          </View>
        ) : null}
      </ScrollView>
      {user && !loading && (
        <View style={[styles.saveBar, isMobile && styles.saveBarMobile]}>
          <Text style={styles.saveHint}>
            {dirty ? "Unsaved changes" : ""}
          </Text>
          <View style={styles.saveActions}>
              <Action
                label="Cancel"
                disabled={saving || uploadingImage}
                onPress={() => {
                  if (savedForm) setForm({ ...savedForm });
                  setError("");
                  setMessage("");
                  onNavigate("home");
                }}
              />
            <Action
              label={saving ? "Saving…" : "Save changes"}
              primary
              disabled={saving || !dirty || uploadingImage}
              onPress={saveProfile}
            />
          </View>
        </View>
      )}
    </InteriorShell>
  );
}

function initials(value: string) {
  return (
    value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "S"
  );
}
function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unknown"
    : new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date);
}
function toIsoDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
  return match ? match[3] + "-" + match[1]!.padStart(2, "0") + "-" + match[2]!.padStart(2, "0") : "";
}
function privacyMatches(value: string, option: string) {
  return value === option || (value === "LIMITED" && option === "VISIBLE_AFTER_ORDER");
}
function privacyLabel(value: string) {
  return value === "PRIVATE"
    ? "Private"
    : value === "VISIBLE_AFTER_ORDER"
      ? "Visible after an order"
      : "Public within Sharity";
}
function privacyDescription(value: string) {
  return value === "PRIVATE"
    ? "A private profile visibility preference."
    : value === "VISIBLE_AFTER_ORDER"
      ? "Prefer sharing profile details after an order."
      : "Prefer a profile visible to other Sharity members.";
}
function mergeSessions(
  sessions: UserSession[],
  browserSession: Awaited<ReturnType<typeof getBrowserSessionSummary>>,
): UserSession[] {
  return browserSession?.authenticated ? [{ id: -1, deviceName: "This browser" }, ...sessions] : sessions;
}
