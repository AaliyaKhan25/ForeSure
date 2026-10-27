import { clock, gw, mw } from "../utils/format.js";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function percentile(values, fraction) {
  if (!values.length) return null;
  const index = (values.length - 1) * fraction;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  return values[lower] + (values[upper] - values[lower]) * (index - lower);
}

function summarize(points) {
  const usable = points
    .filter((point) => Number.isFinite(point.forecast) && Number.isFinite(Date.parse(point.time)))
    .slice()
    .sort((a, b) => Date.parse(a.time) - Date.parse(b.time));
  if (!usable.length) return null;

  const average = usable.reduce((sum, point) => sum + point.forecast, 0) / usable.length;
  const forecastValues = usable.map((point) => point.forecast).sort((a, b) => a - b);
  const variance = forecastValues.reduce((sum, value) => sum + (value - average) ** 2, 0) / forecastValues.length;
  const energyGwh = (usable.reduce((sum, point) => sum + point.forecast, 0) * 0.5) / 1000;
  const peak = usable.reduce((best, point) => point.forecast > best.forecast ? point : best);
  const lowest = usable.reduce((best, point) => point.forecast < best.forecast ? point : best);
  const forecastChanges = usable.slice(1).reduce((changes, point, index) => {
    if (Date.parse(point.time) - Date.parse(usable[index].time) !== 30 * 60000) return changes;
    const change = point.forecast - usable[index].forecast;
    changes.push({ change, time: point.time });
    return changes;
  }, []);
  const swing = forecastChanges.reduce((largest, change) =>
    Math.abs(change.change) > Math.abs(largest.change) ? change : largest,
  { change: 0, time: usable[0].time });
  const largestRampUp = forecastChanges.reduce((largest, change) =>
    change.change > largest.change ? change : largest,
  { change: 0, time: usable[0].time });
  const largestRampDown = forecastChanges.reduce((largest, change) =>
    change.change < largest.change ? change : largest,
  { change: 0, time: usable[0].time });
  const rangeHalfWidths = usable
    .filter((point) => Number.isFinite(point.lower) && Number.isFinite(point.upper))
    .map((point) => (point.upper - point.lower) / 2);
  const averageRange = rangeHalfWidths.length
    ? rangeHalfWidths.reduce((sum, value) => sum + value, 0) / rangeHalfWidths.length
    : null;

  const actuals = usable.filter((point) => Number.isFinite(point.actual));
  const errors = actuals.map((point) => point.forecast - point.actual);
  const actualAverage = actuals.length
    ? actuals.reduce((sum, point) => sum + point.actual, 0) / actuals.length
    : null;
  const actualPeak = actuals.length
    ? actuals.reduce((best, point) => point.actual > best.actual ? point : best)
    : null;
  const peakTimingErrorMinutes = actualPeak
    ? Math.abs(Date.parse(peak.time) - Date.parse(actualPeak.time)) / 60000
    : null;
  const ramps = usable.slice(1).flatMap((point, index) => {
    const previous = usable[index];
    if (Date.parse(point.time) - Date.parse(previous.time) !== 30 * 60000) return [];
    if (!Number.isFinite(point.actual) || !Number.isFinite(previous.actual)) return [];
    const forecastDelta = point.forecast - previous.forecast;
    const actualDelta = point.actual - previous.actual;
    if (forecastDelta === 0 || actualDelta === 0) return [];
    return [{ matches: Math.sign(forecastDelta) === Math.sign(actualDelta) }];
  });
  const rampDirectionAgreement = ramps.length
    ? (ramps.filter((ramp) => ramp.matches).length / ramps.length) * 100
    : null;
  const dayparts = [
    { label: "Overnight", start: 0, end: 6 },
    { label: "Morning", start: 6, end: 12 },
    { label: "Afternoon", start: 12, end: 18 },
    { label: "Evening", start: 18, end: 24 },
  ].map((daypart) => {
    const periods = usable.filter((point) => {
      const hour = Number(clock(point.time).slice(0, 2));
      return hour >= daypart.start && hour < daypart.end;
    });
    const forecastMean = periods.length
      ? periods.reduce((sum, point) => sum + point.forecast, 0) / periods.length
      : null;
    const actualPeriods = periods.filter((point) => Number.isFinite(point.actual));
    const actualMean = actualPeriods.length
      ? actualPeriods.reduce((sum, point) => sum + point.actual, 0) / actualPeriods.length
      : null;
    return { ...daypart, forecastMean, actualMean };
  });
  const actualMae = errors.length
    ? errors.reduce((sum, error) => sum + Math.abs(error), 0) / errors.length
    : null;
  const actualRmse = errors.length
    ? Math.sqrt(errors.reduce((sum, error) => sum + error ** 2, 0) / errors.length)
    : null;
  const totalActual = actuals.reduce((sum, point) => sum + point.actual, 0);
  const actualWape = totalActual > 0
    ? (errors.reduce((sum, error) => sum + Math.abs(error), 0) / totalActual) * 100
    : null;
  const actualBias = errors.length
    ? errors.reduce((sum, error) => sum + error, 0) / errors.length
    : null;
  const inRange = actuals.filter((point) =>
    Number.isFinite(point.lower) &&
    Number.isFinite(point.upper) &&
    point.actual >= point.lower &&
    point.actual <= point.upper
  ).length;
  const bandSample = actuals.filter((point) =>
    Number.isFinite(point.lower) && Number.isFinite(point.upper)
  ).length;
  const distributionValues = [
    ...forecastValues,
    ...actuals.map((point) => point.actual).filter(Number.isFinite),
  ].sort((a, b) => a - b);
  const minOutput = distributionValues[0];
  const maxOutput = distributionValues[distributionValues.length - 1];
  const binWidth = Math.max((maxOutput - minOutput) / 6, 1);
  const distribution = Array.from({ length: 6 }, (_, index) => {
    const lower = minOutput + index * binWidth;
    const upper = index === 5 ? maxOutput : minOutput + (index + 1) * binWidth;
    const includes = (value) => Number.isFinite(value) &&
      value >= lower && (index === 5 ? value <= upper : value < upper);
    return {
      range: `${gw(lower)}–${gw(upper)} GW`,
      forecast: forecastValues.filter(includes).length,
      actual: actuals.filter((point) => includes(point.actual)).length,
    };
  });

  return {
    periods: usable.length,
    average,
    volatility: Math.sqrt(variance),
    p10: percentile(forecastValues, 0.1),
    median: percentile(forecastValues, 0.5),
    p90: percentile(forecastValues, 0.9),
    energyGwh,
    peak,
    lowest,
    swing,
    largestRampUp,
    largestRampDown,
    averageRange,
    actualMae,
    actualRmse,
    actualWape,
    actualBias,
    actualAverage,
    actualEnergyGwh: actualAverage == null ? null : (actualAverage * actuals.length * 0.5) / 1000,
    actualPeak,
    peakTimingErrorMinutes,
    rampDirectionAgreement,
    rampSampleCount: ramps.length,
    dayparts,
    bandCoverage: bandSample ? (inRange / bandSample) * 100 : null,
    actualCount: errors.length,
    bandSample,
    distribution,
  };
}

