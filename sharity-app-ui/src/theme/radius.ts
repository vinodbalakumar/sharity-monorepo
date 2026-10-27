export const radius = {
  // Zero radius (sharp corners)
  none: 0,

  // Micro radius (2-4px)
  xs: 2,
  sm: 4,

  // Small radius (6-8px, inputs/small elements)
  small: 6,
  md: 8,

  // Medium radius (12px, cards)
  medium: 12,
  lg: 12,

  // Large radius (16-20px, buttons)
  large: 16,
  xl: 16,
  '2xl': 20,

  // Extra large (24px, modals)
  '3xl': 24,

  // Pill/round (fully rounded)
  pill: 999,
  full: 999
};

export const radii = {
  // Aliases for consistency
  none: radius.none,
  xs: radius.xs,
  sm: radius.sm,
  md: radius.medium,
  lg: radius.large,
  xl: radius.xl,
  '2xl': radius['2xl'],
  '3xl': radius['3xl'],
  full: radius.full
};
