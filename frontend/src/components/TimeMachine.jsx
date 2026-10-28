import { longDate, shortDate } from "../utils/format.js";

export default function TimeMachine({ dates, date, onChange }) {
  const idx = Math.max(0, dates.indexOf(date));
  const go = (i) => onChange(dates[Math.min(dates.length - 1, Math.max(0, i))]);

  return (
    <section className="timemachine" aria-label="Choose a delivery day">
      <div className="date-picker-copy">
        <span className="eyebrow">Delivery date</span>
        <p>Choose a day to inspect its forecast and outcome.</p>
        <strong className="selected-date">{longDate(date)}</strong>
      </div>
      <div className="date-picker-controls">
        <button
          className="btn date-step"
          onClick={() => go(idx - 1)}
          disabled={idx === 0}
          aria-label="Previous delivery day"
        >
          <span aria-hidden="true">←</span> <span className="step-label">Previous</span>
        </button>
        <label className="date-select-wrap">
          <span className="sr-only">Select delivery date</span>
          <select value={date} onChange={(event) => onChange(event.target.value)}>
            {dates.map((day) => (
              <option key={day} value={day}>
                {shortDate(day)}
              </option>
            ))}
          </select>
          <span className="select-chevron" aria-hidden="true">⌄</span>
        </label>
        <button
          className="btn date-step"
          onClick={() => go(idx + 1)}
          disabled={idx === dates.length - 1}
          aria-label="Next delivery day"
        >
          <span className="step-label">Next</span> <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
}
