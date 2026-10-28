import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

// Tiny hash router (#/briefing). No extra dependency, and it works on Vercel
// without any rewrite rules.

export const ROUTES = ["home", "briefing", "accuracy", "method", "knowledge"];

export const RouterContext = createContext({ route: "home", phase: "idle", go: () => {} });
export const useRouter = () => useContext(RouterContext);

const read = () => {
  const r = window.location.hash.replace(/^#\/?/, "");
  return ROUTES.includes(r) ? r : "home";
};
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// phase: "idle" | "cover" (green curtain closing) | "reveal" (curtain lifting)
export function useHashRoute() {
  const [route, setRoute] = useState(read);
  const [phase, setPhase] = useState(reducedMotion() ? "idle" : "reveal");
  const busy = useRef(false);

  useEffect(() => {
    const onHash = () => {
      setRoute(read());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Opening animation on first load.
  useEffect(() => {
    if (phase !== "reveal") return;
    const t = setTimeout(() => setPhase("idle"), 900);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const go = useCallback((to) => {
    if (busy.current || to === read()) return;
    if (reducedMotion()) {
      window.location.hash = `#/${to}`;
      return;
    }
    busy.current = true;
    setPhase("cover");
    setTimeout(() => {
      window.location.hash = `#/${to}`;
      setPhase("reveal");
    }, 450);
    setTimeout(() => {
      setPhase("idle");
      busy.current = false;
    }, 1300);
  }, []);

  return { route, phase, go };
}