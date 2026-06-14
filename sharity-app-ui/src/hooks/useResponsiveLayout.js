import { useWindowDimensions } from 'react-native';
import { getResponsiveLayout, responsiveValue } from '../utils/responsive';
export function useResponsiveLayout() {
    const { width } = useWindowDimensions();
    const layout = getResponsiveLayout(width);
    return {
        ...layout,
        responsiveValue: (values) => responsiveValue(width, values),
        width
    };
}
