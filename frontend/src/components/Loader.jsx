export default function Loader({ label = "Loading forecast" }) {
  return (
    <div className="loader" role="status" aria-live="polite">
      <svg viewBox="0 0 64 64" width="48" height="48" aria-hidden="true">
        <line x1="32" y1="34" x2="32" y2="60" stroke="currentColor" strokeWidth="3" />
        <g className="rotor">
          <path d="M32 34 L29 8 L35 8 Z" fill="currentColor" />
          <path d="M32 34 L55 47 L52 52 Z" fill="currentColor" />
          <path d="M32 34 L9 47 L12 52 Z" fill="currentColor" />
        </g>
        <circle cx="32" cy="34" r="3.5" fill="currentColor" />
      </svg>
      <span>{label}</span>
    </div>
  );
}