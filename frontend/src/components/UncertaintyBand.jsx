import { useState } from "react";
import { mw } from "../utils/format.js";

// Linear interpolation over the coverage curve from /api/metrics.
function coverageAt(curve, buffer) {
  if (!curve.length) return 0;
  if (buffer <= curve[0].buffer_mw) return curve[0].covered_pct;
  for (let i = 1; i < curve.length; i++) {
    const a = curve[i - 1];
    const b = curve[i];
    if (buffer <= b.buffer_mw) {
      const t = (buffer - a.buffer_mw) / (b.buffer_mw - a.buffer_mw);
      return a.covered_pct + t * (b.covered_pct - a.covered_pct);
    }
  }
  return curve[curve.length - 1].covered_pct;
}

export default function UncertaintyBand({ coverage, suggested }) {
  const max = coverage.length ? coverage[coverage.length - 1].buffer_mw : 2000;
  const [buffer, setBuffer] = useState(suggested ?? 700);
  const pct = coverageAt(coverage, buffer);

  return (
    <section className="panel" aria-labelledby="buffer-title">
      <h2 id="buffer-title">How big a buffer is enough?</h2>
      <p className="muted">
        Drag to see how often a safety margin would have covered the wind forecast error in
        January.
      </p>
      <p className="big-figure">
        {pct.toFixed(0)}%
        <span className="big-caption"> of half-hours covered by {mw(buffer)} MW</span>
      </p>
      <input
        type="range"
        min={0}
        max={max}
        step={50}
        value={buffer}
        onChange={(e) => setBuffer(Number(e.target.value))}
        aria-label="Safety buffer in megawatts"
      />
      <div className="tm-ends muted">
        <span>0 MW</span>
        <span>{mw(max)} MW</span>
      </div>
    </section>
  );
}