// Builds the "new fruit plate order" email.
import { decodeOrder } from "./plate.js";

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function addressLines(a) {
  if (!a) return [];
  return [a.line1, a.line2, [a.city, a.state, a.postal_code].filter(Boolean).join(", "), a.country].filter(Boolean);
}

// session = a Stripe Checkout Session object
export function buildOrderEmail(session, siteUrl) {
  const code = session.client_reference_id || "";
  const order = decodeOrder(code);
  const cust = session.customer_details || {};
  const ship = session.collected_information?.shipping_details || session.shipping_details || null;
  const name = ship?.name || cust.name || "someone";
  const amount = session.amount_total != null
    ? `${(session.amount_total / 100).toLocaleString("en-US", { style: "currency", currency: (session.currency || "usd").toUpperCase() })}`
    : "";
  const payLink = session.payment_intent
    ? `https://dashboard.stripe.com/${session.livemode === false ? "test/" : ""}payments/${session.payment_intent}`
    : "https://dashboard.stripe.com/payments";

  const img = order ? `${siteUrl}/api/plate?c=${encodeURIComponent(code)}` : null;
  const addr = addressLines(ship?.address || cust.address);

  const row = (label, value) => value ? `
    <tr><td style="padding:6px 14px 6px 0;color:#6b6266;font-size:13px;width:90px;white-space:nowrap;vertical-align:top">${label}</td>
        <td style="padding:6px 0;font-size:14px;color:#121112">${value}</td></tr>` : "";

  const fruitList = order
    ? order.f.map(o => esc(o.n)).join(", ")
    : `<span style="color:#b3261e">No plate attached to this order${code ? ` (code: ${esc(code)})` : ""}.</span>`;

  const subject = `new fruit plate from ${name}`;
  const html = `<!doctype html><html><body style="margin:0;background:#FCEFF3;padding:24px 12px;font-family:Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
  <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border:1px solid #D6CACD;border-radius:18px">
    <tr><td style="padding:24px 24px 8px">
      <div style="font-size:30px;font-weight:800;letter-spacing:-1.5px;color:#121112">fruit plate.</div>
      <div style="font-size:15px;color:#121112;margin-top:6px">${esc(name)} ordered a painting${amount ? ` (${esc(amount)})` : ""}.</div>
    </td></tr>
    ${img ? `<tr><td style="padding:12px 24px">
      <a href="${img}"><img src="${img}" width="512" alt="${esc(name)}'s fruit plate: ${order.f.map(o => esc(o.n)).join(", ")}" style="display:block;width:100%;max-width:512px;height:auto;border:1px solid #D6CACD;border-radius:12px"></a>
    </td></tr>` : ""}
    <tr><td style="padding:8px 24px 20px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${row("fruit", fruitList)}
        ${row("customer", esc(cust.name || ""))}
        ${row("email", cust.email ? `<a href="mailto:${esc(cust.email)}" style="color:#121112">${esc(cust.email)}</a>` : "")}
        ${row("ship to", addr.length ? [esc(ship?.name || cust.name || ""), ...addr.map(esc)].filter(Boolean).join("<br>") : `<span style="color:#b3261e">no shipping address collected</span>`)}
        ${row("plate code", code ? `<span style="font-family:Menlo,monospace;font-size:12px">${esc(code)}</span>` : "")}
      </table>
      <p style="margin:18px 0 0"><a href="${payLink}" style="display:inline-block;background:#121112;color:#fff;text-decoration:none;border-radius:999px;padding:10px 18px;font-size:13px;font-weight:600">open in Stripe</a></p>
    </td></tr>
  </table></td></tr></table></body></html>`;

  const text = [
    `${name} ordered a painting${amount ? ` (${amount})` : ""}.`,
    order ? `fruit: ${order.f.map(o => o.n).join(", ")}` : "no plate attached",
    img ? `plate: ${img}` : "",
    cust.email ? `email: ${cust.email}` : "",
    addr.length ? `ship to: ${addr.join(", ")}` : "no shipping address collected",
    `stripe: ${payLink}`,
  ].filter(Boolean).join("\n");

  return { subject, html, text, replyTo: cust.email || undefined };
}

