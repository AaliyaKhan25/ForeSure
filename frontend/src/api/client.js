// API client. If the backend is unreachable, it falls back to generated demo
// data so the UI can be built and shown before the Python side is ready.
// Every call returns { data, mock } so the UI can say when demo data is on screen.

const BASE = import.meta.env.VITE_API_URL || "/api";

async function request(path, mockFn) {
  if (import.meta.env.VITE_USE_MOCK === "true") {
    return { data: mockFn(), mock: true };
  }
  try {
    const res = await fetch(`${BASE}${path}`);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return { data: await res.json(), mock: false };
  } catch (err) {
    console.warn(`API ${path} failed, using demo data:`, err.message);
    return { data: mockFn(), mock: true };
  }
}

export const api = {
  // { dates: ["2026-01-02", ...] }  delivery days
  getDates: () => request("/dates", mockDates),

  // { date, cutoff, avg_forecast_mw, confidence: "high"|"medium"|"low", buffer_mw }
  getBriefing: (date) => request(`/briefing?date=${date}`, () => mockBriefing(date)),

  // { date, cutoff, points: [{ time, forecast, actual, lower, upper }] }  48 half-hours
  getForecast: (date) => request(`/forecast?date=${date}`, () => mockForecast(date)),

  // { mae, rmse, bias, n, by_hour: [{ hour, mae }], coverage: [{ buffer_mw, covered_pct }] }
  getMetrics: () => request("/metrics", mockMetrics),
};

/* ---------------- demo data ---------------- */

function rng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function seedOf(date) {
  return Number(date.replaceAll("-", "")) % 100000;
}

function mockDates() {
  const dates = [];
  for (let d = 2; d <= 31; d++) dates.push(`2026-01-${String(d).padStart(2, "0")}`);
  return { dates };
}

function cutoffOf(date) {
  const d = new Date(`${date}T09:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString();
}

function mockForecast(date) {
  const r = rng(seedOf(date));
  const phase = r() * Math.PI * 2;
  const level = 4500 + r() * 3500;
  const start = new Date(`${date}T00:00:00Z`).getTime();
  const points = [];
  for (let i = 0; i < 48; i++) {
    const forecast = Math.max(300, level + 2200 * Math.sin((i / 48) * Math.PI * 2 + phase));
    const spread = 600 + (i / 48) * 500;
    const actual = Math.max(0, forecast + (r() - 0.5) * 2 * spread);
    points.push({
      time: new Date(start + i * 30 * 60 * 1000).toISOString(),
      forecast: Math.round(forecast),
      actual: Math.round(actual),
      lower: Math.round(Math.max(0, forecast - spread * 1.1)),
      upper: Math.round(forecast + spread * 1.1),
    });
  }
  return { date, cutoff: cutoffOf(date), points };
}

function mockBriefing(date) {
  const { points, cutoff } = mockForecast(date);
  const avg = points.reduce((a, p) => a + p.forecast, 0) / points.length;
  const halfWidth = points.reduce((a, p) => a + (p.upper - p.lower) / 2, 0) / points.length;
  const confidence = halfWidth < 800 ? "high" : halfWidth < 1000 ? "medium" : "low";
  return {
    date,
    cutoff,
    avg_forecast_mw: Math.round(avg),
    confidence,
    buffer_mw: Math.round(halfWidth / 50) * 50,
  };
}

function mockMetrics() {
  const by_hour = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    mae: Math.round(520 + hour * 12 + 90 * Math.sin(hour / 3)),
  }));
  const coverage = Array.from({ length: 21 }, (_, i) => {
    const buffer_mw = i * 100;
    return { buffer_mw, covered_pct: Math.round(100 * (1 - Math.exp(-buffer_mw / 700)) * 10) / 10 };
  });
  return { mae: 612, rmse: 801, bias: -48, n: 1440, by_hour, coverage };
}