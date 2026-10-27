import { useEffect, useState } from 'react';
import { Button, EmptyState, LoadingState } from '../../shared/components/Ui.jsx';
import { adminService } from '../../shared/api/adminService.js';
import { formatDate } from '../../shared/utils/userFormat.js';
import { apiErrorMessage } from '../../shared/utils/apiError.js';

export function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({ actor: '', target: '', action: '', page: 0, size: 20 });
  const [pageInfo, setPageInfo] = useState({ page: 0, totalPages: 0, totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = (nextFilters = filters) => {
    setLoading(true);
    setError('');
    const params = Object.fromEntries(
      Object.entries(nextFilters).filter(([, value]) => value !== '' && value !== null && value !== undefined),
    );
    adminService.auditLogs(params)
      .then((logData) => {
        setLogs(Array.isArray(logData) ? logData : logData.content || logData.items || []);
        setPageInfo({
          page: logData?.page ?? nextFilters.page,
          totalPages: logData?.totalPages ?? 1,
          totalElements: logData?.totalElements ?? (Array.isArray(logData) ? logData.length : 0),
        });
      })
      .catch((err) => setError(apiErrorMessage(err, 'Unable to load audit logs.')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [filters.page]);

  const updateFilter = (patch) => {
    const next = { ...filters, ...patch, page: 0 };
    setFilters(next);
    load(next);
  };

  if (loading) return <LoadingState label="Loading audit logs" />;

  return (
    <div className="page-stack">
      <section className="panel surface-panel">
        <div className="section-head">
          <div>
            <h2>Audit logs</h2>
            <span>{pageInfo.totalElements} security and administration events</span>
          </div>
          <div className="actions toolbar-actions">
            <input className="plain-filter" placeholder="Actor email or ID" value={filters.actor} onChange={(event) => updateFilter({ actor: event.target.value })} />
            <input className="plain-filter" placeholder="Target email or ID" value={filters.target} onChange={(event) => updateFilter({ target: event.target.value })} />
            <input className="plain-filter" placeholder="Action" value={filters.action} onChange={(event) => updateFilter({ action: event.target.value })} />
          </div>
        </div>
        {error ? <div className="inline-error">{error}</div> : null}
        {logs.length === 0 ? (
          <EmptyState title="No audit records" text="" />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th className="col-action">Action</th>
                  <th className="col-person">Actor</th>
                  <th className="col-person">Target</th>
                  <th className="col-entity">Entity</th>
                  <th className="col-ip">IP</th>
                  <th className="col-time">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id || `${log.action}-${log.createdAt}`}>
                    <td><strong>{humanizeAction(log.action)}</strong></td>
                    <td><PersonCell name={log.actorName} email={log.actorEmail} publicId={log.actorPublicId} fallback="System" /></td>
                    <td><PersonCell name={log.targetName} email={log.targetEmail} publicId={log.targetPublicId} fallback={log.entityId || '-'} /></td>
                    <td><EntityCell log={log} /></td>
                    <td className="mono-cell">{log.ipAddress || '-'}</td>
                    <td className="time-cell">{formatDate(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pageInfo.totalPages > 1 ? (
          <div className="table-footer">
            <Button
              type="button"
              variant="ghost"
              disabled={filters.page <= 0}
              onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}
            >
              Previous
            </Button>
            <span>Page {pageInfo.page + 1} of {pageInfo.totalPages}</span>
            <Button
              type="button"
              variant="ghost"
              disabled={filters.page >= pageInfo.totalPages - 1}
              onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
            >
              Next
            </Button>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function PersonCell({ name, email, publicId, fallback }) {
  if (!publicId) return <span className="muted-text">{fallback}</span>;
  if (!name && !email) {
    return (
      <div>
        <strong>Unavailable user</strong>
        <span className="truncate-text">{shortId(publicId)}</span>
      </div>
    );
  }

  return (
    <div>
      <strong>{name || email}</strong>
      <span className="truncate-text">{email || shortId(publicId)}</span>
    </div>
  );
}

function EntityCell({ log }) {
  return (
    <div>
      <strong>{humanizeAction(log.entityType || 'Record')}</strong>
      <span className="truncate-text">{log.entityId || '-'}</span>
    </div>
  );
}

function humanizeAction(value = '') {
  return value
    .toString()
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function shortId(value) {
  return value?.length > 12 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value;
}
