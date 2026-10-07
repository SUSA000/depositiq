import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, BriefcaseBusiness, Check, CircleDollarSign, History,
  Info, LoaderCircle, PhoneCall, Sparkles, UserRound,
} from "lucide-react";
import api, { apiErrorMessage } from "../api/api";
import { ErrorState, LoadingSkeleton, PageHeader, titleCase } from "../components/common";


const defaults = {
  age: 35, job: "", marital: "", education: "", default: "no", balance: 1200,
  housing: "yes", loan: "no", contact: "", day: 15, month: "", campaign: 2,
  previously_contacted: false, pdays: 90, previous: 1, poutcome: "",
};

function SelectField({ label, name, value, onChange, options, required = true }) {
  return (
    <label className="form-field"><span>{label}</span>
      <select name={name} value={value} onChange={onChange} required={required}>
        <option value="" disabled>Select {label.toLowerCase()}</option>
        {options.map((option) => <option key={option} value={option}>{titleCase(option)}</option>)}
      </select>
    </label>
  );
}

function NumberField({ label, name, value, onChange, min, max, prefix }) {
  return (
    <label className="form-field"><span>{label}</span>
      <div className={prefix ? "number-prefix" : ""}>{prefix && <b>{prefix}</b>}<input type="number" name={name} value={value} onChange={onChange} min={min} max={max} required /></div>
    </label>
  );
}

function FormSection({ icon: Icon, title, subtitle, children }) {
  return (
    <section className="card form-section">
      <div className="form-section-heading"><span><Icon size={20} /></span><div><h2>{title}</h2><p>{subtitle}</p></div></div>
      <div className="form-grid">{children}</div>
    </section>
  );
}

