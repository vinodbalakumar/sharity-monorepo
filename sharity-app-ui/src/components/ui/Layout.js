import { View, ScrollView, SafeAreaView } from 'react-native';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';
// Import AppText for Section
import { AppText } from './AppText';
export function Page({ children, padding = 'lg', backgroundColor = colors.background, scrollable = false, style }) {
    const content = (<View style={[
            {
                flex: 1,
                paddingHorizontal: spacing[padding],
                paddingTop: spacing[padding],
                paddingBottom: spacing.xl,
                backgroundColor
            },
            style
        ]}>
      {children}
    </View>);
    if (scrollable) {
        return (<SafeAreaView style={{ flex: 1, backgroundColor }}>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{
                paddingHorizontal: spacing[padding],
                paddingTop: spacing[padding],
                paddingBottom: spacing.xl
            }}>
          {children}
        </ScrollView>
      </SafeAreaView>);
    }
    return (<SafeAreaView style={{ flex: 1, backgroundColor }}>
      {content}
    </SafeAreaView>);
}
export function Row({ children, gap = 'md', align = 'center', justify = 'flex-start', wrap = false, style }) {
    return (<View style={[
            {
                flexDirection: 'row',
                gap: spacing[gap],
                alignItems: align,
                justifyContent: justify,
                flexWrap: wrap ? 'wrap' : 'nowrap'
            },
            style
        ]}>
      {children}
    </View>);
}
export function Column({ children, gap = 'md', align = 'stretch', justify = 'flex-start', style }) {
    return (<View style={[
            {
                flexDirection: 'column',
                gap: spacing[gap],
                alignItems: align,
                justifyContent: justify
            },
            style
        ]}>
      {children}
    </View>);
}
export function Section({ children, title, padding = 'lg', gap = 'md', style }) {
    return (<View style={[
            {
                paddingHorizontal: spacing[padding],
                paddingVertical: spacing[padding],
                gap: spacing[gap]
            },
            style
        ]}>
      {title && (<AppText variant="sectionTitle" style={{ marginBottom: spacing.sm }}>
          {title}
        </AppText>)}
      {children}
    </View>);
}
export function Spacer({ size = 'md' }) {
    return <View style={{ height: spacing[size] }}/>;
}
export function Divider({ color = colors.border, thickness = 1, margin = 'md' }) {
    return (<View style={{
            height: thickness,
            backgroundColor: color,
            marginVertical: spacing[margin]
        }}/>);
}
export function Grid({ children, columns = 2, gap = 'md', style }) {
    return (<View style={[
            {
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: spacing[gap],
                justifyContent: 'space-between'
            },
            style
        ]}>
      {children}
    </View>);
}
