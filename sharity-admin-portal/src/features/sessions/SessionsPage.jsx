import { useEffect, useState } from 'react';
import { Alert, Button, EmptyState, LoadingState } from '../../shared/components/Ui.jsx';
import { authService } from '../../shared/api/authService.js';
import { formatDate } from '../../shared/utils/userFormat.js';

export function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const data = await authService.sessions();
      setSessions(Array.isArray(data) ? data : data.content || data.items || []);
      setError('');
    } catch { setError('Unable to load sessions. Please retry.'); }
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const revoke = async (id) => {
    if (!confirm('Revoke this session?')) return;
    setBusy(true);
    try { await authService.revokeSession(id); await load(); }
    catch { setError('Unable to revoke this session. Please try again.'); }
    finally { setBusy(false); }
  };

  if (loading) return <LoadingState label="Loading sessions" />;

  return (
    <div className="page-stack">
      <section className="panel surface-panel">
        <div className="section-head">
          <div>
            <h2>Active sessions</h2>
          </div>
          <Button variant="ghost" disabled={busy} onClick={async () => {
            if (!confirm('Revoke all active sessions?')) return;
            setBusy(true);
            try { await authService.revokeAllSessions(); await load(); }
            catch { setError('Unable to revoke all sessions. Please try again.'); }
            finally { setBusy(false); }
          }}>Revoke all</Button>
        </div>
        {error && <><Alert type="error">{error}</Alert><Button variant="ghost" onClick={load}>Retry loading sessions</Button></>}
        {sessions.length === 0 ? <EmptyState title="No active sessions" text="" /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Device</th><th>IP</th><th>Issued</th><th>Last used</th><th>Expires</th><th /></tr></thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id}>
                    <td><strong>{session.deviceName || 'Unknown device'}</strong><span>{session.userAgent}</span></td>
                    <td>{session.ipAddress || '-'}</td>
                    <td>{formatDate(session.issuedAt)}</td>
                    <td>{formatDate(session.lastUsedAt)}</td>
                    <td>{formatDate(session.expiresAt)}</td>
                    <td><Button variant="ghost" disabled={busy} onClick={() => revoke(session.id)}>Revoke</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
