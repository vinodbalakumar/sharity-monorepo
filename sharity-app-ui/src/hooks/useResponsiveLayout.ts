import { useWindowDimensions } from 'react-native';

import { breakpoints, responsiveValue } from '../theme';

export function useResponsiveLayout() {
  const { width } = useWindowDimensions();

  return {
    isDesktop: width >= breakpoints.desktop,
    isLargeDesktop: width >= breakpoints.largeDesktop,
    isMobile: width < breakpoints.tablet,
    isTablet: width >= breakpoints.tablet && width < breakpoints.desktop,
    responsiveValue: <T>(values: { desktop?: T; largeDesktop?: T; mobile: T; tablet?: T }) => responsiveValue(width, values),
    width
  };
}
