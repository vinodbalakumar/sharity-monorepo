import { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Row } from './index';
import { colors, spacing, radius } from '../../theme';
export function DatePickerModal({ visible, onClose, onDateSelect, value = '', title = 'Select Date of Birth' }) {
    const [month, setMonth] = useState(1);
    const [day, setDay] = useState(1);
    const [year, setYear] = useState(new Date().getFullYear() - 20);
    const currentYear = new Date().getFullYear();
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const daysInMonth = new Date(year, month, 0).getDate();
    const handleSelect = () => {
        const dateStr = `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year}`;
        onDateSelect(dateStr);
        onClose();
    };
    return (<Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: colors.overlay }}>
        <Pressable style={{ flex: 1 }} onPress={onClose}/>

        <View style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            paddingTop: spacing.lg,
            paddingBottom: spacing['2xl']
        }}>
          {/* Header */}
          <Row justify="space-between" style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
            <AppText variant="cardTitle" color="primary">{title}</AppText>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={colors.textSecondary}/>
            </Pressable>
          </Row>

          {/* Picker */}
          <Row gap="sm" style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
            {/* Month Picker */}
            <ScrollView style={{ flex: 1, maxHeight: 200 }} showsVerticalScrollIndicator={false}>
              {months.map((m, idx) => (<Pressable key={m} onPress={() => setMonth(idx + 1)} style={{
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.md,
                backgroundColor: month === idx + 1 ? colors.primaryLight : 'transparent',
                borderRadius: radius.md,
                marginVertical: spacing.xs
            }}>
                  <AppText variant="body" color={month === idx + 1 ? 'primary' : 'secondary'} weight={month === idx + 1 ? 'semibold' : 'normal'} align="center">
                    {m}
                  </AppText>
                </Pressable>))}
            </ScrollView>

            {/* Day Picker */}
            <ScrollView style={{ flex: 1, maxHeight: 200 }} showsVerticalScrollIndicator={false}>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (<Pressable key={d} onPress={() => setDay(d)} style={{
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.md,
                backgroundColor: day === d ? colors.primaryLight : 'transparent',
                borderRadius: radius.md,
                marginVertical: spacing.xs
            }}>
                  <AppText variant="body" color={day === d ? 'primary' : 'secondary'} weight={day === d ? 'semibold' : 'normal'} align="center">
                    {d.toString().padStart(2, '0')}
                  </AppText>
                </Pressable>))}
            </ScrollView>

            {/* Year Picker */}
            <ScrollView style={{ flex: 1, maxHeight: 200 }} showsVerticalScrollIndicator={false}>
              {Array.from({ length: 80 }, (_, i) => currentYear - 18 - i).map((y) => (<Pressable key={y} onPress={() => setYear(y)} style={{
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.md,
                backgroundColor: year === y ? colors.primaryLight : 'transparent',
                borderRadius: radius.md,
                marginVertical: spacing.xs
            }}>
                  <AppText variant="body" color={year === y ? 'primary' : 'secondary'} weight={year === y ? 'semibold' : 'normal'} align="center">
                    {y}
                  </AppText>
                </Pressable>))}
            </ScrollView>
          </Row>

          {/* Selected Date Display */}
          <View style={{
            paddingHorizontal: spacing.lg,
            marginBottom: spacing.lg,
            paddingVertical: spacing.md,
            backgroundColor: colors.surfaceVariant,
            borderRadius: radius.md
        }}>
            <AppText variant="caption" color="secondary">Selected Date</AppText>
            <AppText variant="title" color="primary">
              {`${months[month - 1]} ${day}, ${year}`}
            </AppText>
          </View>

          {/* Action Buttons */}
          <Row gap="md" style={{ paddingHorizontal: spacing.lg }}>
            <Pressable onPress={onClose} style={{
            flex: 1,
            paddingVertical: spacing.md,
            backgroundColor: colors.gray100,
            borderRadius: radius.md,
            alignItems: 'center'
        }}>
              <AppText variant="button" color="primary">Cancel</AppText>
            </Pressable>
            <Pressable onPress={handleSelect} style={{
            flex: 1,
            paddingVertical: spacing.md,
            backgroundColor: colors.primary,
            borderRadius: radius.md,
            alignItems: 'center'
        }}>
              <AppText variant="button" color="inherit" style={{ color: colors.white }}>
                Select
              </AppText>
            </Pressable>
          </Row>
        </View>
      </View>
    </Modal>);
}
