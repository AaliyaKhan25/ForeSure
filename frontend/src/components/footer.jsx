import NavLink from "./Navlink.jsx";
import { Mark } from "./Navbar.jsx";
import { APP_NAME } from "../hooks/Config.js";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-grid">
        <div>
          <div className="logo">
            <Mark />
            <span>{APP_NAME}</span>
          </div>
          <p className="footer-text">
            Day-ahead wind forecasts for energy buyers, with the error measured and shown next to
            every number.
          </p>
        </div>
        <nav className="footer-links" aria-label="Footer">
          <NavLink to="briefing">Daily briefing</NavLink>
          <NavLink to="accuracy">Accuracy</NavLink>
          <NavLink to="method">Method</NavLink>
        </nav>
        <p className="footer-text">Wind data from Elexon BMRS (FUELHH and WINDFOR datasets).</p>
      </div>
    </footer>
  );
}