## Menoo – multi-tenant restaurant dashboard

Menoo is a SaaS-ready dashboard for creating, publishing, and analysing restaurant menus. The stack is optimised for velocity, maintainability, and future scale.

### Technology stack

- Next.js 15 (App Router) with TypeScript and ISR-ready public routes
- Tailwind CSS 3.4 + shadcn/ui (Radix) component primitives
- Drizzle ORM + Supabase (Postgres, Auth, Storage) with RLS-first schema
- Stripe Billing (Checkout + Customer Portal) webhook integration
- UploadThing for asset uploads, PostHog analytics, Sentry monitoring, QR generator via `qrcode`

### Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the environment example and fill in credentials:
   ```bash
   cp .env.example .env.local
   ```
3. Generate the database (requires a running Postgres / Supabase instance):
   ```bash
   npm run db:generate
   npm run db:push
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

### Available scripts

- `npm run dev` – start the Next.js dev server
- `npm run build` / `npm run start` – production build & launch
- `npm run lint` – ESLint with Next.js config
- `npm run db:generate` – generate Drizzle migration SQL
- `npm run db:push` – push schema to the database
- `npm run db:migrate` – execute generated migrations

### Project layout

```
app/                  Application routes (auth, dashboard, API handlers)
components/           UI and dashboard components (shadcn primitives)
db/                   Drizzle schema definitions
i18n/, messages/      next-intl routing helpers and locale dictionaries
lib/                  Supabase, Stripe, DB clients and shared utilities
app/api/              REST endpoints (menus, categories, items, QR, webhooks)
```

### Environment variables

See `.env.example` for all required keys: Supabase, Stripe, UploadThing, PostHog and Sentry. Values prefixed with `NEXT_PUBLIC_` are exposed to the client.

### Deployment notes

- Deploy the app on Vercel; connect Supabase for Postgres/Auth/Storage.
- Configure Stripe webhook to point at `/api/webhooks/stripe` (Node runtime only).
- UploadThing requires `UPLOADTHING_APP_ID` and `UPLOADTHING_SECRET`.
- Keep Supabase RLS policies aligned with the Drizzle schema for tenant isolation.
- Enable the Google provider in Supabase Auth and configure the redirect URLs used in Google Cloud / Supabase (e.g. `http://localhost:3000/ca/auth/callback`, `http://localhost:3000/es/auth/callback`). Add one entry per supported locale in production as well.
