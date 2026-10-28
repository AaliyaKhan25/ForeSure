import NavLink from "./Navlink.jsx";
import { APP_NAME } from "../hooks/Config.js";

export function Mark({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="var(--deep)" />
      <g stroke="#a9dc8f" strokeWidth="2.2" strokeLinecap="round">
        <line x1="16" y1="16" x2="16" y2="6" />
        <line x1="16" y1="16" x2="24.7" y2="21" />
        <line x1="16" y1="16" x2="7.3" y2="21" />
      </g>
      <circle cx="16" cy="16" r="2.2" fill="#f3f7ee" />
    </svg>
  );
}

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="wrap navbar-inner">
        <NavLink to="home" className="logo" aria-label={`${APP_NAME} home`}>
          <Mark />
          <span>{APP_NAME}</span>
        </NavLink>
        <nav className="nav-links" aria-label="Main">
          <NavLink to="home">Home</NavLink>
          <NavLink to="briefing">Daily briefing</NavLink>
          <NavLink to="accuracy">Accuracy</NavLink>
          <NavLink to="method">Method</NavLink>
          <NavLink to="knowledge">Learn</NavLink>
        </nav>
        <NavLink to="briefing" className="btn btn-primary nav-cta">
          Open the briefing
        </NavLink>
      </div>
    </header>
  );
}