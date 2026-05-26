import { useEffect, useState } from 'react';
import { Button, EmptyState, LoadingState } from '../../shared/components/Ui.jsx';
import { authService } from '../../shared/api/authService.js';
import { formatDate } from '../../shared/utils/userFormat.js';

export function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => authService.sessions().then((data) => setSessions(Array.isArray(data) ? data : data.content || data.items || []));

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const revoke = async (id) => {
    if (!confirm('Revoke this session?')) return;
    await authService.revokeSession(id);
    await load();
  };

  if (loading) return <LoadingState label="Loading sessions" />;

  return (
    <div className="page-stack">
      <section className="panel surface-panel">
        <div className="section-head">
          <div>
            <h2>Active sessions</h2>
          </div>
          <Button variant="ghost" onClick={async () => { await authService.revokeAllSessions(); await load(); }}>Revoke all</Button>
        </div>
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
                    <td><Button variant="ghost" onClick={() => revoke(session.id)}>Revoke</Button></td>
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
