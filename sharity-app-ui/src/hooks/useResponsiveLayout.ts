import { useWindowDimensions } from 'react-native';

import { getResponsiveLayout, responsiveValue } from '../theme';

export function useResponsiveLayout() {
  const { width } = useWindowDimensions();
  const layout = getResponsiveLayout(width);

  return {
    ...layout,
    responsiveValue: <T>(values: { desktop?: T; largeDesktop?: T; mobile: T; tablet?: T }) => responsiveValue(width, values),
    width
  };
}
