# CGC — Leads

Public qualifying form for social-media traffic (`/aplicacao`) backed by Postgres, plus an
admin dashboard (`/admin`) to browse/contact leads and a flow editor (`/admin/fluxo`) to
add, remove, and reorder the form's qualifying questions and outcome messages without
touching code.

Unlike a fixed-question form, the flow is a list: each question has options, each option
carries tags (e.g. `qualificado`, `cliente`), and each outcome fires when a lead's collected
tags match a required set. That's what lets the funnel be reshaped constantly from the admin
panel — add a question, retag an option, add an outcome — with no deploy needed.

## Local development

```bash
npm install
npx prisma dev -n cgc-leads -d   # starts a local Postgres, prints DATABASE_URL
```

Copy the printed connection string into `.env` (see `.env.example`), then:

```bash
npx prisma migrate dev
npm run dev
```

- Public form: http://localhost:3000/aplicacao?origin=instagram
- Admin dashboard: http://localhost:3000/admin (password = `ADMIN_PASSWORD` in `.env`)
- Flow editor: http://localhost:3000/admin/fluxo

## Deploying

1. Provision a Postgres database (Neon, Vercel Postgres, ...) and set `DATABASE_URL` on Vercel.
2. Set `ADMIN_PASSWORD` and a random `SESSION_SECRET` on Vercel.
3. Run `npx prisma migrate deploy` against the production database (or let it run in a
   deploy step) before the first request hits `/admin` or `/aplicacao`.
4. Deploy with `vercel` / the Vercel Git integration.

Each social platform should link to `/aplicacao?origin=<platform>` (e.g. `instagram`,
`tiktok`) so leads are tagged by source in the dashboard.
