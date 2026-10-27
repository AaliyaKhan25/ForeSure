const TZ = "Europe/London";

export const gw = (mw) => (mw / 1000).toFixed(1);
export const mw = (v) => Math.round(v).toLocaleString("en-GB");

export const clock = (iso) =>
  new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  });

export const longDate = (iso) =>
  new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: TZ,
  });

export const shortDate = (iso) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: TZ,
  });

export const signed = (v) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${mw(Math.abs(v))}`;