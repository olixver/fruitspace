// Stripe calls this when someone pays. It checks the call is really from Stripe,
// then emails you the order with a picture of the plate.
import crypto from "node:crypto";
import { buildOrderEmail } from "./_lib/email.js";

const env = k => (process.env[k] || "").trim();

function verifyStripe(body, header, secret) {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(header.split(",").map(p => p.split("=")).filter(p => p.length === 2 && p[0] !== "v1"));
  const sigs = header.split(",").filter(p => p.startsWith("v1=")).map(p => p.slice(3));
  const t = Number(parts.t);
  if (!t || Math.abs(Date.now() / 1000 - t) > 600) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${t}.${body}`).digest("hex");
  return sigs.some(s => s.length === expected.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
}

export async function sendOrderEmail(session) {
  const site = env("SITE_URL") || "https://fruitplatefruitplate.com";
  const mail = buildOrderEmail(session, site.replace(/\/$/, ""));
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env("RESEND_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env("ORDER_EMAIL_FROM") || "fruit plate <orders@fruitplatefruitplate.com>",
      to: env("ORDER_EMAIL_TO").split(",").map(s => s.trim()).filter(Boolean),
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      reply_to: mail.replyTo,
    }),
  });
  if (!res.ok) throw new Error(`Resend said ${res.status}: ${await res.text()}`);
}

export async function POST(request) {
  const body = await request.text();
  if (!verifyStripe(body, request.headers.get("stripe-signature"), env("STRIPE_WEBHOOK_SECRET"))) {
    return new Response("signature check failed", { status: 400 });
  }
  const event = JSON.parse(body);
  if (event.type !== "checkout.session.completed") return new Response("ignored", { status: 200 });

  try {
    await sendOrderEmail(event.data.object);
  } catch (e) {
    console.error(e);
    return new Response("email failed", { status: 500 }); // Stripe will retry
  }
  return new Response("ok", { status: 200 });
}

export function GET() {
  return new Response("fruit plate order webhook is running", { status: 200 });
}
