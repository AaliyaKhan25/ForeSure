import { useEffect, useState } from "react";
import { api } from "../api/client.js";

export function useForecastData() {
  const [dates, setDates] = useState([]);
  const [date, setDate] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [briefing, setBriefing] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingMock, setUsingMock] = useState(false);

  // Loaded once: list of delivery days and the January-wide accuracy numbers.
  useEffect(() => {
    let live = true;
    Promise.all([api.getDates(), api.getMetrics()])
      .then(([d, m]) => {
        if (!live) return;
        setDates(d.data.dates);
        setDate(d.data.dates[d.data.dates.length - 1]);
        setMetrics(m.data);
        setUsingMock((prev) => prev || d.mock || m.mock);
      })
      .catch((e) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, []);

  // Reloaded whenever the chosen delivery day changes.
  useEffect(() => {
    if (!date) return;
    let live = true;
    setLoading(true);
    Promise.all([api.getBriefing(date), api.getForecast(date)])
      .then(([b, f]) => {
        if (!live) return;
        setBriefing(b.data);
        setForecast(f.data);
        setUsingMock((prev) => prev || b.mock || f.mock);
        setLoading(false);
      })
      .catch((e) => {
        if (!live) return;
        setError(e.message);
        setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [date]);

  return { dates, date, setDate, metrics, briefing, forecast, loading, error, usingMock };
}