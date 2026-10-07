import { ArrowLeft, BarChart3, CheckCircle2, Clock3, History, RotateCcw, ShieldCheck } from "lucide-react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Badge, PageHeader, formatCurrency, formatDateTime, titleCase } from "../components/common";
import PredictionGauge from "../components/prediction/PredictionGauge";


function DetailList({ title, items }) {
  return (
    <section className="summary-group"><h3>{title}</h3><dl>
      {items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? "—"}</dd></div>)}
    </dl></section>
  );
}

export default function PredictionResultPage() {
  const location = useLocation();
  let stored = null;
  try { stored = JSON.parse(sessionStorage.getItem("tdi_last_result")); } catch { /* ignored */ }
  const state = location.state || stored;
  if (!state?.result || !state?.customer) return <Navigate to="/predict" replace />;
  const { result, customer } = state;
  const likely = result.prediction === "yes";
  const recommendation = result.probability >= 0.7
    ? { title: "High Outreach Priority", text: "This customer shows a relatively high estimated probability of subscribing. Consider prioritizing this profile for marketing outreach." }
    : result.probability >= 0.4
      ? { title: "Standard Outreach Priority", text: "This customer shows a moderate estimated likelihood. Consider normal outreach with appropriate campaign context." }
      : { title: "Lower Outreach Priority", text: "This customer shows a lower estimated likelihood. Consider prioritizing stronger opportunities first." };

  return (
    <div className="page-stack">
      <PageHeader eyebrow={`Prediction P-${String(result.history_id).padStart(5, "0")}`} title="Prediction Result" subtitle="Model output, customer review and decision-support guidance."
        actions={<Link className="btn btn-secondary" to="/predict"><RotateCcw size={17} /> New Prediction</Link>} />

      <section className={`card result-hero ${likely ? "positive" : "negative"}`}>
        <PredictionGauge probability={result.probability} prediction={result.prediction} />
        <div className="result-hero-copy">
          <Badge tone={likely ? "success" : "danger"}>{likely ? "Likely to Subscribe" : "Unlikely to Subscribe"}</Badge>
          <h2>{result.confidence} confidence prediction</h2><p>{result.message}</p>
          <div className="result-meta"><span><BarChart3 /> {result.model_name}</span><span><Clock3 /> {formatDateTime(result.created_at)}</span><span><ShieldCheck /> Saved to history</span></div>
        </div>
      </section>

      <section className="result-grid">
        <article className="card customer-summary-card">
          <div className="card-heading"><h2>Customer Summary</h2><p>All values used to generate this prediction.</p></div>
          <div className="summary-columns">
            <DetailList title="Customer Profile" items={[["Age", customer.age], ["Occupation", titleCase(customer.job)], ["Marital Status", titleCase(customer.marital)], ["Education", titleCase(customer.education)]]} />
            <DetailList title="Financial Profile" items={[["Balance", formatCurrency(customer.balance)], ["Credit Default", titleCase(customer.default)], ["Housing Loan", titleCase(customer.housing)], ["Personal Loan", titleCase(customer.loan)]]} />
            <DetailList title="Campaign Information" items={[["Contact", titleCase(customer.contact)], ["Month", titleCase(customer.month)], ["Day", customer.day], ["Campaign Contacts", customer.campaign]]} />
            <DetailList title="Previous Campaign" items={customer.previously_contacted ? [["Previously Contacted", "Yes"], ["Days Since Contact", customer.pdays], ["Previous Contacts", customer.previous], ["Outcome", titleCase(customer.poutcome)]] : [["Previously Contacted", "No"], ["Prior Details", "Not applicable"]]} />
          </div>
        </article>

        <article className="card result-details-card">
          <div className="card-heading"><h2>Model Result Details</h2></div>
          <dl><div><dt>Prediction</dt><dd><Badge tone={likely ? "success" : "danger"}>{likely ? "Likely" : "Unlikely"}</Badge></dd></div><div><dt>Probability</dt><dd>{(result.probability * 100).toFixed(1)}%</dd></div><div><dt>Confidence</dt><dd><Badge tone={result.confidence.toLowerCase()}>{result.confidence}</Badge></dd></div><div><dt>Model</dt><dd>{result.model_name}</dd></div><div><dt>Prediction Time</dt><dd>{formatDateTime(result.created_at)}</dd></div></dl>
          <Link className="text-link" to="/history"><History size={16} /> View prediction history</Link>
        </article>
      </section>

      <section className="card factors-card">
        <div className="card-heading"><h2>Global Model Factors</h2><p>These factors describe what generally influences the Random Forest model and are not specific to this customer.</p></div>
        <div className="factor-list">{result.top_factors.map((factor) => <div className="factor-row" key={factor.feature}><span>{titleCase(factor.feature)}</span><div><i style={{ width: `${factor.importance / result.top_factors[0].importance * 100}%` }} /></div><strong>{(factor.importance * 100).toFixed(1)}%</strong></div>)}</div>
      </section>

      <section className={`recommendation-card ${likely ? "positive" : "neutral"}`}>
        <span><CheckCircle2 /></span><div><p className="eyebrow">Recommended action</p><h2>{recommendation.title}</h2><p>{recommendation.text}</p><small>Decision support only. This result must not be treated as automatic approval or rejection of a financial product.</small></div>
      </section>
      <Link className="back-link" to="/predict"><ArrowLeft size={17} /> Return to prediction form</Link>
    </div>
  );
}
