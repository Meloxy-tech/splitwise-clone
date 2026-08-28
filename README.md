# Ledger — Expense Splitter

A full-stack expense-splitting app (Splitwise-style) built to run entirely on free-tier infrastructure — no paid APIs, no API keys required.

**Live demo:** _add your deployed URL here after deploying_
**Demo login:** `alice@example.com` / `password123` (after running the seed script)

---

## What it does

- Create groups, invite members by email
- Log shared expenses, split **equally**, by **exact amounts**, or by **percentage**
- See each member's live net balance
- **Debt simplification**: a greedy algorithm reduces a tangle of pairwise debts down to the minimum practical number of payments (e.g. 5 people with mixed debts settle in ≤4 transactions instead of 10+)
- Mark payments as settled and watch balances update

## Why these engineering choices

- **Local, zero-cost balance calculation.** The core feature — figuring out who owes whom — is pure math (sum of shares vs. sum paid), so it needed no external service at all. This was a deliberate choice to keep the app free to run indefinitely, not a workaround.
- **Greedy debt simplification, not optimal.** Finding the true *minimum* number of transactions to settle a set of balances is NP-hard (it's equivalent to a set-partition problem). The greedy "largest debtor pays largest creditor" heuristic runs in O(n log n), is easy to reason about and test, and gets very close to optimal for realistic group sizes. This tradeoff — and why it was made — is exactly the kind of judgment call worth explaining in an interview.
- **Server-computed splits.** The client sends what the user typed (amount, percentages); the server is the only place that computes and persists actual share amounts, so a manipulated client request can't create inconsistent data.
- **Single Next.js app, not a separate frontend/backend.** API routes live alongside the UI. Fewer moving parts, one deployment target, no CORS configuration — appropriate for this project's scope.

## Tech stack

| Layer | Choice | Cost |
|---|---|---|
| Framework | Next.js 14 (App Router) | Free |
| Styling | Tailwind CSS | Free |
| Database | PostgreSQL (Supabase or Neon free tier) | Free |
| ORM | Prisma | Free |
| Auth | NextAuth.js (credentials + bcrypt) | Free |
| Hosting | Vercel | Free |
| Tests | Vitest | Free |
| CI | GitHub Actions | Free |

No OpenAI, no third-party AI API, no paid service of any kind is required to run this in production.

---

## Getting started

### 1. Clone and install

```bash
git clone <your-repo-url>
cd splitwise-clone
npm install
```

### 2. Set up a free Postgres database

Pick one:
- **[Supabase](https://supabase.com)** — new project → Settings → Database → copy the connection string (use the "connection pooling" string for serverless deployment)
- **[Neon](https://neon.tech)** — new project → copy the connection string from the dashboard

### 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in:
- `DATABASE_URL` — from step 2
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` — `http://localhost:3000` for local dev

### 4. Set up the database

```bash
npm run prisma:migrate    # creates tables
npm run prisma:seed       # optional: adds demo users/group/expenses
```

### 5. Run it

```bash
npm run dev
```

Visit `http://localhost:3000`.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |
| `npm test` | Run the Vitest suite (debt-simplification algorithm tests) |
| `npm run prisma:migrate` | Create/apply a new migration (dev) |
| `npm run prisma:deploy` | Apply existing migrations (CI/production) |
| `npm run prisma:studio` | Visual DB browser |
| `npm run prisma:seed` | Load demo data |

## Deploying (all free tier)

1. Push this repo to GitHub.
2. **Database:** create a Supabase or Neon project, copy the connection string.
3. **App:** import the repo into [Vercel](https://vercel.com) → set `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (your production URL) as environment variables.
4. Vercel runs `npm install` → `postinstall` generates the Prisma client → `next build`. Run `npx prisma migrate deploy` once against the production `DATABASE_URL` (locally, or as a one-off Vercel build step) to create the tables.
5. Done — you have a live URL costing $0/month.

## CI

`.github/workflows/ci.yml` runs on every push/PR: lint → typecheck → unit tests → migration check → build, against a real Postgres service container. No secrets beyond a throwaway test `NEXTAUTH_SECRET` are needed for CI to pass.

## Project structure

```
src/
  app/
    api/            # route handlers (auth, groups, expenses, balances, settle)
    dashboard/       # groups list
    groups/[id]/     # group detail: expenses, balances, settle-up
    login/, register/
  components/         # client components (forms, panels, navbar)
  lib/
    debt-simplify.ts  # the core algorithm — pure functions, fully unit tested
    auth.ts            # NextAuth config
    prisma.ts           # Prisma client singleton
    validations.ts       # zod schemas
    rate-limit.ts          # in-memory limiter for auth routes
prisma/
  schema.prisma       # data model
  seed.ts               # demo data
tests/
  debt-simplify.test.ts # algorithm unit tests
```

## Known limitations (honest, on purpose)

- Group invites require the invitee to already have an account — there's no email-sending step. A real product would queue an invite email; that's explicitly out of scope here.
- The in-memory rate limiter resets on redeploy and doesn't share state across serverless instances. Fine for a single-instance or hobby deployment; swap for Upstash Redis (also free-tier) if you scale past that.
- No currency conversion — all amounts are treated as a single currency.
