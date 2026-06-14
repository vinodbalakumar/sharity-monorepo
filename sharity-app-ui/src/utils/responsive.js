import { breakpoints, getResponsiveLayout, responsiveValue } from '../theme/breakpoints';
export { breakpoints, responsiveValue };
export { getResponsiveLayout };
export function isMobileWidth(width) {
    return width < breakpoints.tablet;
}
export function isTabletWidth(width) {
    return width >= breakpoints.tablet && width < breakpoints.desktop;
}
export function isDesktopWidth(width) {
    return width >= breakpoints.desktop;
}
export function isLargeDesktopWidth(width) {
    return width >= breakpoints.largeDesktop;
}
