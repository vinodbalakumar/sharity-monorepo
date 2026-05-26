import { useEffect, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { Alert, Button, EmptyState, Field, LoadingState, StatusBadge } from '../../shared/components/Ui.jsx';
import { adminService } from '../../shared/api/adminService.js';
import { apiErrorMessage } from '../../shared/utils/apiError.js';

const initialForm = { appCode: '', appName: '', description: '', active: true };

export function ApplicationsPage() {
  const [apps, setApps] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState({ type: '', text: '' });

  const load = () => adminService.applications().then((data) => setApps(Array.isArray(data) ? data : data.content || data.items || []));

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const create = async (event) => {
    event.preventDefault();
    setNotice({ type: '', text: '' });
    if (!form.appCode || !form.appName) return;
    try {
      await adminService.createApplication(form);
      setForm(initialForm);
      await load();
      setNotice({ type: 'success', text: 'Application created.' });
    } catch (error) {
      setNotice({ type: 'error', text: apiErrorMessage(error, 'Unable to create application.') });
    }
  };

  if (loading) return <LoadingState label="Loading applications" />;

  return (
    <div className="standard-grid">
      <section className="panel surface-panel">
        <div className="section-head">
          <div>
            <h2>Applications</h2>
          </div>
        </div>
        {apps.length === 0 ? <EmptyState title="No applications" text="" /> : (
          <div className="table-wrap">
            <table className="standard-table">
              <thead>
                <tr>
                  <th>Application</th>
                  <th>Code</th>
                  <th>Description</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((app) => (
                  <tr key={app.appCode}>
                    <td><strong>{app.appName}</strong></td>
                    <td><span className="code-pill">{app.appCode}</span></td>
                    <td>{app.description || <span className="muted-text">No description</span>}</td>
                    <td><StatusBadge value={app.active ? 'ACTIVE' : 'INACTIVE'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <form className="panel side-form" onSubmit={create}>
        <div className="section-head">
          <div>
            <h2>Create application</h2>
          </div>
          <PlusCircle size={20} />
        </div>
        {notice.text ? <Alert type={notice.type}>{notice.text}</Alert> : null}
        <Field label="App code" value={form.appCode} onChange={(event) => setForm({ ...form, appCode: event.target.value.toUpperCase() })} />
        <Field label="App name" value={form.appName} onChange={(event) => setForm({ ...form, appName: event.target.value })} />
        <Field label="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        <label className="toggle-row compact-toggle">
          <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
          Active
        </label>
        <Button>Create application</Button>
      </form>
    </div>
  );
}
