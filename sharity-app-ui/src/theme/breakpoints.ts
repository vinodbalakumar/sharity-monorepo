export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  largeDesktop: 1440
};

export function responsiveValue<T>(width: number, values: { desktop?: T; largeDesktop?: T; mobile: T; tablet?: T }) {
  if (width >= breakpoints.largeDesktop && values.largeDesktop !== undefined) {
    return values.largeDesktop;
  }
  if (width >= breakpoints.desktop && values.desktop !== undefined) {
    return values.desktop;
  }
  if (width >= breakpoints.tablet && values.tablet !== undefined) {
    return values.tablet;
  }
  return values.mobile;
}

export type ResponsiveLayout = {
  isCompactPhone: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  isMobile: boolean;
  isSingleColumn: boolean;
  isTablet: boolean;
  showSidebar: boolean;
  showTabLabels: boolean;
};

export function getResponsiveLayout(width: number): ResponsiveLayout {
  const isMobile = width < breakpoints.tablet;
  const isTablet = width >= breakpoints.tablet && width < breakpoints.desktop;
  const isDesktop = width >= breakpoints.desktop;
  const isLargeDesktop = width >= breakpoints.largeDesktop;

  return {
    isCompactPhone: width < 390,
    isDesktop,
    isLargeDesktop,
    isMobile,
    isSingleColumn: width < breakpoints.desktop,
    isTablet,
    showSidebar: width >= breakpoints.desktop,
    showTabLabels: width >= 420
  };
}
