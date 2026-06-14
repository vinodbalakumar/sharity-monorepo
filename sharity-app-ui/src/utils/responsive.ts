import { breakpoints, getResponsiveLayout, responsiveValue } from '../theme/breakpoints';

export { breakpoints, responsiveValue };
export { getResponsiveLayout };

export function isMobileWidth(width: number) {
  return width < breakpoints.tablet;
}

export function isTabletWidth(width: number) {
  return width >= breakpoints.tablet && width < breakpoints.desktop;
}

export function isDesktopWidth(width: number) {
  return width >= breakpoints.desktop;
}

export function isLargeDesktopWidth(width: number) {
  return width >= breakpoints.largeDesktop;
}
