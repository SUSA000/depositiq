import { AlertCircle, Inbox, RefreshCw } from "lucide-react";

export function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function StatCard({ label, value, helper, icon: Icon, tone = "navy" }) {
  return (
    <article className={`stat-card tone-${tone}`}>
      <div className="stat-icon"><Icon size={20} aria-hidden="true" /></div>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
        {helper && <small>{helper}</small>}
      </div>
    </article>
  );
}

export function Badge({ children, tone = "neutral" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function ChartCard({ title, description, children, className = "" }) {
  return (
    <article className={`card chart-card ${className}`}>
      <div className="card-heading">
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>
      <div className="chart-body">{children}</div>
    </article>
  );
}

export function LoadingSkeleton({ cards = 4, label = "Loading data..." }) {
  return (
    <div aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      <div className="skeleton-grid">
        {Array.from({ length: cards }, (_, index) => <div className="skeleton" key={index} />)}
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="state-card error-state" role="alert">
      <AlertCircle size={28} />
      <h3>Unable to load this section</h3>
      <p>{message}</p>
      {onRetry && <button className="btn btn-secondary" onClick={onRetry}><RefreshCw size={16} /> Retry</button>}
    </div>
  );
}

export function EmptyState({ title = "No data available", message, action }) {
  return (
    <div className="state-card">
      <Inbox size={30} />
      <h3>{title}</h3>
      <p>{message}</p>
      {action}
    </div>
  );
}

export const formatPercent = (value, digits = 1) => `${(Number(value || 0) * 100).toFixed(digits)}%`;
export const formatRate = (value, digits = 1) => `${Number(value || 0).toFixed(digits)}%`;
export const formatCurrency = (value) => new Intl.NumberFormat("en-IE", {
  style: "currency", currency: "EUR", maximumFractionDigits: 0,
}).format(Number(value || 0));
export const titleCase = (value = "") => value.replace(/[-_.]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
export const formatDateTime = (value) => value ? new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium", timeStyle: "short",
}).format(new Date(value)) : "—";