function formatDuration(minutes) {
  const rounded = Math.round(minutes);
  if (rounded < 60) return `${rounded} min`;
  const hours = Math.floor(rounded / 60);
  const remaining = rounded % 60;
  return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
}

function Metric({ label, value, detail, featured = false }) {
  return (
    <div className={`insight-metric${featured ? " is-featured" : ""}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
      <span>{detail}</span>
    </div>
  );
}

export default function ForecastInsights({ points, revealed }) {
  const stats = summarize(points);
  if (!stats) return null;

  const direction = stats.actualBias == null
    ? ""
    : stats.actualBias > 0
      ? "Forecast ran above actual generation"
      : stats.actualBias < 0
        ? "Forecast ran below actual generation"
        : "Forecast matched actual generation on average";
  const signedBias = `${stats.actualBias > 0 ? "+" : stats.actualBias < 0 ? "−" : ""}${mw(Math.abs(stats.actualBias ?? 0))} MW`;

  return (
    <section className="insights-panel" aria-labelledby="insights-title">
      <div className="insights-heading">
        <div>
          <p className="eyebrow">Buyer snapshot</p>
          <h2 id="insights-title">The numbers behind the day</h2>
        </div>
        <span className="sample-count">{stats.periods} half-hour periods</span>
      </div>

      <dl className="insight-grid">
        <Metric
          label="Average generation"
          value={`${gw(stats.average)} GW`}
          detail="Forecast mean across the day"
          featured
        />
        <Metric
          label="Expected wind energy"
          value={`${stats.energyGwh.toFixed(1)} GWh`}
          detail="Half-hour forecast summed over 24 hours"
          featured
        />
        <Metric
          label="Peak forecast"
          value={`${mw(stats.peak.forecast)} MW`}
          detail={`Expected at ${clock(stats.peak.time)}`}
        />
        <Metric
          label="Lowest forecast"
          value={`${mw(stats.lowest.forecast)} MW`}
          detail={`Expected at ${clock(stats.lowest.time)}`}
        />
        <Metric
          label="Largest half-hour swing"
          value={`${stats.swing.change > 0 ? "+" : stats.swing.change < 0 ? "−" : ""}${mw(Math.abs(stats.swing.change))} MW`}
          detail={`By ${clock(stats.swing.time)} · forecast change`}
        />
        <Metric
          label="Average uncertainty"
          value={stats.averageRange == null ? "—" : `±${mw(stats.averageRange)} MW`}
          detail="Mean half-width of the likely range"
        />
        <Metric
          label="Forecast volatility"
          value={`±${mw(stats.volatility)} MW`}
          detail="Standard deviation across the day"
        />
        <Metric
          label="P10 / median / P90"
          value={`${gw(stats.p10)} / ${gw(stats.median)} / ${gw(stats.p90)}`}
          detail="Forecast generation percentiles · GW"
        />
        <Metric
          label="Largest upward ramp"
          value={`+${mw(stats.largestRampUp.change)} MW`}
          detail={`Forecast increase by ${clock(stats.largestRampUp.time)}`}
        />
        <Metric
          label="Largest downward ramp"
          value={`−${mw(Math.abs(stats.largestRampDown.change))} MW`}
          detail={`Forecast decrease by ${clock(stats.largestRampDown.time)}`}
        />
      </dl>

      <div className="distribution-profile">
        <div className="daypart-heading">
          <div>
            <h3>How often each output range is expected</h3>
            <p>Half-hour periods grouped by average generation</p>
          </div>
          <div className="daypart-legend" aria-hidden="true">
            <span><i className="daypart-key forecast-key" /> Forecast</span>
            {revealed && stats.actualCount > 0 && <span><i className="daypart-key actual-key" /> Actual</span>}
          </div>
        </div>
        <div className="chart-box distribution-chart">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={stats.distribution} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
              <CartesianGrid stroke="var(--line)" strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="range" tick={{ fill: "var(--muted)", fontSize: 10 }} stroke="var(--line)" />
              <YAxis allowDecimals={false} width={34} tick={{ fill: "var(--muted)", fontSize: 11 }} stroke="var(--line)" />
              <Tooltip
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8 }}
                formatter={(value, name) => [`${value} half-hours`, name === "forecast" ? "Forecast" : "Actual"]}
              />
              <Bar dataKey="forecast" name="Forecast" fill="var(--green)" radius={[4, 4, 0, 0]} />
              {revealed && stats.actualCount > 0 && (
                <Bar dataKey="actual" name="Actual" fill="var(--actual)" radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="daypart-profile">
        <div className="daypart-heading">
          <div>
            <h3>How generation shifts through the day</h3>
            <p>Average output by six-hour window</p>
          </div>
          <div className="daypart-legend" aria-hidden="true">
            <span><i className="daypart-key forecast-key" /> Forecast</span>
            {revealed && stats.actualCount > 0 && <span><i className="daypart-key actual-key" /> Actual</span>}
          </div>
        </div>
        <div
          className="daypart-rows"
          role="img"
          aria-label={`Average generation by time of day: ${stats.dayparts.map((part) => `${part.label} forecast ${part.forecastMean == null ? "unavailable" : `${mw(part.forecastMean)} megawatts`}${revealed && part.actualMean != null ? `, actual ${mw(part.actualMean)} megawatts` : ""}`).join("; ")}.`}
        >
          {stats.dayparts.map((part) => (
            <div className="daypart-row" key={part.label}>
              <span className="daypart-label">{part.label}</span>
              <div className="daypart-bars" aria-hidden="true">
                <span
                  className="daypart-bar forecast-bar"
                  style={{ "--bar-size": `${part.forecastMean == null ? 0 : (part.forecastMean / stats.peak.forecast) * 100}%` }}
                />
                {revealed && part.actualMean != null && (
                  <span
                    className="daypart-bar actual-bar"
                    style={{ "--bar-size": `${(part.actualMean / stats.peak.forecast) * 100}%` }}
                  />
                )}
              </div>
              <span className="daypart-value">{part.forecastMean == null ? "—" : `${gw(part.forecastMean)} GW`}</span>
              {revealed && part.actualMean != null && (
                <span className="daypart-actual">{gw(part.actualMean)} actual</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {revealed && stats.actualCount > 0 && (
        <div className="actual-insights">
          <div className="actual-insights-heading">
            <div>
              <p className="eyebrow">Actuals revealed</p>
              <h3>How the forecast compared</h3>
            </div>
            <span className="sample-count">{stats.actualCount} half-hour actuals</span>
          </div>
          <dl className="insight-grid actual-grid">
            <Metric label="Average generation" value={`${gw(stats.actualAverage)} GW`} detail="Actual mean across available periods" />
            <Metric label="Wind energy delivered" value={`${stats.actualEnergyGwh.toFixed(1)} GWh`} detail="Estimated from half-hour actuals" />
            <Metric label="Actual peak" value={`${mw(stats.actualPeak.actual)} MW`} detail={`Observed at ${clock(stats.actualPeak.time)}`} />
            <Metric label="Typical daily miss" value={`${mw(stats.actualMae)} MW`} detail="Mean absolute forecast error" />
            <Metric label="Root mean square error" value={`${mw(stats.actualRmse)} MW`} detail="Penalizes larger misses" />
            {stats.actualWape != null && (
              <Metric
                label="Weighted absolute error (WAPE)"
                value={`${stats.actualWape.toFixed(1)}%`}
                detail="Absolute error ÷ total actual generation"
              />
            )}
            <Metric
              label="Average forecast bias"
              value={signedBias}
              detail={direction}
            />
            {stats.peakTimingErrorMinutes != null && (
              <Metric
                label="Peak timing difference"
                value={formatDuration(stats.peakTimingErrorMinutes)}
                detail="Absolute gap between forecast and actual peak"
              />
            )}
            {stats.rampDirectionAgreement != null && (
              <Metric
                label="Ramp direction agreement"
                value={`${stats.rampDirectionAgreement.toFixed(0)}%`}
                detail={`Matching up/down moves · ${stats.rampSampleCount} consecutive periods`}
              />
            )}
            {stats.bandCoverage != null && (
              <Metric
                label="Inside likely range"
                value={`${stats.bandCoverage.toFixed(0)}%`}
                detail={`Observed coverage · ${stats.bandSample} periods with a range`}
              />
            )}
          </dl>
        </div>
      )}
      <p className="insights-footnote">
        Energy is estimated from the 48 half-hour average-power forecasts. Forecast ranges and actuals are shown when provided by the source data.
      </p>
    </section>
  );
}
