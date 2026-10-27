import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { EmptyState, LoadingState } from '../../shared/components/Ui.jsx';
import { adminService } from '../../shared/api/adminService.js';
import { apiErrorMessage } from '../../shared/utils/apiError.js';
import { formatDate } from '../../shared/utils/userFormat.js';

export function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminService.roles()
      .then((data) => setRoles(Array.isArray(data) ? data : []))
      .catch((err) => setError(apiErrorMessage(err, 'Unable to load roles.')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState label="Loading roles" />;

  return (
    <div className="page-stack">
      <section className="panel surface-panel">
        <div className="section-head">
          <div>
            <h2>Roles</h2>
          </div>
          <ShieldCheck size={24} />
        </div>
        {error ? <div className="inline-error">{error}</div> : null}
        {roles.length === 0 ? (
          <EmptyState title="No roles found" text="" />
        ) : (
          <div className="table-wrap">
            <table className="standard-table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Description</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.roleName}>
                    <td><span className="code-pill">{role.roleName}</span></td>
                    <td>{role.description || '-'}</td>
                    <td>{formatDate(role.createdAt)}</td>
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
