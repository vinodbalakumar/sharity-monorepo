import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, KeyRound, PackageCheck, ShieldCheck, Trash2, UserCog, MonitorSmartphone } from 'lucide-react';
import { Alert, Button, EmptyState, Field, LoadingState, StatusBadge } from '../../shared/components/Ui.jsx';
import { BrandAvatar } from '../../shared/components/BrandAvatar.jsx';
import { adminService } from '../../shared/api/adminService.js';
import { appsFor, formatDate, fullName, profileFor, rolesFor } from '../../shared/utils/userFormat.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { apiErrorMessage } from '../../shared/utils/apiError.js';

const statusOptions = ['ACTIVE', 'INACTIVE', 'LOCKED', 'SUSPENDED', 'DELETED'];

export function UserDetailsPage() {
  const { publicId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [roleOptions, setRoleOptions] = useState(['USER']);
  const [sessions, setSessions] = useState([]);
  const [profile, setProfile] = useState({ firstName: '', lastName: '', phoneNumber: '', profileImageUrl: '' });
  const [role, setRole] = useState('ADMIN');
  const [appCode, setAppCode] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [notice, setNotice] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  const load = async () => {
    setLoading(true);
    const [userData, apps, roles, sessionData] = await Promise.all([
      adminService.user(publicId),
      adminService.applications().catch(() => []),
      adminService.roles().catch(() => []),
      adminService.userSessions(publicId).catch(() => []),
    ]);
    setUser(userData);
    setProfile(profilePayload(userData));
    setStatus(userData.status || 'ACTIVE');
    const loadedRoles = (Array.isArray(roles) ? roles : []).map((item) => item.roleName).filter(Boolean);
    if (loadedRoles.length) {
      setRoleOptions(loadedRoles);
      setRole(loadedRoles.find((item) => !rolesFor(userData).includes(item)) || loadedRoles[0]);
    }
    setSessions(Array.isArray(sessionData) ? sessionData : []);
    setApplications(Array.isArray(apps) ? apps : []);
    setAppCode((Array.isArray(apps) ? apps : []).find((app) => app.active !== false)?.appCode || 'MARKETPLACE');
    setLoading(false);
  };

  useEffect(() => {
    load().catch((err) => {
      setNotice({ type: 'error', text: apiErrorMessage(err, 'Unable to load user.') });
      setLoading(false);
    });
  }, [publicId]);

  const assignedRoles = rolesFor(user);
  const assignedApps = appsFor(user);
  const availableApps = useMemo(
    () => applications.filter((app) => app.active !== false && !assignedApps.includes(app.appCode)),
    [applications, assignedApps],
  );

  const run = async (label, fn, success) => {
    setBusy(label);
    setNotice({ type: '', text: '' });
    try {
      const updated = await fn();
      if (updated?.publicId) setUser(updated);
      else await load();
      setNotice({ type: 'success', text: success });
    } catch (err) {
      setNotice({ type: 'error', text: apiErrorMessage(err, 'Action failed.') });
    } finally {
      setBusy('');
    }
  };

  if (loading) return <LoadingState label="Loading user access details" />;
  if (!user) return <EmptyState title="User unavailable" text="" />;
  const isCurrentUser = currentUser?.publicId === user.publicId;
  const saveProfile = (event) => {
    event.preventDefault();
    run('profile', () => adminService.updateUserProfile(publicId, profile), 'Profile updated.');
  };
  const removeUser = async () => {
    if (!confirm(`Delete profile for ${user.email}?`)) return;
    setBusy('delete');
    setNotice({ type: '', text: '' });
    try {
      await adminService.deleteUser(publicId);
      navigate('/users', { replace: true });
    } catch (err) {
      setNotice({ type: 'error', text: apiErrorMessage(err, 'Unable to delete profile.') });
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="page-stack">
      <div className="detail-hero">
        <Link className="back-link" to="/users"><ArrowLeft size={18} /> Back to users</Link>
        <div className="detail-identity">
          <BrandAvatar user={user} />
          <div>
            <h2>{fullName(user)}</h2>
            <span>{user.email}</span>
            <div className="hero-meta">
              <StatusBadge value={user.status} />
              <span>{user.emailVerified ? 'Email verified' : 'Email pending'}</span>
              <span>Created {formatDate(user.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {notice.text ? <Alert type={notice.type}>{notice.text}</Alert> : null}

      <div className="access-columns">
        <div className="access-column">
          <section className="panel access-card">
            <div className="card-title"><BadgeCheck /><h2>Account details</h2></div>
            <div className="data-list compact-list">
              <DataRow label="Public ID" value={user.publicId} />
              <DataRow label="Username" value={user.username} />
              <DataRow label="Email verified" value={user.emailVerified ? 'Yes' : 'No'} />
            </div>
          </section>

          <section className="panel access-card">
            <div className="card-title"><ShieldCheck /><h2>Roles</h2></div>
            <div className="access-chip-grid">
              {assignedRoles.length ? assignedRoles.map((item) => (
                <button className="access-chip danger" type="button" key={item} disabled={busy === item} onClick={() => run(item, () => adminService.removeRole(publicId, item), `${item} removed.`)}>
                  <KeyRound size={16} />
                  {item}
                  <span>Remove</span>
                </button>
              )) : <span className="muted-text">No roles assigned</span>}
            </div>
            <div className="assign-box">
              <select value={role} onChange={(event) => setRole(event.target.value)}>
                {roleOptions.filter((item) => !assignedRoles.includes(item)).map((item) => <option key={item}>{item}</option>)}
              </select>
              <Button disabled={busy === 'role' || assignedRoles.includes(role)} onClick={() => run('role', () => adminService.assignRole(publicId, role), `${role} assigned.`)}>
                Assign role
              </Button>
            </div>
          </section>

          <section className="panel access-card">
            <div className="card-title"><PackageCheck /><h2>Application access</h2></div>
            <div className="access-chip-grid">
              {assignedApps.length ? assignedApps.map((item) => (
                <button className="access-chip danger" type="button" key={item} disabled={busy === item} onClick={() => run(item, () => adminService.removeApplication(publicId, item), `${item} access removed.`)}>
                  <BadgeCheck size={16} />
                  {item}
                  <span>Remove</span>
                </button>
              )) : <span className="muted-text">No application access assigned</span>}
            </div>
            <div className="assign-box">
              <select value={appCode} onChange={(event) => setAppCode(event.target.value)}>
                {(availableApps.length ? availableApps : applications).map((app) => <option key={app.appCode} value={app.appCode}>{app.appName || app.appCode}</option>)}
              </select>
              <Button disabled={busy === 'app' || !appCode || assignedApps.includes(appCode)} onClick={() => run('app', () => adminService.assignApplication(publicId, appCode), `${appCode} access assigned.`)}>
                Assign app
              </Button>
            </div>
          </section>

          {!isCurrentUser ? (
            <section className="panel access-card danger-panel">
              <div className="card-title"><Trash2 /><h2>Delete profile</h2></div>
              <Button variant="ghost" disabled={busy === 'delete'} onClick={removeUser}>
                Delete profile
              </Button>
            </section>
          ) : null}
        </div>

        <div className="access-column">
          <form className="panel access-card" onSubmit={saveProfile}>
            <div className="card-title"><UserCog /><h2>Profile</h2></div>
            <div className="form-grid single">
              <Field label="First name" value={profile.firstName} onChange={(event) => setProfile({ ...profile, firstName: event.target.value })} />
              <Field label="Last name" value={profile.lastName} onChange={(event) => setProfile({ ...profile, lastName: event.target.value })} />
              <Field label="Phone number" value={profile.phoneNumber} onChange={(event) => setProfile({ ...profile, phoneNumber: event.target.value })} />
              <Field label="Profile image URL" value={profile.profileImageUrl} onChange={(event) => setProfile({ ...profile, profileImageUrl: event.target.value })} />
            </div>
            <Button disabled={busy === 'profile'}>Save profile</Button>
          </form>

          <section className="panel access-card">
            <div className="card-title"><UserCog /><h2>Account status</h2></div>
            <div className="assign-box">
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                {statusOptions.map((item) => <option key={item}>{item}</option>)}
              </select>
              <Button disabled={busy === 'status'} onClick={() => run('status', () => adminService.updateUserStatus(publicId, { status }), `Status updated to ${status}.`)}>
                Update status
              </Button>
            </div>
          </section>

          <section className="panel access-card">
            <div className="card-title"><MonitorSmartphone /><h2>Active sessions</h2></div>
            {sessions.length ? (
              <div className="session-list compact-session-list">
                {sessions.map((session) => (
                  <div className="session-item" key={session.id}>
                    <div>
                      <strong>{session.deviceName || 'Unknown device'}</strong>
                      <span>{session.ipAddress || '-'}</span>
                      <span>Expires {formatDate(session.expiresAt)}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={busy === `session-${session.id}`}
                      onClick={() => run(`session-${session.id}`, () => adminService.revokeUserSession(publicId, session.id), 'Session revoked.')}
                    >
                      Revoke
                    </Button>
                  </div>
                ))}
              </div>
            ) : <span className="muted-text">No active sessions found.</span>}
          </section>
        </div>
      </div>
    </div>
  );
}

function DataRow({ label, value }) {
  return <div className="data-row"><span>{label}</span><strong>{value || '-'}</strong></div>;
}

function profilePayload(user) {
  const profile = profileFor(user);
  return {
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    phoneNumber: profile.phoneNumber || '',
    profileImageUrl: profile.profileImageUrl || '',
  };
}
