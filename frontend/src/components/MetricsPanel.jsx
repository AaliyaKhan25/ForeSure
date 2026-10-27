import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { mw, signed } from "../utils/format.js";

export default function MetricsPanel({ metrics }) {
  const biasText =
    metrics.bias > 0
      ? "The forecast tends to run too high."
      : metrics.bias < 0
      ? "The forecast tends to run too low."
      : "No consistent lean either way.";

  return (
    <section className="panel" aria-labelledby="metrics-title">
      <h2 id="metrics-title">How accurate was it in January?</h2>
      <dl className="metrics">
        <div>
          <dt>Typical miss (MAE)</dt>
          <dd>{mw(metrics.mae)} MW</dd>
        </div>
        <div>
          <dt>Big-miss measure (RMSE)</dt>
          <dd>{mw(metrics.rmse)} MW</dd>
        </div>
        <div>
          <dt>Average lean (bias)</dt>
          <dd>{signed(metrics.bias)} MW</dd>
        </div>
      </dl>
      <p className="muted">
        {biasText} Based on {metrics.n.toLocaleString("en-GB")} half-hours. A positive bias
        means forecast above actual.
      </p>

      <h3>Typical miss by hour of day</h3>
      <div className="chart-box">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={metrics.by_hour} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <XAxis dataKey="hour" tick={{ fill: "var(--muted)", fontSize: 11 }} stroke="var(--line)" interval={2} />
            <YAxis width={40} tick={{ fill: "var(--muted)", fontSize: 11 }} stroke="var(--line)" />
            <Tooltip
              cursor={{ fill: "rgba(126,214,228,0.08)" }}
              contentStyle={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 6 }}
              labelFormatter={(h) => `${String(h).padStart(2, "0")}:00`}
              formatter={(v) => [`${mw(v)} MW`, "Typical miss"]}
            />
            <Bar dataKey="mae" fill="var(--forecast)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}