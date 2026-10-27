import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { clock, gw, mw } from "../utils/format.js";

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="tip">
      <div className="tip-time">{label}</div>
      <div>Forecast: {mw(row.forecast)} MW</div>
      <div className="muted">
        Likely range: {mw(row.band[0])} to {mw(row.band[1])} MW
      </div>
      {row.actual != null && <div className="tip-actual">Actual: {mw(row.actual)} MW</div>}
    </div>
  );
}

export default function ForecastChart({ points, revealed }) {
  const data = points.map((p) => ({
    t: clock(p.time),
    forecast: p.forecast,
    actual: revealed ? p.actual : null,
    band: [p.lower, p.upper],
  }));

  return (
    <section className="panel" aria-labelledby="chart-title">
      <div className="panel-head">
        <h2 id="chart-title">Forecast for each half-hour</h2>
        <ul className="legend">
          <li>
            <span className="swatch swatch-forecast" /> Forecast at cutoff
          </li>
          <li>
            <span className="swatch swatch-band" /> Likely range
          </li>
          <li className={revealed ? "" : "legend-off"}>
            <span className="swatch swatch-actual" /> Actual
          </li>
        </ul>
      </div>
      <div className="chart-box">
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--line)" strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="t" interval={5} tick={{ fill: "var(--muted)", fontSize: 12 }} stroke="var(--line)" />
            <YAxis
              tickFormatter={gw}
              width={42}
              tick={{ fill: "var(--muted)", fontSize: 12 }}
              stroke="var(--line)"
              label={{ value: "GW", position: "insideTopLeft", offset: -4, fill: "var(--muted)", fontSize: 12 }}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area dataKey="band" stroke="none" fill="var(--forecast)" fillOpacity={0.16} isAnimationActive={false} />
            <Line dataKey="forecast" stroke="var(--forecast)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
            <Line
              dataKey="actual"
              stroke="var(--actual)"
              strokeWidth={2}
              strokeDasharray="5 3"
              dot={false}
              connectNulls={false}
              isAnimationActive={revealed}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}