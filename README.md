# Waypoint

Operational resource allocation and execution for distributed field teams. Given a work order, Waypoint recommends the best available crew and shows exactly why, then recalculates that recommendation the moment something on the ground changes.

This is a portfolio project built alongside [Meridian Operations](https://meridian-operations-five.vercel.app), which handles the decision-support side of operational disruption. Waypoint picks up where Meridian stops: it takes a decision and carries it through execution.

## The idea in one line

Data tells you what's happening. Field operations need to know what to do next, and whether that's still true five minutes later.

## What's actually built

- **Command Centre**, a priority queue of open work orders, ranked and ready to act on, not a wall of KPI cards.
- **A transparent scoring engine** (`lib/scoring.ts`) that ranks available crews against a work order on priority, certification match, proximity, and current workload. Every factor is visible, nothing is a black box, and there's no trained model hiding the logic.
- **Work Order Workspace** (`/work-orders/[id]`), full context on one page: asset condition and maintenance history, nearby crews with a certification flag, live weather off Open-Meteo for that location, and related work orders sharing the same asset or site.
- **Resource and Response Planning** (`/work-orders/[id]/plan`), the scoring engine's UI. Recommended and Alternative crews shown side by side with the full breakdown, the operator picks, the system never assigns on its own.
- **Execution and Replanning** (`/work-orders/[id]/execute`), the signature piece. Status moves Assigned → In Progress → Blocked → Complete; a blockage requires a reason before it's accepted, and the moment it's confirmed the scoring engine re-runs, excluding the crew that just got stuck, with a fresh recommended/alternative pair ready for a replan.
- **Decision Log** (`/decisions`), a durable, append-only record of every assignment and replan: work order, crew, reasoning, decision maker, timestamp. Mirrors Meridian's Decision Register.
- **A guided walkthrough** (`/demo`) of the ten-step Western Sydney scenario, linking each step into the real screens rather than faking a scripted run.
- Real tests across `lib/*.test.ts` proving the logic actually does what it claims, not just eyeballed: certified crews outrank closer uncertified ones, off-shift crews are excluded outright, a blocked crew is excluded from its own recalculated recommendation, weather degrades to an explicit "unavailable" state instead of throwing, and assignment history survives a reassignment rather than being overwritten.

## What's coming next

All five modules are built, and the interface has had a proper design pass on top: press feedback on every button, toast confirmation on the actions that don't redirect, and a mount-then-animate reveal on the "report blocked" form instead of it just appearing. Nothing decorative, everything animated has a job to do.

What's left is the data layer. A Supabase project is connected to this environment, but neither project on the account has Waypoint's schema applied yet, so the in-memory runtime store (`lib/store.ts`) and the `lib/seed-data.ts` reference data are standing in for real tables. Wiring one up means running `db/schema.sql` against a project and swapping the seed-data and store functions for Supabase queries. That's a data-layer swap, not new product surface, everything above is written against plain functions that don't care where the data comes from.

Beyond that, nothing, on purpose. Scenario planning, a standalone executive view, and an interactive map were all deliberately left out, see `docs/waypoint-prd.md` for why each one got cut rather than quietly dropped.

## Stack

Next.js (App Router) and TypeScript on the front end, Supabase (Postgres) for storage, Open-Meteo for live weather data. No paid APIs anywhere in this build, by design, no Mapbox, no card on file, see the notes doc if you're wondering why there's no interactive map.

## Running it locally

```bash
npm install
npm run dev
```

Reference data (assets, crews, locations, work orders) runs against seed data in `lib/seed-data.ts`, matching the Western Sydney demo scenario. Assignments and decisions logged during a session live in an in-memory store (`lib/store.ts`), which resets on a dev server restart, that's a documented tradeoff, not a bug. Wiring both up to Supabase means running the schema below against a project and swapping the seed-data and store functions for Supabase queries, that hasn't happened yet, not because there's no project to connect to, but because the schema hasn't been applied to one.

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

`db/schema.sql` has the full schema, ready to run against a fresh Supabase project when that's connected.

## Tests

```bash
npx vitest run
```
