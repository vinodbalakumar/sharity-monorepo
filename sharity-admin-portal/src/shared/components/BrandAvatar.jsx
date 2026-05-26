import { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../api/httpClient.js';
import { initials, profileFor } from '../utils/userFormat.js';

export function BrandAvatar({ user, size = 'large' }) {
  const [failed, setFailed] = useState(false);
  const imageUrl = useMemo(() => avatarUrl(user), [user]);
  const className = size === 'small' ? 'avatar-small' : 'avatar-large';

  useEffect(() => {
    setFailed(false);
  }, [imageUrl]);

  if (imageUrl && !failed) {
    return <img className={`${className} avatar-image`} src={imageUrl} alt="" onError={() => setFailed(true)} />;
  }

  return <span className={className}>{initials(user) || 'S'}</span>;
}

function avatarUrl(user) {
  const profile = profileFor(user);
  const rawUrl = profile.profileImageUrl
    || profile.profileImageURL
    || profile.imageUrl
    || user?.profileImageUrl
    || user?.profileImageURL
    || user?.avatarUrl
    || '';

  const url = String(rawUrl).trim();
  if (!url) return '';
  if (/^(https?:)?\/\//i.test(url) || /^(data|blob):/i.test(url)) return url;
  if (url.startsWith('/')) {
    const baseUrl = API_BASE_URL || import.meta.env.VITE_BACKEND_ORIGIN || 'http://localhost:8083';
    return `${baseUrl}${url}`;
  }
  return url;
}
