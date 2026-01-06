export const normalizeNumericString = (v: string | number | null | undefined) => {
  let s = String(v ?? '').trim();
  if (!s) return '';
  s = s.replace(/[,\s]+/g, '');
  s = s.replace(/[\u0660-\u0669]/g, (c) => String(c.charCodeAt(0) - 0x0660));
  s = s.replace(/[\u06F0-\u06F9]/g, (c) => String(c.charCodeAt(0) - 0x06F0));
  return s;
};

export const extractQuantityInt = (amount: string) => {
  const digits = normalizeNumericString(amount).replace(/[^0-9]/g, '');
  if (!digits) return 0;
  const n = Number(digits);
  return Number.isFinite(n) ? Math.floor(n) : 0;
};
