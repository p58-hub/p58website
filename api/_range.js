// A single byte range, including open-ended and suffix ranges. Multiple ranges
// are deliberately ignored (the HTTP specification permits a full 200 response).
export function byteRange(header, size) {
  if (typeof header !== 'string' || !header.startsWith('bytes=') || header.includes(',')) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (!match[1] && !match[2])) return null;
  if (!match[1]) {
    const suffix = Number(match[2]);
    return suffix > 0 && Number.isSafeInteger(suffix) ? { start: Math.max(0, size - suffix), end: size - 1 } : { invalid: true };
  }
  const start = Number(match[1]);
  const end = match[2] ? Number(match[2]) : size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || end < start) return { invalid: true };
  return { start, end: Math.min(size - 1, end) };
}
