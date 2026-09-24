// Stripe calls this when someone pays. It checks the call is really from Stripe,
// then emails you the order with a picture of the plate.
import crypto from "node:crypto";
import { buildOrderEmail, buildCustomerEmail } from "./_lib/email.js";

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

const FROM = () => env("ORDER_EMAIL_FROM") || "fruit plate <orders@fruitplatefruitplate.com>";
const OWNER = () => env("ORDER_EMAIL_TO").split(",").map(s => s.trim()).filter(Boolean);
const SITE = () => (env("SITE_URL") || "https://www.fruitplatefruitplate.com").replace(/\/$/, "");

// The idempotency key makes Resend ignore a repeat of the same email,
// so a retry from Stripe never sends anyone a duplicate.
async function resend(payload, key) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
      "Idempotency-Key": key,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Resend said ${res.status}: ${await res.text()}`);
}

export async function sendOrderEmails(session, eventId) {
  const errors = [];
  const mine = buildOrderEmail(session, SITE());
  try {
    await resend({ from: FROM(), to: OWNER(), subject: mine.subject, html: mine.html, text: mine.text, reply_to: mine.replyTo }, `${eventId}-owner`);
  } catch (e) { errors.push("order email: " + e.message); }

  const theirs = buildCustomerEmail(session, SITE());
  if (theirs.to) {
    try {
      await resend({ from: FROM(), to: [theirs.to], subject: theirs.subject, html: theirs.html, text: theirs.text, reply_to: OWNER()[0] }, `${eventId}-customer`);
    } catch (e) { errors.push("customer email: " + e.message); }
  }
  if (errors.length) throw new Error(errors.join(" | "));
}

export async function POST(request) {
  const body = await request.text();
  if (!verifyStripe(body, request.headers.get("stripe-signature"), env("STRIPE_WEBHOOK_SECRET"))) {
    return new Response("signature check failed", { status: 400 });
  }
  const event = JSON.parse(body);
  if (event.type !== "checkout.session.completed") return new Response("ignored", { status: 200 });

  try {
    await sendOrderEmails(event.data.object, event.id);
  } catch (e) {
    console.error(e);
    return new Response("email failed", { status: 500 }); // Stripe will retry
  }
  return new Response("ok", { status: 200 });
}

export function GET() {
  return new Response("fruit plate order webhook is running", { status: 200 });
}
