export const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

export const parseNumber = (v) => {
  if (v === "" || v === null || v === undefined) return { ok: false };
  const n = Number(v);
  return Number.isFinite(n) ? { ok: true, n } : { ok: false };
};
