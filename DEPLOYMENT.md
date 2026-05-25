# Ember & Oak — Deployment Guide

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your Supabase + Stripe credentials

# Run development server
npm run dev
```

## 1. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Copy your **Project URL** and **anon key** to `.env.local`
3. Copy your **service_role key** to `.env.local`
4. In the Supabase SQL editor, run:
   ```
   supabase/schema.sql
   supabase/seed.sql
   ```
5. Enable **Realtime** on the `orders` and `order_items` tables in Supabase dashboard

## 2. Stripe Setup

1. Create a [Stripe](https://stripe.com) account
2. Get your publishable and secret keys from the dashboard
3. Add to `.env.local`:
   ```
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   ```
4. Set up webhook:
   - In Stripe dashboard → Webhooks → Add endpoint
   - URL: `https://your-domain.com/api/webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `checkout.session.expired`
     - `charge.refunded`
   - Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## 3. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Or connect your GitHub repo to Vercel for automatic deployments.

**Environment Variables in Vercel:**
Add all variables from `.env.example` in the Vercel dashboard under Project → Settings → Environment Variables.

## 4. Admin Setup

1. Go to `https://your-domain.com/admin/login`
2. Sign up via Supabase Auth or create a user in the Supabase dashboard
3. In Supabase, set the user's role to `admin` in the `profiles` table:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'admin@yourrestaurant.com';
   ```

## 5. Kitchen Display

- Navigate to `/kitchen` on any tablet or TV
- Works best in fullscreen/landscape mode
- Orders update in real-time via Supabase subscriptions

## Architecture Overview

```
/src
  /app
    /page.tsx              → Homepage
    /menu/page.tsx         → Full menu with search/filter
    /checkout/page.tsx     → Checkout form
    /order/[id]/page.tsx   → Order tracking (realtime)
    /order/success/        → Post-payment confirmation
    /kitchen/page.tsx      → Kitchen Display System (KDS)
    /admin/                → Admin dashboard
      /page.tsx            → Dashboard with stats
      /orders/page.tsx     → Order management
      /menu/page.tsx       → Menu CRUD
      /login/page.tsx      → Admin authentication
    /api/
      /checkout/route.ts   → Create Stripe session + DB order
      /webhook/route.ts    → Stripe webhook handler
      /orders/[id]/        → Order read/update
      /coupons/validate/   → Coupon validation
  /components
    /customer/             → Customer-facing components
    /admin/                → Admin components
    /ui/                   → Reusable UI primitives
  /store/cart.ts           → Zustand cart state (persisted)
  /hooks/useRealtime.ts    → Supabase realtime subscriptions
  /lib/
    /supabase/             → Client + server Supabase clients
    /stripe.ts             → Stripe client
    /utils.ts              → Utilities + constants
  /types/index.ts          → TypeScript types
  /middleware.ts           → Auth guard for /admin
```

## Environment Variables Reference

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_SECRET_KEY` | Stripe secret key (server only) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_APP_URL` | Your app's public URL |
