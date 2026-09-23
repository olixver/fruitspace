// Draws a customer's plate as a PNG from its code.
// Open yoursite.com/api/plate?c=CODE to see one.
import { ImageResponse } from "@vercel/og";
import { decodeOrder } from "./_lib/plate.js";

export const config = { runtime: "edge" };

const W = 900, H = 810;
const COLORS = { board: "#F9ECF0", line: "#D6CACD", plate: "#FFFFFF", ink: "#121112" };

async function loadInter(text) {
  // Google Fonts hands back a .ttf when asked without a browser user agent
  const css = await (await fetch(
    `https://fonts.googleapis.com/css2?family=Inter:wght@700&text=${encodeURIComponent(text)}`
  )).text();
  const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
  if (!url) throw new Error("font not found");
  return (await fetch(url)).arrayBuffer();
}

const el = (type, style, children) => ({ type, props: { style, children } });

export default async function handler(request) {
  const code = new URL(request.url).searchParams.get("c");
  const order = decodeOrder(code);
  if (!order) return new Response("That isn't a fruit plate code.", { status: 400 });

  const D = Math.min(W, H) * 0.88, cx = W / 2, cy = H / 2;
  const fs = Math.round(D * 0.064);

  const fruits = order.f.map(o => {
    const x = cx + (o.x / 1000) * D, y = cy + (o.y / 1000) * D;
    // a wide invisible box centred on the fruit's point, so the label centres itself
    return el("div", {
      position: "absolute", left: x - 450, top: y - 100, width: 900, height: 200,
      display: "flex", alignItems: "center", justifyContent: "center",
    }, [
      el("div", {
        display: "flex", background: "#fff", border: `2px solid ${COLORS.line}`,
        padding: `${Math.round(fs * 0.06)}px ${Math.round(fs * 0.26)}px ${Math.round(fs * 0.14)}px`,
        fontFamily: "Inter", fontWeight: 700, fontSize: fs, lineHeight: 1,
        letterSpacing: -fs * 0.03, color: COLORS.ink, transform: `rotate(${o.r}deg)`,
      }, o.n),
    ]);
  });

  const tree = el("div", {
    width: "100%", height: "100%", display: "flex", position: "relative", background: COLORS.board,
  }, [
    el("div", {
      position: "absolute", left: cx - D / 2, top: cy - D / 2, width: D, height: D,
      borderRadius: 9999, background: COLORS.plate, border: `2px solid ${COLORS.line}`,
    }, []),
    ...fruits,
  ]);

  // Draw fully before answering, so a drawing error shows up as a readable message
  // instead of a blank image.
  const draw = async fonts => {
    const res = new ImageResponse(tree, { width: W, height: H, ...(fonts ? { fonts } : {}) });
    return res.arrayBuffer();
  };
  const errors = [];
  let png = null;
  try {
    const text = [...new Set(order.f.map(o => o.n).join(""))].join("");
    png = await draw([{ name: "Inter", data: await loadInter(text || "a"), weight: 700, style: "normal" }]);
  } catch (e) { errors.push("with Inter: " + (e?.stack || e)); }
  if (!png || !png.byteLength) {
    try { png = await draw(null); } catch (e) { errors.push("built-in font: " + (e?.stack || e)); }
  }
  if (!png || !png.byteLength) {
    return new Response("Couldn't draw the plate.\n\n" + errors.join("\n\n"), { status: 500, headers: { "Content-Type": "text/plain" } });
  }
  return new Response(png, { headers: {
    "Content-Type": "image/png",
    "Cache-Control": "public, max-age=31536000, immutable",
    ...(errors.length ? { "X-Plate-Note": "drawn with the built-in font" } : {}),
  } });
}