export default function PredictPage() {
  const [options, setOptions] = useState(null);
  const [form, setForm] = useState(defaults);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loadOptions = useCallback(async () => {
    setError("");
    try {
      const { data } = await api.get("/api/options");
      setOptions(data);
      const c = data.categories;
      setForm((current) => ({
        ...current,
        job: c.job.includes("management") ? "management" : c.job[0],
        marital: c.marital.includes("married") ? "married" : c.marital[0],
        education: c.education.includes("secondary") ? "secondary" : c.education[0],
        contact: c.contact.includes("cellular") ? "cellular" : c.contact[0],
        month: c.month.includes("may") ? "may" : c.month[0],
        poutcome: c.poutcome.includes("unknown") ? "unknown" : c.poutcome[0],
      }));
    } catch (requestError) { setError(apiErrorMessage(requestError, "Unable to load model options.")); }
  }, []);
  useEffect(() => { loadOptions(); }, [loadOptions]);

  const update = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const review = useMemo(() => [
    { label: "Customer Profile", complete: Boolean(form.age && form.job && form.marital && form.education) },
    { label: "Financial Information", complete: form.balance !== "" && form.default && form.housing && form.loan },
    { label: "Campaign Information", complete: Boolean(form.contact && form.day && form.month && form.campaign) },
    { label: "Previous Campaign", complete: !form.previously_contacted || Boolean(form.pdays !== "" && form.previous !== "" && form.poutcome) },
  ], [form]);
  const reviewComplete = review.every((item) => item.complete);

  const submit = async (event) => {
    event.preventDefault(); setError("");
    if (!event.currentTarget.checkValidity() || !reviewComplete) {
      event.currentTarget.reportValidity(); setError("Please complete every required field before analysis."); return;
    }
    const payload = {
      ...form,
      age: Number(form.age), balance: Number(form.balance), day: Number(form.day), campaign: Number(form.campaign),
      pdays: form.previously_contacted ? Number(form.pdays) : null,
      previous: form.previously_contacted ? Number(form.previous) : null,
      poutcome: form.previously_contacted ? form.poutcome : null,
    };
    setLoading(true);
    try {
      const { data } = await api.post("/api/predict", payload);
      const resultState = { result: data, customer: payload };
      sessionStorage.setItem("tdi_last_result", JSON.stringify(resultState));
      navigate("/predict/result", { state: resultState });
    } catch (requestError) { setError(apiErrorMessage(requestError, "Unable to analyze this customer.")); }
    finally { setLoading(false); }
  };

  if (error && !options) return <ErrorState message={error} onRetry={loadOptions} />;
  if (!options) return <LoadingSkeleton cards={5} label="Loading prediction form" />;
  const c = options.categories;
  const ranges = options.numeric_ranges;

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Model inference" title="Customer Prediction" subtitle="Enter customer and campaign information to estimate term-deposit subscription likelihood." />
      {error && <div className="form-alert error"><AlertTriangle size={17} /> {error}</div>}
      <form className="prediction-layout" onSubmit={submit}>
        <div className="prediction-form-stack">
          <FormSection icon={UserRound} title="Customer Profile" subtitle="Basic demographic information">
            <NumberField label="Age" name="age" value={form.age} onChange={update} {...ranges.age} />
            <SelectField label="Occupation" name="job" value={form.job} onChange={update} options={c.job} />
            <SelectField label="Marital Status" name="marital" value={form.marital} onChange={update} options={c.marital} />
            <SelectField label="Education" name="education" value={form.education} onChange={update} options={c.education} />
          </FormSection>

          <FormSection icon={CircleDollarSign} title="Financial Profile" subtitle="Credit and loan standing">
            <NumberField label="Average yearly balance" name="balance" value={form.balance} onChange={update} prefix="€" {...ranges.balance} />
            <SelectField label="Credit in default?" name="default" value={form.default} onChange={update} options={["no", "yes"]} />
            <SelectField label="Housing loan?" name="housing" value={form.housing} onChange={update} options={["no", "yes"]} />
            <SelectField label="Personal loan?" name="loan" value={form.loan} onChange={update} options={["no", "yes"]} />
          </FormSection>

          <FormSection icon={PhoneCall} title="Current Campaign" subtitle="Information available before this outreach call">
            <SelectField label="Contact Type" name="contact" value={form.contact} onChange={update} options={c.contact} />
            <SelectField label="Contact Month" name="month" value={form.month} onChange={update} options={c.month} />
            <NumberField label="Day of Month" name="day" value={form.day} onChange={update} {...ranges.day} />
            <NumberField label="Campaign Contacts" name="campaign" value={form.campaign} onChange={update} {...ranges.campaign} />
            <div className="data-note"><Info size={17} /><p><strong>Why no call duration?</strong> Call duration is intentionally excluded because it is unknown before the call and can cause target leakage.</p></div>
          </FormSection>

          <FormSection icon={History} title="Previous Campaign" subtitle="Prior marketing contact and outcome">
            <label className="toggle-field"><input type="checkbox" name="previously_contacted" checked={form.previously_contacted} onChange={update} /><span className="toggle-track"><span /></span><div><strong>Previously contacted?</strong><small>{form.previously_contacted ? "Yes — include previous campaign details" : "No — this is the first known contact"}</small></div></label>
            {form.previously_contacted && <div className="conditional-fields">
              <NumberField label="Days Since Previous Contact" name="pdays" value={form.pdays} onChange={update} {...ranges.pdays} />
              <NumberField label="Previous Contacts" name="previous" value={form.previous} onChange={update} {...ranges.previous} />
              <SelectField label="Previous Outcome" name="poutcome" value={form.poutcome} onChange={update} options={c.poutcome} />
            </div>}
          </FormSection>
        </div>

        <aside className="card review-card">
          <div className="review-icon"><BriefcaseBusiness /></div><p className="eyebrow">Final check</p><h2>Customer Review</h2><p>All required sections must be complete before the model can run.</p>
          <ul>{review.map((item) => <li key={item.label} className={item.complete ? "complete" : ""}><span>{item.label}</span><i>{item.complete ? <Check size={15} /> : "!"}</i></li>)}</ul>
          <button className="btn btn-accent btn-block" disabled={loading || !reviewComplete}>
            {loading ? <><LoaderCircle className="spin" size={18} /> Analyzing customer...</> : <><Sparkles size={18} /> Analyze Customer</>}
          </button>
          <small className="decision-note">Prediction is decision support only and should be used alongside human judgement.</small>
        </aside>
      </form>
    </div>
  );
}
