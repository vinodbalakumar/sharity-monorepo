import { Ionicons } from "@expo/vector-icons";
import { useContext, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { logoutBrowserSession } from "../../services/sessionService";
import { colors } from "../../theme";
import { systemFontFamily } from "../../theme/typography";
import { MemberSessionContext } from "./MemberSessionContext";

export function SignOutButton() {
  const member = useContext(MemberSessionContext);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!member?.authenticated) return null;
  async function signOut() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await logoutBrowserSession();
      member?.onSignedOut();
    } catch {
      setError("Could not sign out. Try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sign out"
        accessibilityState={{ disabled: busy, busy }}
        disabled={busy}
        onPress={signOut}
        style={({ pressed }) => [
          styles.button,
          pressed && { backgroundColor: colors.primaryLight },
          busy && { opacity: 0.7 },
        ]}
      >
        {busy ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Ionicons
            name="log-out-outline"
            size={19}
            color={colors.textSecondary}
          />
        )}
        <Text style={styles.label}>{busy ? "Signing out…" : "Sign out"}</Text>
      </Pressable>
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { maxWidth: 170, minWidth: 0 },
  button: {
    minHeight: 44,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 8,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: systemFontFamily,
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  error: {
    fontFamily: systemFontFamily,
    fontSize: 12,
    color: colors.error,
    maxWidth: 160,
    paddingTop: 4,
  },
});
