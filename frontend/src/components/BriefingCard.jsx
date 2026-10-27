import { gw, mw, clock, longDate } from "../utils/format.js";

const CONFIDENCE = {
  high: { label: "High confidence", mark: "●", cls: "conf-high" },
  medium: { label: "Medium confidence", mark: "◐", cls: "conf-medium" },
  low: { label: "Low confidence", mark: "○", cls: "conf-low" },
};

export default function BriefingCard({ briefing }) {
  const conf = CONFIDENCE[briefing.confidence] ?? CONFIDENCE.medium;

  return (
    <section className="briefing" aria-labelledby="briefing-title">
      <p className="briefing-date" id="briefing-title">
        Delivery day: {longDate(briefing.date)}
      </p>
      <p className="verdict">
        Wind is forecast to average <strong>{gw(briefing.avg_forecast_mw)} GW</strong>. Hold a
        buffer of about <strong>{mw(briefing.buffer_mw)} MW</strong> for forecast error.
      </p>
      <div className="briefing-meta">
        <span className={`chip ${conf.cls}`}>
          <span aria-hidden="true">{conf.mark}</span> {conf.label}
        </span>
        <span className="muted">
          Uses the latest forecast published before the {clock(briefing.cutoff)} cutoff on the
          day before.
        </span>
      </div>
    </section>
  );
}