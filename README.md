# fruit plate.

- `index.html` is the whole site
- `fruits.js` is the fruit list (only add new fruits to the END; orders store fruit by position)
- `api/plate.js` draws a plate as a picture: `/api/plate?c=CODE`
- `api/stripe-webhook.js` receives paid orders from Stripe and emails you
- `api/order-preview.js` shows a sample order email: `/api/order-preview?c=CODE`
- `api/_lib/` holds shared code (not public pages)

## Settings (Vercel → Project → Settings → Environment Variables)

| name | value |
|---|---|
| `RESEND_API_KEY` | from resend.com → API Keys |
| `STRIPE_WEBHOOK_SECRET` | from Stripe → the webhook you create (starts with `whsec_`) |
| `ORDER_EMAIL_TO` | where order emails go (comma-separate for more than one) |
| `ORDER_EMAIL_FROM` | optional, defaults to `fruit plate <orders@fruitplatefruitplate.com>` |
| `SITE_URL` | optional, defaults to `https://fruitplatefruitplate.com` |

After changing settings, redeploy (Deployments → latest → Redeploy).

## Edit mode

`fruitplatefruitplate.com/#edit`. Edits save only in your browser; "copy changes" and send them to Claude to make them permanent.
