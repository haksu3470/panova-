This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Company contact and inbound email

The public site shows three company mailboxes (see `lib/company.ts`):

- `panova@panovagroup.org` — general / North Macedonia
- `turkiye@panovagroup.org` — Türkiye, Sivas
- `bangladesh@panovagroup.org` — Bangladesh, Dhaka

Mail sent to any address on `panovagroup.org` is forwarded to the company owner by `POST /api/webhooks/resend`. The route checks the Resend webhook signature, loads the message with the Receiving API, and sends one forward. Retries use the idempotency key `inbound-forward/<email_id>`.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `RESEND_API_KEY` | yes | Sending and receiving. A send-only key cannot call `emails.receiving.get`. |
| `RESEND_WEBHOOK_SECRET` | yes | Signing secret (`whsec_…`) for `/api/webhooks/resend`. Returned once when the webhook is created. |
| `RESEND_FROM` | yes in production | `Panova <panova@panovagroup.org>`. Forwarding uses this when it is an address on `panovagroup.org`; otherwise it falls back to that same mailbox. A `noreply@` address on the verified domain is also fine. Staff invites use this value as-is when it is set. |
| `SITE_URL` | no | Not read by the app. Canonical site is `https://panovagroup.org`. Webhook URL: `https://panovagroup.org/api/webhooks/resend`. Staff invites use `NEXT_PUBLIC_SITE_URL`. |

Set the three Resend variables in the Vercel project. Do not commit secrets.

### DNS and webhook (outside this repo)

Domain verification and the receiving MX record are added separately on Vercel DNS. After that:

1. In Resend, verify `panovagroup.org` for sending (SPF and DKIM records Resend shows).
2. Enable receiving for that domain and add the MX record Resend shows. Its priority number must be the lowest one on the host, or mail will not arrive.
3. Create a webhook for `email.received` pointing at `https://panovagroup.org/api/webhooks/resend`, and store the signing secret as `RESEND_WEBHOOK_SECRET`.
4. Send a test message to `panova@panovagroup.org`, `turkiye@panovagroup.org`, and `bangladesh@panovagroup.org` and confirm each forward. Resend can replay a failed delivery from the webhook dashboard.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
