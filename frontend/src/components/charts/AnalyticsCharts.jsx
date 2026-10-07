import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { titleCase } from "../common";


export const CHART_COLORS = ["#26d1bf", "#69bde7", "#46d39a", "#ef8f87", "#839aab", "#e9bf68"];

const tooltipStyle = {
  background: "var(--surface-glass-strong)", border: "1px solid var(--border-strong)",
  borderRadius: 14, color: "var(--text-primary)", boxShadow: "var(--shadow)",
  backdropFilter: "blur(18px)",
};

const axisProps = { axisLine: false, tickLine: false, tick: { fill: "var(--text-muted)", fontSize: 11 } };

export function DonutChart({ data, valueKey = "value" }) {
  const total = data.reduce((sum, item) => sum + Number(item[valueKey] || 0), 0);
  return (
    <div className="donut-wrap">
      <ResponsiveContainer width="100%" height={270}>
        <PieChart>
          <Pie data={data} dataKey={valueKey} nameKey="name" innerRadius={70} outerRadius={96} paddingAngle={3} stroke="transparent">
            {data.map((entry, index) => <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
      <div className="donut-center"><strong>{total.toLocaleString()}</strong><span>Total</span></div>
    </div>
  );
}

export function RateBarChart({ data, horizontal = false, dataKey = "rate", color = "#26d1bf", label = "Subscription rate" }) {
  return (
    <ResponsiveContainer width="100%" height={horizontal ? Math.max(300, data.length * 35) : 290}>
      <BarChart data={data} layout={horizontal ? "vertical" : "horizontal"} margin={{ top: 8, right: 15, left: horizontal ? 22 : 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 6" stroke="var(--chart-grid)" vertical={!horizontal} horizontal />
        {horizontal ? (
          <><XAxis type="number" tickFormatter={(value) => `${value}%`} {...axisProps} /><YAxis type="category" dataKey="name" width={105} tickFormatter={titleCase} {...axisProps} /></>
        ) : (
          <><XAxis dataKey="name" tickFormatter={titleCase} {...axisProps} /><YAxis tickFormatter={(value) => `${value}%`} {...axisProps} /></>
        )}
        <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${Number(value).toFixed(2)}%`, label]} labelFormatter={titleCase} />
        <Bar dataKey={dataKey} fill={color} radius={horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RateLineChart({ data, dataKey = "rate", xKey = "name", label = "Subscription rate", color = "#1aa58f" }) {
  return (
    <ResponsiveContainer width="100%" height={290}>
      <LineChart data={data} margin={{ top: 8, right: 15, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 6" stroke="var(--chart-grid)" vertical={false} />
        <XAxis dataKey={xKey} tickFormatter={titleCase} {...axisProps} />
        <YAxis tickFormatter={(value) => `${value}%`} {...axisProps} />
        <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${Number(value).toFixed(2)}%`, label]} labelFormatter={titleCase} />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} dot={{ r: 4, fill: color }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function TrendChart({ data, probability = false }) {
  const dataKey = probability ? "average_probability" : "predictions";
  const color = probability ? "#69bde7" : "#26d1bf";
  const gradientId = probability ? "probabilityTrendFill" : "predictionTrendFill";
  return (
    <ResponsiveContainer width="100%" height={290}>
      <AreaChart data={data} margin={{ top: 8, right: 15, left: 0, bottom: 4 }}>
        <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.28} /><stop offset="100%" stopColor={color} stopOpacity={0} /></linearGradient></defs>
        <CartesianGrid strokeDasharray="3 6" stroke="var(--chart-grid)" vertical={false} />
        <XAxis dataKey="date" tickFormatter={(value) => new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })} {...axisProps} />
        <YAxis tickFormatter={probability ? (value) => `${value}%` : undefined} {...axisProps} />
        <Tooltip contentStyle={tooltipStyle} formatter={(value) => [probability ? `${value}%` : value, probability ? "Average probability" : "Predictions"]} />
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} fill={`url(#${gradientId})`} dot={false} activeDot={{ r: 5, fill: color, stroke: "var(--bg-app)", strokeWidth: 3 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function FeatureImportanceChart({ data }) {
  const formatted = data.map((item) => ({ ...item, name: titleCase(item.feature), percent: item.importance * 100 }));
  return <RateBarChart data={formatted} horizontal dataKey="percent" label="Global importance" color="#46d39a" />;
}
