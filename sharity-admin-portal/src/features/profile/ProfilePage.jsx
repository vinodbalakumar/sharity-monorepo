import { useEffect, useState } from 'react';
import { BadgeCheck, IdCard, Mail, Shield, UserRound } from 'lucide-react';
import { Alert, Button, Field, LoadingState, StatusBadge } from '../../shared/components/Ui.jsx';
import { authService } from '../../shared/api/authService.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { appsFor, fullName, profileFor, rolesFor } from '../../shared/utils/userFormat.js';
import { BrandAvatar } from '../../shared/components/BrandAvatar.jsx';
import { apiErrorMessage } from '../../shared/utils/apiError.js';

const initialPassword = { currentPassword: '', newPassword: '' };

export function ProfilePage() {
  const { user, reloadUser } = useAuth();
  const [me, setMe] = useState(user);
  const [profile, setProfile] = useState(profilePayload(user));
  const [password, setPassword] = useState(initialPassword);
  const [status, setStatus] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);

  const loadMe = async () => {
    setLoading(true);
    const data = await authService.me();
    setMe(data);
    setProfile(profilePayload(data));
    setLoading(false);
  };

  useEffect(() => {
    loadMe().catch(() => setLoading(false));
  }, []);

  const saveProfile = async (event) => {
    event.preventDefault();
    setStatus({ type: '', text: '' });
    try {
      await authService.updateProfile(profile);
      await reloadUser();
      await loadMe();
      setStatus({ type: 'success', text: 'Profile updated.' });
    } catch (error) {
      setStatus({ type: 'error', text: apiErrorMessage(error, 'Unable to update profile.') });
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setStatus({ type: '', text: '' });
    try {
      await authService.changePassword(password);
      setPassword(initialPassword);
      setStatus({ type: 'success', text: 'Password updated.' });
    } catch (error) {
      setStatus({ type: 'error', text: apiErrorMessage(error, 'Unable to update password.') });
    }
  };

  if (loading) return <LoadingState label="Loading profile" />;
  const previewUser = { ...me, profile: { ...profileFor(me), ...profile } };

  return (
    <div className="profile-grid refined-profile">
      <section className="panel identity-panel">
        <div className="profile-cover">
          <BrandAvatar user={previewUser} />
          <div>
            <h2>{fullName(me)}</h2>
            <span>{me?.username}</span>
          </div>
          <StatusBadge value={me?.status || 'ACTIVE'} />
        </div>
        {status.text ? <Alert type={status.type}>{status.text}</Alert> : null}
        <div className="info-grid">
          <InfoTile icon={Mail} label="Email" value={me?.email} />
          <InfoTile icon={IdCard} label="Public ID" value={me?.publicId} />
          <InfoTile icon={BadgeCheck} label="Email verified" value={me?.emailVerified ? 'Yes' : 'No'} />
          <InfoTile icon={Shield} label="Roles" value={rolesFor(me).join(', ') || 'No roles'} />
          <InfoTile icon={UserRound} label="Applications" value={appsFor(me).join(', ') || 'No apps'} />
        </div>
      </section>

      <form className="panel" onSubmit={saveProfile}>
        <div className="section-head">
          <div>
            <h2>Edit profile</h2>
          </div>
        </div>
        <div className="form-grid single">
          <Field label="First name" value={profile.firstName} onChange={(event) => setProfile({ ...profile, firstName: event.target.value })} />
          <Field label="Last name" value={profile.lastName} onChange={(event) => setProfile({ ...profile, lastName: event.target.value })} />
          <Field label="Phone number" value={profile.phoneNumber} onChange={(event) => setProfile({ ...profile, phoneNumber: event.target.value })} />
          <Field label="Profile image URL" value={profile.profileImageUrl} onChange={(event) => setProfile({ ...profile, profileImageUrl: event.target.value })} />
        </div>
        <Button>Save profile</Button>
      </form>

      <form className="panel" onSubmit={changePassword}>
        <h2>Change password</h2>
        <Field label="Current password" type="password" value={password.currentPassword} onChange={(event) => setPassword({ ...password, currentPassword: event.target.value })} />
        <Field label="New password" type="password" value={password.newPassword} onChange={(event) => setPassword({ ...password, newPassword: event.target.value })} />
        <Button>Update password</Button>
      </form>

    </div>
  );
}

function profilePayload(user) {
  const profile = profileFor(user);
  return {
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    phoneNumber: profile.phoneNumber || '',
    profileImageUrl: profile.profileImageUrl || profile.profileImageURL || profile.imageUrl || user?.profileImageUrl || user?.avatarUrl || '',
  };
}

function InfoTile({ icon: Icon, label, value }) {
  return (
    <div className="info-tile">
      <Icon size={18} />
      <span>{label}</span>
      <strong>{value || '-'}</strong>
    </div>
  );
}
