import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Search, ShieldCheck, UsersRound } from 'lucide-react';
import { Button, EmptyState, LoadingState, StatusBadge } from '../../shared/components/Ui.jsx';
import { BrandAvatar } from '../../shared/components/BrandAvatar.jsx';
import { adminService } from '../../shared/api/adminService.js';
import { appsFor, formatDate, fullName, rolesFor } from '../../shared/utils/userFormat.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { apiErrorMessage } from '../../shared/utils/apiError.js';

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: '', role: '', app: '', page: 0, size: 10 });
  const [pageInfo, setPageInfo] = useState({ totalElements: 0, totalPages: 0, page: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = (nextFilters = filters) => {
    setLoading(true);
    setError('');
    const params = Object.fromEntries(
      Object.entries(nextFilters).filter(([, value]) => value !== '' && value !== null && value !== undefined),
    );
    return adminService
      .users(params)
      .then((data) => {
        setUsers(Array.isArray(data) ? data : data.content || data.items || []);
        setPageInfo({
          totalElements: data?.totalElements ?? (Array.isArray(data) ? data.length : 0),
          totalPages: data?.totalPages ?? 1,
          page: data?.page ?? nextFilters.page,
        });
      })
      .catch((err) => setError(apiErrorMessage(err, 'Unable to load users.')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [filters.page]);

  const filtered = useMemo(
    () =>
      users.filter((user) =>
        [user.email, user.username, user.publicId, fullName(user), rolesFor(user).join(' '), appsFor(user).join(' ')]
          .join(' ')
          .toLowerCase()
          .includes(filters.search.toLowerCase()),
      ),
    [users, filters.search],
  );

  const updateFilter = (patch) => {
    const next = { ...filters, ...patch, page: 0 };
    setFilters(next);
    load(next);
  };

  const updateSearch = (value) => {
    setFilters((current) => ({ ...current, search: value }));
  };

  if (loading) return <LoadingState label="Loading users from admin API" />;

  const activeUsers = users.filter((user) => user.status === 'ACTIVE').length;
  const admins = users.filter((user) => rolesFor(user).some((role) => role.includes('ADMIN'))).length;

  return (
    <div className="page-stack">
      <div className="stat-strip">
        <section className="stat-card">
          <UsersRound />
          <span>Total users</span>
          <strong>{users.length}</strong>
        </section>
        <section className="stat-card">
          <CheckCircle2 />
          <span>Active</span>
          <strong>{activeUsers}</strong>
        </section>
        <section className="stat-card">
          <ShieldCheck />
          <span>Admins</span>
          <strong>{admins}</strong>
        </section>
      </div>

      <section className="panel surface-panel">
        <div className="users-toolbar">
          <div className="container-fluid p-0">
            <div className="row g-3 align-items-end">
              <div className="col-12 col-lg-5">
                <label className="filter-label" htmlFor="user-search">Search users</label>
                <div className="input-group sharity-input-group">
                  <span className="input-group-text"><Search size={18} /></span>
                  <input
                    id="user-search"
                    className="form-control"
                    placeholder="Email, name, username, role, or app"
                    value={filters.search}
                    onChange={(event) => updateSearch(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') updateFilter({ search: event.currentTarget.value });
                    }}
                  />
                </div>
              </div>
              <div className="col-6 col-md-3 col-lg-2">
                <label className="filter-label" htmlFor="status-filter">Account status</label>
                <select id="status-filter" className="form-select" value={filters.status} onChange={(event) => updateFilter({ status: event.target.value })}>
                  <option value="">All statuses</option>
                  {['ACTIVE', 'INACTIVE', 'LOCKED', 'SUSPENDED', 'DELETED'].map((item) => <option key={item}>{item}</option>)}
                </select>
              </div>
              <div className="col-6 col-md-3 col-lg-2">
                <label className="filter-label" htmlFor="role-filter">Role</label>
                <select id="role-filter" className="form-select" value={filters.role} onChange={(event) => updateFilter({ role: event.target.value })}>
                  <option value="">All roles</option>
                  {['USER', 'ADMIN', 'SUPER_ADMIN', 'SUPPORT', 'CUSTOMER', 'VENDOR', 'DELIVERY_PARTNER'].map((item) => <option key={item}>{item}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
        {error ? <div className="inline-error">{error}</div> : null}
        {filtered.length === 0 ? (
          <EmptyState title="No users found" text="Create a user or change the search filters." />
        ) : (
          <div className="table-responsive access-table bootstrap-table-wrap">
            <table className="table table-hover align-middle mb-0 sharity-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Status</th>
                  <th>Roles</th>
                  <th>Applications</th>
                  <th>Verified</th>
                  <th>Created</th>
                  <th />
                </tr>
              </thead>
              <tbody className="table-group-divider">
                {filtered.map((user) => (
                  <tr key={user.publicId}>
                    <td>
                      <div className="user-cell">
                        <BrandAvatar user={user} size="small" />
                        <div>
                          <strong>{fullName(user)}</strong>
                          <span>{user.email}</span>
                          <span>{user.username}</span>
                        </div>
                      </div>
                    </td>
                    <td><StatusBadge value={user.status} /></td>
                    <td><ChipList values={rolesFor(user)} empty="No roles" /></td>
                    <td><ChipList values={appsFor(user)} empty="No apps" /></td>
                    <td>{user.emailVerified ? <span className="verified">Verified</span> : <span className="muted-text">Pending</span>}</td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      {currentUser?.publicId === user.publicId ? (
                        <span className="table-action disabled-action">Current login</span>
                      ) : (
                        <Link className="table-action" to={`/users/${user.publicId}`}>Manage access</Link>
                      )}
                    </td>
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

function ChipList({ values, empty }) {
  if (!values?.length) return <span className="muted-text">{empty}</span>;
  return <div className="mini-chip-row">{values.map((value) => <span className="mini-chip" key={value}>{value}</span>)}</div>;
}
