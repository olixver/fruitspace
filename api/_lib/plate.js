// Turns the short plate code from a Stripe order back into fruit + positions.
// Must match encodeOrder() in index.html.
import FRUITS from "../../fruits.js";

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const d2 = s => B64.indexOf(s[0]) * 64 + B64.indexOf(s[1]);

// Returns { f: [{ n, x, y, r }] } or null.
// x, y = fruit centre relative to plate centre, in thousandths of the plate width. r = degrees.
export function decodeOrder(code) {
  code = (code || "").trim();
  if (code[0] !== "1" || (code.length - 1) % 7 || /[^A-Za-z0-9_-]/.test(code)) return null;
  const f = [];
  for (let i = 1; i < code.length; i += 7) {
    const c = code.slice(i, i + 7);
    f.push({
      n: FRUITS[d2(c.slice(0, 2))] ?? "unknown fruit",
      x: d2(c.slice(2, 4)) - 2048,
      y: d2(c.slice(4, 6)) - 2048,
      r: B64.indexOf(c[6]) - 32,
    });
  }
  return { f };
}
