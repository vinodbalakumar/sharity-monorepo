export const rolesFor = (user) => user?.roles || [];
export const appsFor = (user) => user?.apps || user?.applications || user?.appAccess || [];
export const profileFor = (user) => user?.profile || {};

export function fullName(user) {
  const profile = profileFor(user);
  return [profile.firstName, profile.lastName].filter(Boolean).join(' ') || user?.username || user?.email || 'User';
}

export function initials(user) {
  const name = fullName(user);
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'S';
}

export function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
