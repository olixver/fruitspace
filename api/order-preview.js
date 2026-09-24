// Shows what an order email looks like, with a made-up customer. Sends nothing.
// Open yoursite.com/api/order-preview?c=CODE (add &for=customer to see the customer's email)
import { buildOrderEmail, buildCustomerEmail } from "./_lib/email.js";

export function GET(request) {
  const url = new URL(request.url);
  const site = (process.env.SITE_URL || url.origin).trim().replace(/\/$/, "");
  const build = url.searchParams.get("for") === "customer" ? buildCustomerEmail : buildOrderEmail;
  const mail = build({
    client_reference_id: url.searchParams.get("c") || "",
    customer_details: { name: "Sample Customer", email: "sample@example.com" },
    shipping_details: { name: "Sample Customer", address: { line1: "123 Example St", city: "Santa Fe", state: "NM", postal_code: "87501", country: "US" } },
    amount_total: 2000, currency: "usd", livemode: false,
  }, site);
  return new Response(mail.html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
