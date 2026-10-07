export default function BrandLogo({ variant = "default", compact = false }) {
  return (
    <div className={`brand-identity brand-identity-${variant} ${compact ? "is-compact" : ""}`} aria-label="DepositIQ">
      <span className="brand-logo-mark" aria-hidden="true">
        <svg viewBox="0 0 48 48" role="img">
          <path d="M13 10h9.5C31.4 10 37 15.3 37 24s-5.6 14-14.5 14H13V10Zm9.3 7H20v14h2.3c4.9 0 7.7-2.4 7.7-7s-2.8-7-7.7-7Z" />
          <path className="brand-logo-signal" d="M22 27.7 26 23l3.4 2.4L35 18" />
          <circle className="brand-logo-dot" cx="35" cy="18" r="2.2" />
        </svg>
      </span>
      <span className="brand-logo-copy">
        <strong>Deposit<span>IQ</span></strong>
        {!compact && <small>Bank Marketing Intelligence</small>}
      </span>
    </div>
  );
}
