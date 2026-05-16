# FixFlow AI

Property maintenance marketplace — homeowners report repairs, AI classifies issues, nearby suppliers quote in real time, and both sides chat and close jobs through a demo payment flow.

**Full documentation:** see **[DOCUMENTATION.md](./DOCUMENTATION.md)** (architecture, workflows, API reference, changes since PRD v6.1).

## Quick start

```bash
npm install
npm run dev
```

Set `VITE_CONVEX_URL` in `.env.local` and configure Convex env vars (`OPENAI_API_KEY`, auth secrets). See DOCUMENTATION.md §17.

## Demo logins

After seeding suppliers:

```bash
npx convex run seed:seedSuppliers
npx convex run demoAuth:setupDemoSupplierPasswords
```

- **Supplier:** any seeded `@fixflow.lk` email, password `FixFlowDemo1`  
- **Owner:** sign up via `/signup` as homeowner

## Stack

React · Vite · TypeScript · Convex · OpenAI GPT-4o-mini · `@convex-dev/auth` · `@convex-dev/geospatial` · `@convex-dev/rate-limiter`

## Learn more

- [Convex docs](https://docs.convex.dev/)
- [DOCUMENTATION.md](./DOCUMENTATION.md) — application guide for this repo
