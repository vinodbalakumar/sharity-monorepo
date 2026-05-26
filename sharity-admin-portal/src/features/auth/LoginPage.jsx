import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { Button, Field } from '../../shared/components/Ui.jsx';
import { useAuth } from './AuthContext.jsx';
import { apiErrorMessage } from '../../shared/utils/apiError.js';
import { appConfig } from '../../shared/config/appConfig.js';

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.email || !form.password) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);
    try {
      await login(form);
      navigate('/', { replace: true });
    } catch (error) {
      setError(apiErrorMessage(error, 'Unable to sign in with those credentials.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <form className="login-panel" onSubmit={submit}>
        <div className="brand large">
          <div className="brand-mark">S</div>
          <div>
            <strong>{appConfig.companyName}</strong>
            <span>{appConfig.tagline}</span>
          </div>
        </div>
        <h1>Admin login</h1>
        <Field
          label="Email"
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
        />
        <Field
          label="Password"
          type="password"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
        />
        {error ? <div className="form-error">{error}</div> : null}
        <Button disabled={loading}>
          <LogIn size={18} />
          {loading ? 'Signing in' : 'Sign in'}
        </Button>
      </form>
    </main>
  );
}
