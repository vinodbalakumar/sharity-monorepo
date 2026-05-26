import { tokenStore } from '../api/tokenStore.js';

export function launchServiceModule(url, user) {
  const target = new URL(url, window.location.origin);
  target.searchParams.set('sharityAuth', '1');
  const popup = window.open(target.href, '_blank');
  if (!popup) return;

  const payload = {
    type: 'SHARITY_AUTH',
    accessToken: tokenStore.getAccessToken(),
    refreshToken: tokenStore.getRefreshToken(),
    user: user
      ? {
          publicId: user.publicId,
          email: user.email,
          username: user.username,
          profile: user.profile,
          roles: user.roles,
          apps: user.apps,
        }
      : null,
  };

  const sendAuth = () => popup.postMessage(payload, target.origin);
  const readyListener = (event) => {
    if (event.origin !== target.origin || event.data?.type !== 'TESLA_READY_FOR_SHARITY_AUTH') return;
    sendAuth();
  };

  window.addEventListener('message', readyListener);
  [250, 700, 1400, 2500, 4000, 6500].forEach((delay) => window.setTimeout(sendAuth, delay));
  window.setTimeout(() => window.removeEventListener('message', readyListener), 10000);
}
