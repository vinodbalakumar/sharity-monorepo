import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Alert, Button, Field } from '../../shared/components/Ui.jsx';
import { adminService } from '../../shared/api/adminService.js';
import { apiErrorMessage } from '../../shared/utils/apiError.js';

const initialForm = {
  email: '',
  username: '',
  firstName: '',
  lastName: '',
  password: '',
  status: 'ACTIVE',
  emailVerified: true,
  roles: ['USER'],
};

export function CreateUserPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState(['USER']);

  useEffect(() => {
    adminService.roles()
      .then((data) => {
        const values = (Array.isArray(data) ? data : []).map((item) => item.roleName).filter(Boolean);
        if (values.length) setRoles(values);
      })
      .catch(() => {});
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    try {
      const created = await adminService.createUser({
        email: form.email,
        username: form.username,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        emailVerified: form.emailVerified,
        status: form.status,
        roles: form.roles,
      });
      setMessage('User created.');
      setForm(initialForm);
      const publicId = created?.publicId || created?.id;
      if (publicId) {
        setTimeout(() => navigate(`/users/${publicId}`), 650);
      }
    } catch (err) {
      setError(apiErrorMessage(err, 'Unable to create user profile.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <form className="panel form-panel modern-form" onSubmit={submit}>
        <div className="section-head">
          <div>
            <h2>Create user</h2>
          </div>
        </div>
        {message ? <Alert>{message}</Alert> : null}
        {error ? <Alert type="error">{error}</Alert> : null}
        <div className="form-grid">
          <Field label="Email" type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          <Field label="Username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
          <Field label="First name" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
          <Field label="Last name" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} />
          <Field label="Temporary password" type="password" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
          <label className="field">
            <span>Status</span>
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              {['ACTIVE', 'INACTIVE', 'LOCKED', 'SUSPENDED'].map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Initial role</span>
            <select
              value={form.roles[0] || ''}
              onChange={(event) => setForm({ ...form, roles: event.target.value ? [event.target.value] : [] })}
            >
              {roles.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={form.emailVerified}
              onChange={(event) => setForm({ ...form, emailVerified: event.target.checked })}
            />
            <span>Email verified</span>
          </label>
        </div>
        <div className="actions">
          <Button disabled={loading}>
            {loading ? 'Creating' : 'Create user'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/users')}>
            <ArrowLeft size={18} />
            Back to users
          </Button>
        </div>
      </form>
    </div>
  );
}