/* ---------- the customer's "here's the plate you ordered" email ---------- */
// Reword freely. {name} becomes the customer's first name.
export const CUSTOMER_COPY = {
  subject: "your fruit plate.",
  hello: "thank you, {name}!",
  intro: "here's the plate you arranged.",
  shipping: "the painting of your plate is headed to:",
  signoff: "questions? just reply to this email.",
  signature: "fruit plate fruit plate",
};

export function buildCustomerEmail(session, siteUrl) {
  const code = session.client_reference_id || "";
  const order = decodeOrder(code);
  const cust = session.customer_details || {};
  const ship = session.collected_information?.shipping_details || session.shipping_details || null;
  const first = String(ship?.name || cust.name || "").trim().split(/\s+/)[0] || "friend";
  const fill = s => s.replace(/\{name\}/g, first);
  const img = order ? `${siteUrl}/api/plate?c=${encodeURIComponent(code)}` : null;
  const addr = addressLines(ship?.address);
  const fruitWords = order ? order.f.map(o => o.n) : [];
  const fruitSentence = fruitWords.length <= 1 ? fruitWords.join("")
    : fruitWords.slice(0, -1).join(", ") + " and " + fruitWords[fruitWords.length - 1];

  const html = `<!doctype html><html><body style="margin:0;background:#FCEFF3;padding:24px 12px;font-family:Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
  <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border:1px solid #D6CACD;border-radius:18px">
    <tr><td style="padding:26px 24px 6px">
      <div style="font-size:34px;font-weight:800;letter-spacing:-1.8px;color:#121112;line-height:1">fruit plate.</div>
      <div style="font-size:18px;font-weight:700;color:#121112;margin-top:18px">${esc(fill(CUSTOMER_COPY.hello))}</div>
      <div style="font-size:15px;line-height:1.5;color:#121112;margin-top:6px">${esc(fill(CUSTOMER_COPY.intro))}</div>
    </td></tr>
    ${img ? `<tr><td style="padding:14px 24px 6px">
      <img src="${img}" width="512" alt="your fruit plate: ${esc(fruitSentence)}" style="display:block;width:100%;max-width:512px;height:auto;border:1px solid #D6CACD;border-radius:12px">
    </td></tr>` : ""}
    ${fruitSentence ? `<tr><td style="padding:6px 24px 0;font-size:13px;color:#6b6266;line-height:1.5">${esc(fruitSentence)}</td></tr>` : ""}
    ${addr.length ? `<tr><td style="padding:18px 24px 0;font-size:14px;line-height:1.5;color:#121112">
      <div>${esc(fill(CUSTOMER_COPY.shipping))}</div>
      ${[ship?.name, ...addr].filter(Boolean).map(esc).join("<br>")}
    </td></tr>` : ""}
    <tr><td style="padding:18px 24px 24px;font-size:14px;line-height:1.5;color:#121112">${esc(fill(CUSTOMER_COPY.signoff))}<br>${esc(fill(CUSTOMER_COPY.signature))}</td></tr>
  </table></td></tr></table></body></html>`;

  const text = [
    fill(CUSTOMER_COPY.hello),
    fill(CUSTOMER_COPY.intro),
    img ? img : "",
    fruitSentence ? fruitSentence : "",
    addr.length ? `${fill(CUSTOMER_COPY.shipping)}\n${[ship?.name, ...addr].filter(Boolean).join("\n")}` : "",
    `${fill(CUSTOMER_COPY.signoff)}\n${fill(CUSTOMER_COPY.signature)}`,
  ].filter(Boolean).join("\n\n");

  return { subject: fill(CUSTOMER_COPY.subject), html, text, to: cust.email || null };
}
