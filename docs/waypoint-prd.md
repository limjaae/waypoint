# Notes on Waypoint

Quick brain dump on why this is built the way it is, mostly so I remember my own reasoning later.

## The problem I'm actually solving

Ops teams generally know what's broken. An operations manager can tell you off the top of their head how many assets need attention and roughly who's free. What's harder is matching the two properly, under real constraints, fast: who's got the right ticket, who's close enough, who isn't already stretched thin. That still happens by memory and phone calls in a lot of places, which is fine until it isn't. And even a good plan falls over the second something changes on site, a blocked road, the wrong parts, whatever, and then it just sits there being wrong until someone notices.

That's the actual gap: not a dashboard (everyone already knows what's broken), but something that matches work to the right crew and then keeps watching once the crew is out the door.

## Why this exists alongside Meridian

Meridian Operations is a companion project, decision support for supply chain disruption. It stops once a decision gets logged. Waypoint picks up from there and carries a decision through execution, including the part where execution doesn't go to plan. Same stack, same "no paid APIs" rule, but a genuinely different piece of the problem.

## What made the cut

Five modules, built deep rather than nine built shallow:

Command Centre is the landing view, a priority queue instead of a wall of KPI tiles.

Work Order Workspace pulls everything relevant onto one page: asset history and condition, nearby crews, live weather at that location, related work orders. This is the "pull disconnected information into one picture" part.

Resource and Response Planning is the actual engine. Plain, explainable scoring, not a model: priority weight, capability match, proximity, minus a workload penalty. Shows its reasoning, recommended crew plus an alternative, and the operator picks. It never assigns on its own.

Execution and Replanning is the piece I care about most. Work moves Assigned to In Progress to Blocked to Complete, a blockage needs a reason, and the moment one's logged the scoring engine reruns and excludes the crew that just got stuck. This is what proves the thing understands a real, changing situation instead of a scripted demo.

Decision Log is a durable record of every assignment and why, mirrors Meridian's decision register so the two projects stay consistent.

## What I skipped, on purpose

Scenario planning (what-if simulation across workforce or demand) is real work and I didn't have time to do it justice, good v2 candidate once the core loop's actually proven out.

No standalone executive view, the same data already answers that question without a separate screen built for it.

No interactive map, went with a free keyless alternative or just a filterable list instead, since Mapbox and friends aren't free and this project has a hard no-paid-API rule.

Nothing beyond a short labelled sentence for any AI-generated text in the product itself. Anything more elaborate starts looking like manufactured intelligence, and I don't want that.

## Data

Weather comes from Open-Meteo, live, free, no key needed, same one Meridian uses. It's the one genuinely live layer and it's what actually triggers the demo scenario, not a script pretending to.

Everything else, assets, work orders, crews, locations, is synthetic. There's no public dataset for a specific operator's internal asset and workforce records, so synthetic is the honest call here, same as it would be for anyone's real confidential ops data. It's labelled as reference data in the product, not passed off as real.

## Stack

Next.js (App Router) and TypeScript on the front end, Supabase (Postgres) for storage, Tailwind for styling. Same as Meridian, partly for consistency, mostly because it's buildable solo without a team behind it. No trained model anywhere, the scoring is a plain function you can read top to bottom. No paid API, no card on file, no Mapbox.

## The demo, roughly

Weather crosses a severity threshold at a real location. An asset there gets flagged high-risk. A work order gets generated and lands in the priority queue. Nearby crews get identified, the platform recommends one with its reasoning shown against an alternative, a manager approves, the crew heads out and moves into execution. Then the crew hits a blockage, logs a reason, and the plan recalculates itself right there instead of sitting there being wrong.

That last part, the replan, is the whole point of the build. Everything before it exists to set that moment up properly.

## Things I'm deliberately not doing

No fabricated results or made-up numbers dressed up as real outcomes. No self-graded score baked into the docs or the product, that's not my call to make. No chatbot framing anywhere, the scoring is a function, not an assistant.
