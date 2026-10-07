import { useCallback, useEffect, useState } from "react";
import { BarChart3, CheckCircle2, Database, Filter, Percent, UserX, Users, WalletCards } from "lucide-react";
import api, { apiErrorMessage } from "../api/api";
import {
  DonutChart, FeatureImportanceChart, RateBarChart, RateLineChart, TrendChart,
} from "../components/charts/AnalyticsCharts";
import {
  ChartCard, EmptyState, ErrorState, LoadingSkeleton, PageHeader, StatCard,
  formatCurrency, formatPercent, formatRate, titleCase,
} from "../components/common";


const initialFilters = { job: "", month: "", contact: "", education: "", age_min: "", age_max: "" };

function DatasetInsights() {
  const [filters, setFilters] = useState(initialFilters);
  const [applied, setApplied] = useState(initialFilters);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const params = Object.fromEntries(Object.entries(applied).filter(([, value]) => value !== ""));
      const response = await api.get("/api/insights/dataset", { params });
      setData(response.data);
    } catch (requestError) { setError(apiErrorMessage(requestError, "Unable to load dataset analytics.")); }
  }, [applied]);
  useEffect(() => { load(); }, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <LoadingSkeleton cards={8} label="Loading dataset insights" />;
  const summary = data.summary;

  const updateFilter = (event) => setFilters({ ...filters, [event.target.name]: event.target.value });
  const applyFilters = (event) => { event.preventDefault(); setApplied(filters); };
  const clearFilters = () => { setFilters(initialFilters); setApplied(initialFilters); };

  return (
    <div className="insights-content">
      <form className="card filters-card" onSubmit={applyFilters}>
        <div className="filter-title"><Filter size={18} /><div><strong>Dataset filters</strong><span>All charts update from the same filtered rows.</span></div></div>
        <label>Occupation<select name="job" value={filters.job} onChange={updateFilter}><option value="">All occupations</option>{data.filters.jobs.map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}</select></label>
        <label>Education<select name="education" value={filters.education} onChange={updateFilter}><option value="">All education</option>{data.filters.education.map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}</select></label>
        <label>Month<select name="month" value={filters.month} onChange={updateFilter}><option value="">All months</option>{data.filters.months.map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}</select></label>
        <label>Contact type<select name="contact" value={filters.contact} onChange={updateFilter}><option value="">All contacts</option>{data.filters.contacts.map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}</select></label>
        <label>Minimum age<input type="number" name="age_min" min={data.filters.age.min} max={data.filters.age.max} value={filters.age_min} onChange={updateFilter} /></label>
        <label>Maximum age<input type="number" name="age_max" min={data.filters.age.min} max={data.filters.age.max} value={filters.age_max} onChange={updateFilter} /></label>
        <div className="filter-actions"><button className="btn btn-primary">Apply</button><button type="button" className="btn btn-ghost" onClick={clearFilters}>Clear</button></div>
      </form>

      <section className="stats-grid">
        <StatCard label="Total Customers" value={summary.total_customers.toLocaleString()} icon={Users} />
        <StatCard label="Subscribers" value={summary.subscribers.toLocaleString()} icon={CheckCircle2} tone="success" />
        <StatCard label="Subscription Rate" value={formatRate(summary.subscription_rate)} icon={Percent} tone="gold" />
        <StatCard label="Average Balance" value={formatCurrency(summary.average_balance)} icon={WalletCards} />
      </section>

      {summary.total_customers === 0 ? <EmptyState title="No matching customers" message="Adjust the filters to include more dataset records." /> : (
        <section className="charts-grid">
          <ChartCard title="Subscription Distribution" description="Historical subscribed and non-subscribed customers."><DonutChart data={data.subscription_distribution} /></ChartCard>
          <ChartCard title="Subscription Rate by Occupation" description="Subscribed customers as a percentage of each occupation." className="chart-wide"><RateBarChart data={data.by_job} horizontal /></ChartCard>
          <ChartCard title="Subscription Rate by Age Group"><RateBarChart data={data.by_age} color="#46d39a" /></ChartCard>
          <ChartCard title="Subscription Rate by Balance Range"><RateBarChart data={data.by_balance} color="#26d1bf" /></ChartCard>
          <ChartCard title="Monthly Subscription Rate" description="Historical performance in calendar order." className="chart-wide"><RateLineChart data={data.by_month} /></ChartCard>
          <ChartCard title="Campaign Contact Effect"><RateBarChart data={data.by_campaign} color="#839aab" /></ChartCard>
          <ChartCard title="Previous Campaign Outcome" description="A key historical signal in the fitted model."><RateBarChart data={data.by_previous_outcome} color="#46d39a" /></ChartCard>
          <ChartCard title="Contact Type Performance"><RateBarChart data={data.by_contact} color="#69bde7" /></ChartCard>
          <ChartCard title="Global Model Feature Importance" description="General Random Forest importance—not a customer-specific explanation." className="chart-wide"><FeatureImportanceChart data={data.feature_importance} /></ChartCard>
        </section>
      )}
    </div>
  );
}

