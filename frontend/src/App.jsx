import Dashboard from "./pages/Dashboard.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/footer.jsx";
import { RouterContext, useHashRoute } from "./hooks/Usehashroute.js";

export const APP_NAME = "ForeSure";

export default function App() {
  const router = useHashRoute();

  return (
    <RouterContext.Provider value={router}>
      <div className="site-shell">
        <Navbar />
        <div className={`page-frame phase-${router.phase}`}>
          <Dashboard route={router.route} />
        </div>
        <Footer />
        <div className={`route-curtain ${router.phase}`} aria-hidden="true" />
      </div>
    </RouterContext.Provider>
  );
}
