import { X } from "lucide-react";
import { Badge, formatCurrency, formatDateTime, titleCase } from "../common";


function DrawerSection({ title, items }) {
  return <section><h3>{title}</h3><dl>{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? "—"}</dd></div>)}</dl></section>;
}

export default function HistoryDrawer({ record, loading, onClose }) {
  if (!record && !loading) return null;
  return (
    <div className="drawer-layer" role="dialog" aria-modal="true" aria-label="Prediction details">
      <button className="drawer-overlay" onClick={onClose} aria-label="Close prediction details" />
      <aside className="history-drawer">
        <header><div><p className="eyebrow">Prediction details</p><h2>{record ? `P-${String(record.id).padStart(5, "0")}` : "Loading..."}</h2>{record && <span>{formatDateTime(record.created_at)}</span>}</div><button className="icon-btn" onClick={onClose} aria-label="Close"><X /></button></header>
        {loading ? <div className="drawer-loading"><span className="spinner" /> Loading record...</div> : record && <div className="drawer-content">
          <div className="drawer-result"><span>Prediction</span><Badge tone={record.prediction === "yes" ? "success" : "danger"}>{record.prediction === "yes" ? "Likely" : "Unlikely"}</Badge><strong>{(record.probability * 100).toFixed(1)}%</strong><small>{record.confidence} confidence · {record.model_name}</small></div>
          <DrawerSection title="Customer Profile" items={[["Age", record.age], ["Occupation", titleCase(record.job)], ["Marital", titleCase(record.marital)], ["Education", titleCase(record.education)]]} />
          <DrawerSection title="Financial Profile" items={[["Balance", formatCurrency(record.balance)], ["Credit Default", titleCase(record.default)], ["Housing Loan", titleCase(record.housing)], ["Personal Loan", titleCase(record.loan)]]} />
          <DrawerSection title="Current Campaign" items={[["Contact", titleCase(record.contact)], ["Month", titleCase(record.month)], ["Day", record.day], ["Contacts", record.campaign]]} />
          <DrawerSection title="Previous Campaign" items={record.previously_contacted ? [["Previously Contacted", "Yes"], ["Days Since Contact", record.pdays], ["Previous Contacts", record.previous], ["Outcome", titleCase(record.poutcome)]] : [["Previously Contacted", "No"], ["Previous Details", "Not applicable"]]} />
        </div>}
      </aside>
    </div>
  );
}
