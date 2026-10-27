import type { ReactNode } from 'react';
import { View, ScrollView, SafeAreaView } from 'react-native';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';

// Import AppText for Section
import { AppText } from './AppText';

// Page wrapper with safe area and standard padding
type PageProps = {
  children: ReactNode;
  padding?: keyof typeof spacing;
  backgroundColor?: string;
  scrollable?: boolean;
  style?: any;
};

export function Page({
  children,
  padding = 'lg',
  backgroundColor = colors.background,
  scrollable = false,
  style
}: PageProps) {
  const content = (
    <View
      style={[
        {
          flex: 1,
          paddingHorizontal: spacing[padding as keyof typeof spacing],
          paddingTop: spacing[padding as keyof typeof spacing],
          paddingBottom: spacing.xl,
          backgroundColor
        },
        style
      ]}
    >
      {children}
    </View>
  );

  if (scrollable) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor }}>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: spacing[padding as keyof typeof spacing],
            paddingTop: spacing[padding as keyof typeof spacing],
            paddingBottom: spacing.xl
          }}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }}>
      {content}
    </SafeAreaView>
  );
}

// Horizontal stack (flexDirection: 'row')
type RowProps = {
  children: ReactNode;
  gap?: keyof typeof spacing;
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  wrap?: boolean;
  style?: any;
};

export function Row({
  children,
  gap = 'md',
  align = 'center',
  justify = 'flex-start',
  wrap = false,
  style
}: RowProps) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          gap: spacing[gap as keyof typeof spacing],
          alignItems: align,
          justifyContent: justify,
          flexWrap: wrap ? 'wrap' : 'nowrap'
        },
        style
      ]}
    >
      {children}
    </View>
  );
}

// Vertical stack (flexDirection: 'column')
type ColumnProps = {
  children: ReactNode;
  gap?: keyof typeof spacing;
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  style?: any;
};

export function Column({
  children,
  gap = 'md',
  align = 'stretch',
  justify = 'flex-start',
  style
}: ColumnProps) {
  return (
    <View
      style={[
        {
          flexDirection: 'column',
          gap: spacing[gap as keyof typeof spacing],
          alignItems: align,
          justifyContent: justify
        },
        style
      ]}
    >
      {children}
    </View>
  );
}

// Section with header and padding
type SectionProps = {
  children: ReactNode;
  title?: string;
  padding?: keyof typeof spacing;
  gap?: keyof typeof spacing;
  style?: any;
};

export function Section({
  children,
  title,
  padding = 'lg',
  gap = 'md',
  style
}: SectionProps) {
  return (
    <View
      style={[
        {
          paddingHorizontal: spacing[padding as keyof typeof spacing],
          paddingVertical: spacing[padding as keyof typeof spacing],
          gap: spacing[gap as keyof typeof spacing]
        },
        style
      ]}
    >
      {title && (
        <AppText variant="sectionTitle" style={{ marginBottom: spacing.sm }}>
          {title}
        </AppText>
      )}
      {children}
    </View>
  );
}

// Spacer component
type SpacerProps = {
  size?: keyof typeof spacing;
};

export function Spacer({ size = 'md' }: SpacerProps) {
  return <View style={{ height: spacing[size as keyof typeof spacing] }} />;
}

// Divider component
type DividerProps = {
  color?: string;
  thickness?: number;
  margin?: keyof typeof spacing;
};

export function Divider({
  color = colors.border,
  thickness = 1,
  margin = 'md'
}: DividerProps) {
  return (
    <View
      style={{
        height: thickness,
        backgroundColor: color,
        marginVertical: spacing[margin as keyof typeof spacing]
      }}
    />
  );
}

// Grid layout component
type GridProps = {
  children: ReactNode;
  columns?: number;
  gap?: keyof typeof spacing;
  style?: any;
};

export function Grid({
  children,
  columns = 2,
  gap = 'md',
  style
}: GridProps) {
  return (
    <View
      style={[
        {
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing[gap as keyof typeof spacing],
          justifyContent: 'space-between'
        },
        style
      ]}
    >
      {children}
    </View>
  );
}
