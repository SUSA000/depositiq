import { useCallback, useEffect, useState } from "react";
import {
  ArrowDownAZ, CheckCircle2, ChevronLeft, ChevronRight, Database,
  Download, Eye, Filter, Percent, Search, UserX,
} from "lucide-react";
import api, { apiErrorMessage } from "../api/api";
import HistoryDrawer from "../components/history/HistoryDrawer";
import {
  Badge, EmptyState, ErrorState, LoadingSkeleton, PageHeader, StatCard,
  formatCurrency, formatDateTime, formatPercent, titleCase,
} from "../components/common";


const emptyFilters = { from_date: "", to_date: "", prediction: "", confidence: "", occupation: "", search: "" };

export default function HistoryPage() {
  const [data, setData] = useState(null);
  const [options, setOptions] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [applied, setApplied] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ sort_by: "created_at", sort_order: "desc" });
  const [error, setError] = useState("");
  const [drawer, setDrawer] = useState({ record: null, loading: false });

  const load = useCallback(async () => {
    setError("");
    try {
      const params = { ...Object.fromEntries(Object.entries(applied).filter(([, value]) => value)), page, page_size: 10, ...sort };
      const response = await api.get("/api/history", { params });
      setData(response.data);
    } catch (requestError) { setError(apiErrorMessage(requestError, "Unable to load prediction history.")); }
  }, [applied, page, sort]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get("/api/options").then(({ data: response }) => setOptions(response.categories.job)).catch(() => {}); }, []);

  const applyFilters = (event) => { event.preventDefault(); setPage(1); setApplied(filters); };
  const clearFilters = () => { setFilters(emptyFilters); setApplied(emptyFilters); setPage(1); };
  const update = (event) => setFilters({ ...filters, [event.target.name]: event.target.value });
  const toggleSort = (field) => {
    setPage(1);
    setSort((current) => ({ sort_by: field, sort_order: current.sort_by === field && current.sort_order === "desc" ? "asc" : "desc" }));
  };

  const viewRecord = async (id) => {
    setDrawer({ record: null, loading: true });
    try { setDrawer({ record: (await api.get(`/api/history/${id}`)).data, loading: false }); }
    catch (requestError) { setDrawer({ record: null, loading: false }); setError(apiErrorMessage(requestError, "Unable to load prediction details.")); }
  };

  const exportCsv = async () => {
    try {
      const params = Object.fromEntries(Object.entries(applied).filter(([, value]) => value));
      const response = await api.get("/api/history/export", { params, responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = "prediction-history.csv"; anchor.click();
      URL.revokeObjectURL(url);
    } catch (requestError) { setError(apiErrorMessage(requestError, "Unable to export history.")); }
  };

  if (error && !data) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <LoadingSkeleton cards={6} label="Loading prediction history" />;

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Saved decisions" title="Prediction History" subtitle="Review previously analyzed customers and prediction outcomes."
        actions={<button className="btn btn-secondary" onClick={exportCsv}><Download size={17} /> Export CSV</button>} />
      {error && <div className="form-alert error">{error}</div>}

      <form className="card history-filters" onSubmit={applyFilters}>
        <div className="filter-title"><Filter size={18} /><div><strong>Filter history</strong><span>Summary cards and table use the same filters.</span></div></div>
        <label>From Date<input type="date" name="from_date" value={filters.from_date} onChange={update} /></label>
        <label>To Date<input type="date" name="to_date" value={filters.to_date} onChange={update} /></label>
        <label>Prediction<select name="prediction" value={filters.prediction} onChange={update}><option value="">All results</option><option value="yes">Likely</option><option value="no">Unlikely</option></select></label>
        <label>Confidence<select name="confidence" value={filters.confidence} onChange={update}><option value="">All confidence</option><option>High</option><option>Medium</option><option>Low</option></select></label>
        <label>Occupation<select name="occupation" value={filters.occupation} onChange={update}><option value="">All occupations</option>{options.map((item) => <option value={item} key={item}>{titleCase(item)}</option>)}</select></label>
        <label className="search-field">Search<div><Search size={16} /><input name="search" value={filters.search} onChange={update} placeholder="ID, job, education..." /></div></label>
        <div className="filter-actions"><button className="btn btn-primary">Apply</button><button type="button" className="btn btn-ghost" onClick={clearFilters}>Clear</button></div>
      </form>

      <section className="stats-grid">
        <StatCard label="Total Predictions" value={data.summary.total_predictions.toLocaleString()} icon={Database} />
        <StatCard label="Likely to Subscribe" value={data.summary.likely.toLocaleString()} icon={CheckCircle2} tone="success" />
        <StatCard label="Unlikely to Subscribe" value={data.summary.unlikely.toLocaleString()} icon={UserX} tone="danger" />
        <StatCard label="Average Probability" value={formatPercent(data.summary.average_probability)} icon={Percent} tone="gold" />
      </section>

      <section className="card history-card">
        <div className="card-heading"><h2>Customer Predictions</h2><p>{data.total.toLocaleString()} matching record{data.total === 1 ? "" : "s"}</p></div>
        {!data.items.length ? <EmptyState title="No predictions found" message="Try adjusting your filters or create a new customer prediction." /> : <>
          <div className="table-wrap"><table><thead><tr>
            <th><button onClick={() => toggleSort("id")}>Prediction ID <ArrowDownAZ /></button></th>
            <th><button onClick={() => toggleSort("created_at")}>Date & Time <ArrowDownAZ /></button></th>
            <th>Customer / Record</th><th><button onClick={() => toggleSort("age")}>Age <ArrowDownAZ /></button></th>
            <th><button onClick={() => toggleSort("job")}>Occupation <ArrowDownAZ /></button></th>
            <th><button onClick={() => toggleSort("balance")}>Balance <ArrowDownAZ /></button></th>
            <th>Prediction</th><th><button onClick={() => toggleSort("probability")}>Probability <ArrowDownAZ /></button></th>
            <th>Confidence</th><th>Action</th>
          </tr></thead><tbody>{data.items.map((item) => <tr key={item.id}>
            <td><strong>P-{String(item.id).padStart(5, "0")}</strong></td><td>{formatDateTime(item.created_at)}</td><td>Customer #{item.id}</td><td>{item.age}</td><td>{titleCase(item.job)}</td><td>{formatCurrency(item.balance)}</td>
            <td><Badge tone={item.prediction === "yes" ? "success" : "danger"}>{item.prediction === "yes" ? "Likely" : "Unlikely"}</Badge></td><td>{(item.probability * 100).toFixed(1)}%</td><td><Badge tone={item.confidence.toLowerCase()}>{item.confidence}</Badge></td>
            <td><button className="table-action" onClick={() => viewRecord(item.id)}><Eye size={16} /> View</button></td>
          </tr>)}</tbody></table></div>
          <div className="pagination"><span>Page {data.page} of {data.total_pages}</span><div><button className="icon-btn" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} aria-label="Previous page"><ChevronLeft /></button><button className="icon-btn" disabled={page >= data.total_pages} onClick={() => setPage((current) => current + 1)} aria-label="Next page"><ChevronRight /></button></div></div>
        </>}
      </section>
      <HistoryDrawer record={drawer.record} loading={drawer.loading} onClose={() => setDrawer({ record: null, loading: false })} />
    </div>
  );
}
