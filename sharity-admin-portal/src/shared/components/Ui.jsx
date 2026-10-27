import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

export function Button({ children, variant = 'primary', className = '', ...props }) {
  return (
    <button className={`btn btn-${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Card({ children, className = '' }) {
  return <section className={`card ${className}`}>{children}</section>;
}

export function Field({ label, error, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input {...props} />
      {error ? <small className="field-error">{error}</small> : null}
    </label>
  );
}

export function StatusBadge({ value }) {
  const normalized = String(value || 'unknown').toLowerCase();
  return <span className={`badge badge-${normalized}`}>{value || 'Unknown'}</span>;
}

export function LoadingState({ label = 'Loading' }) {
  return (
    <div className="state">
      <Loader2 className="spin" size={22} />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ title, text }) {
  return (
    <div className="state empty">
      <AlertTriangle size={24} />
      <strong>{title}</strong>
      {text ? <span>{text}</span> : null}
    </div>
  );
}

export function Alert({ type = 'success', children }) {
  return (
    <div className={`alert alert-${type}`}>
      <CheckCircle2 size={18} />
      {children}
    </div>
  );
}
