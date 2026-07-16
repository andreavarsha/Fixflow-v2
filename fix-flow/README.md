# FixFlow AI

Property maintenance marketplace — homeowners report repairs with a map pin, AI classifies issues, nearby suppliers quote in real time, and both sides chat and close jobs through a demo payment flow.

**Full documentation:** see **[DOCUMENTATION.md](./DOCUMENTATION.md)** (architecture, workflows, API reference).

**Live demo:** https://fix-flow-ai.netlify.app/

## Quick start

```bash
npm install
npm run dev
```

Set `VITE_CONVEX_URL` in `.env.local` and configure Convex env vars (`ANTHROPIC_API_KEY`, auth secrets).

## Demo setup (stage / Netlify)

```bash
npx convex run seed:seedSuppliers
npx convex run suppliers:indexAllSuppliers
npx convex run demoAuth:setupDemoSupplierPasswords
```

### Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Owner | Sign up as homeowner (public signup is owner-only) | your password |
| Supplier (Kadana plumbing) | `nimal.perera.1@fixflow.lk` | `FixFlowDemo1` |
| Supplier (Nawala plumbing) | `janaka.perera.20@fixflow.lk` | `FixFlowDemo1` |
| Supplier (Rajagiriya electrical) | `arjun.selvam.11@fixflow.lk` | `FixFlowDemo1` |

Any seeded `@fixflow.lk` supplier email uses password **`FixFlowDemo1`**.

### Coverage zones

Jobs must be pinned in **Kadana**, **Rajagiriya**, or **Nawala**. Outside those zones → waitlist email capture.

### Audience QR (live submit)

Open the deployed site and go to `/signup` or `/owner/dashboard` after login:

- Site: https://fix-flow-ai.netlify.app/
- Direct login: https://fix-flow-ai.netlify.app/login
- Sign up (homeowner): https://fix-flow-ai.netlify.app/signup

Printable QR: see [`public/demo-qr.png`](./public/demo-qr.png) (points at the live login URL). Regenerate if the Netlify URL changes.

### Smoke checklist (feature freeze)

1. Owner signup → pin in Kadana → submit with photo → AI classifies in English.
2. Map shows nearby suppliers; invite 2–3; quote inbox updates live (two-window test).
3. Supplier submits final quote → owner compare table → Accept.
4. Supplier marks complete → owner sees Ready to pay live → Confirm payment → rating prompt.
5. Pin outside zones → waitlist form saves email.
6. Public signup has **no** supplier option.

## Features Added in v3.0

* **Unified Demo Login**: Implemented tap-to-autofill selection tiles on the Login screen for homeowner, tradesperson, and admin roles.
* **Premium Responsive Navigation Header**: Refactored the homeowner shell into a desktop-friendly sticky top header with horizontal tab sections, custom brand logo, and a mobile bottom navigation bar (replacing "+" with house icon, and renaming tabs to "Action Required").
* **Tab-based Admin Workspace**:
  * **Active Moderation Queue**: Lists active classification tasks and repair tickets with multi-option filters (Text search, urgency level, category, job status). Integrates an overlay modal showing leafet maps and AI overrides.
  * **Completed Archives**: Hosts completed tasks showing cost values, tradesperson assignments, rating stars, and feedback comments.
  * **Marketplace Analytics**: Integrated custom monthly horizontal SVG bar charts, top tradesperson leaderboards, and homeowner requests logs.
* **Consistent Sign Out Wording**: Standardized all references to use `"Sign out"`.

## Stack

React · Vite · TypeScript · Convex · Leaflet · Claude 3.5 Sonnet / GPT-4o · `@convex-dev/auth` · `@convex-dev/geospatial` · `@convex-dev/rate-limiter`

## Learn more

- [Convex docs](https://docs.convex.dev/)
- [DOCUMENTATION.md](./DOCUMENTATION.md)
