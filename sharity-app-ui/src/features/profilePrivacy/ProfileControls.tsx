import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, TextInput, View } from "react-native";
import { colors } from "../../theme";
import { styles } from "./profileStyles";

export function Field({
  label,
  value,
  onChangeText,
  helper,
  disabled,
  keyboardType,
  maxLength,
}: {
  label: string;
  value: string;
  onChangeText?: (value: string) => void;
  helper?: string;
  disabled?: boolean;
  keyboardType?: "phone-pad";
  maxLength?: number;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        editable={!disabled}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        maxLength={maxLength}
        style={[styles.input, disabled && styles.inputDisabled]}
      />
      {helper && <Text style={styles.helper}>{helper}</Text>}
    </View>
  );
}
export function Section({ title, description }: { title: string; description: string }) {
  return (
    <View style={styles.sectionHeading}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {title}
      </Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}
export function Action({
  label,
  onPress,
  primary,
  disabled,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        primary && styles.primaryAction,
        disabled && styles.disabled,
        pressed && { opacity: 0.8 },
      ]}
    >
      <Text style={[styles.actionText, primary && { color: "white" }]}>{label}</Text>
    </Pressable>
  );
}
export function Choice({
  label,
  detail,
  selected,
  onPress,
  disabled,
}: {
  label: string;
  detail?: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected, disabled: !!disabled }}
      aria-checked={selected}
      disabled={disabled}
      onPress={onPress}
      style={[styles.choice, selected && styles.choiceSelected]}
    >
      <Ionicons
        name={selected ? "radio-button-on" : "radio-button-off"}
        size={17}
        color={selected ? colors.primary : colors.textSecondary}
      />
      <Text style={[styles.choiceText, selected && { color: colors.primary }]}>
        {label}
        {detail ? " (" + detail + ")" : ""}
      </Text>
    </Pressable>
  );
}