function PredictionAnalytics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setError("");
    try { setData((await api.get("/api/analytics/predictions")).data); }
    catch (requestError) { setError(apiErrorMessage(requestError, "Unable to load prediction analytics.")); }
  }, []);
  useEffect(() => { load(); }, [load]);
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <LoadingSkeleton cards={6} label="Loading prediction analytics" />;
  if (!data.summary.total_predictions) return <EmptyState title="No predictions available yet" message="Create your first customer prediction to start building prediction analytics." action={<a className="btn btn-primary" href="/predict">Create Prediction</a>} />;

  return (
    <div className="insights-content">
      <section className="stats-grid">
        <StatCard label="Predictions" value={data.summary.total_predictions.toLocaleString()} icon={Database} />
        <StatCard label="Likely to Subscribe" value={data.summary.likely.toLocaleString()} icon={CheckCircle2} tone="success" />
        <StatCard label="Unlikely to Subscribe" value={data.summary.unlikely.toLocaleString()} icon={UserX} tone="danger" />
        <StatCard label="Average Probability" value={formatPercent(data.summary.average_probability)} icon={Percent} tone="gold" />
      </section>
      <section className="charts-grid">
        <ChartCard title="Prediction Trend by Date" className="chart-wide"><TrendChart data={data.trend} /></ChartCard>
        <ChartCard title="Likely vs Unlikely"><DonutChart data={data.outcomes} /></ChartCard>
        <ChartCard title="Average Probability Over Time"><TrendChart data={data.trend} probability /></ChartCard>
        <ChartCard title="Prediction by Occupation" description="Share predicted likely within each occupation." className="chart-wide"><RateBarChart data={data.by_job} dataKey="likely_rate" label="Likely rate" horizontal /></ChartCard>
        <ChartCard title="Prediction by Age Group"><RateBarChart data={data.by_age} dataKey="likely_rate" label="Likely rate" color="#46d39a" /></ChartCard>
        <ChartCard title="Confidence Distribution"><DonutChart data={data.confidence} /></ChartCard>
      </section>
    </div>
  );
}

export default function InsightsPage() {
  const [tab, setTab] = useState("dataset");
  return (
    <div className="page-stack">
      <PageHeader eyebrow="Analytics" title="Data Insights" subtitle="Explore customer behaviour, marketing patterns and term-deposit subscription trends." />
      <div className="tab-list" role="tablist" aria-label="Insights type">
        <button className={tab === "dataset" ? "active" : ""} onClick={() => setTab("dataset")} role="tab" aria-selected={tab === "dataset"}><Database size={17} /> Dataset Insights</button>
        <button className={tab === "predictions" ? "active" : ""} onClick={() => setTab("predictions")} role="tab" aria-selected={tab === "predictions"}><BarChart3 size={17} /> Prediction Analytics</button>
      </div>
      {tab === "dataset" ? <DatasetInsights /> : <PredictionAnalytics />}
    </div>
  );
}
