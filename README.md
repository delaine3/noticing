# Noticing

Noticing is a full-stack self-tracking app for logging daily actions and turning them into useful personal evidence.

It started from a practical question:

> What actually helps me feel better, function better, and avoid making the day harder than it needs to be?

The app tracks small but meaningful actions like water, meals, sunlight, movement, reading, app work, mood, energy, recurring thoughts, walks, and strength training.

The point is not to become a perfect productivity machine. The point is to notice patterns early enough to do something useful with them.

Noticing is built around a simple personal rule:

> Support the mind and body first. Then reassess.

---

## Live Demo noticing-six.vercel.app

The hosted app is authentication-protected because user logs are private.

A demo account is available for portfolio review:

```txt
Email: demo@noticing.com
Password: D3m0Pa$$w0rd783!
```

The demo account contains sample data so the dashboard, logs page, and insights page can be reviewed without creating a personal account.

---

## What the App Does

Noticing lets users log daily actions and see those actions organized into useful feedback.

Current features include:

- Email/password authentication
- User-owned logs with Supabase Row Level Security
- Daily command center
- Next-action recommendation
- Dynamic action form that only shows relevant fields
- Water quantity tracking
- Common water/liquid title shortcuts based on user history
- Separate liquid name and quantity controls
- First meal timing audit
- Daily report card
- Timeline grouped by time windows
- Logs page grouped by day
- Paginated logs, 20 at a time
- Edit log entries
- Delete log entries with confirmation
- Insights dashboard
- Mood, energy, and intensity trends
- Effect breakdown chart
- Treadmill distance, pace, and average speed tracking
- Strength training set capture
- Demo account with seeded data

---

## Why I Built It

A lot of self-improvement tools assume the problem is motivation. Noticing assumes the first problem is often missing data.

Some days feel terrible for mysterious emotional reasons. Then you look closer and realize:

- You had no water.
- You ate your first meal at 4pm.
- You never went outside.
- You scrolled instead of reading.
- You had a high-intensity thought loop and treated it like a court case.
- You tried to debug your entire life while underfed and dehydrated.

Noticing is a way to catch that pattern.

It is not trying to optimize every second of the day. It is trying to reduce avoidable suffering by making the basics visible.

---

## Core Philosophy

Noticing is based on what I call **The At Least Method**.

Some days do not need a complete life overhaul. They need the minimum effective intervention:

- At least drink water.
- At least eat something real.
- At least get sunlight.
- At least move for five minutes.
- At least wash up.
- At least log the thought instead of feeding it.
- At least do one useful thing.
  The goal is to keep your body supported enough that life does not become unnecessarily harder.

  The app reflects that philosophy in its design. It does not only collect data. It tells the user what probably needs attention next.

---

## Tech Stack

### Frontend

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Recharts

### Backend and Data

- Supabase Auth
- Supabase Postgres
- Supabase Row Level Security
- Supabase RPC functions
- Server Actions

### Deployment

- Vercel

---

## Architecture Overview

The app is organized around a simple separation:

```txt
Data → Rules → Views
```

### Data

Supabase stores the durable data:

- users
- profiles
- logs
- strength sets

Each private row is tied to a `user_id`, which references the authenticated Supabase user.

### Rules

Daily rule functions interpret the data.

Examples:

- `getNextActionCopy`
- `getDailyReport`
- `getTimeBuckets`
- `getTotalWaterMl`
- `getWaterMessage`

These functions decide what the data means, such as whether the user has had enough water, whether their first meal was late, or which next action should be shown.

### Views

React components display the app.

Examples:

- `TodayCommandCenter`
- `CommandCard`
- `SummaryCard`
- `QuickLogCard`
- `ReportCard`
- `TimelineCard`
- `TimelineLog`
- `NewActionForm`
- `WaterFields`
- `InsightsDashboard`
- `ScoreTrendChart`
- `Treadmill`
- `FirstMealAudit`

The view layer does not own the core rules. It receives data and renders it.

This keeps the app easier to reason about as features grow.

---

## Authentication and Data Ownership

Noticing uses Supabase Auth for email/password login.

The app uses two Supabase clients:

- a browser client for client-side auth behavior
- a server client for protected server components and server actions

Authenticated pages check the current user server-side. If there is no user, the app redirects to the login page.

Each log belongs to one user through:

```txt
logs.user_id = auth.users.id
```

This matters because `logs.id` is the row ID generated by the database, while `logs.user_id` is the owner ID from authentication.

The distinction is important:

```txt
id      = the database row's own ID
user_id = the authenticated user who owns the row
```

Supabase Row Level Security protects user data so users only access their own logs.

---

## Database Design

### `profiles`

Stores profile information connected to a Supabase auth user.

Typical fields:

```txt
id
email
full_name
username
avatar_url
created_at
updated_at
```

The `id` column references `auth.users(id)`.

### `logs`

Stores daily tracking entries.

Typical fields:

```txt
id
user_id
log_type
title
notes
action_date
action_time
category
effect
meal_size
meal_source
water_amount_ml
treadmill_duration_minutes
treadmill_distance_km
treadmill_pace_min_per_km
workout_name
mood_score
energy_score
intensity_score
occurred_at
```

The `logs` table uses one flexible structure for many action types. This keeps the app simpler than creating a separate table for every action category while still allowing action-specific fields.

For example:

- Water logs use `water_amount_ml`.
- First meal logs use `meal_size` and `meal_source`.
- Treadmill logs use duration and distance.
- Thought logs can use `intensity_score`.

### `strength_sets`

Strength training needs a child table because one workout can have many exercises and sets.

Typical fields:

```txt
id
user_id
log_id
exercise_name
set_number
reps
weight_kg
set_volume_kg
created_at
```

A strength training log lives in `logs`, while the individual sets live in `strength_sets`.

That structure avoids cramming repeated set data into one log row.

---

## Design Decisions

### Server-side data fetching for protected pages

Pages like `/`, `/logs`, and `/insights` fetch data server-side using the Supabase server client. This keeps private data access close to the server-side auth check.

### Client components only where interaction is needed

Interactive components use `"use client"` only where needed.

Examples:

- dropdown navigation
- login form
- dynamic log form
- water buttons
- chart components

This avoids accidentally importing server-only modules like `next/headers` into client components.

### Server Actions for mutations

Creating, editing, and deleting logs are handled through server actions.

That means database writes happen on the server side rather than directly inside UI-only components.

### Row Level Security as the real protection layer

The app does not rely only on hiding buttons or redirecting pages. Supabase RLS enforces ownership at the database level.

Frontend checks improve user experience. RLS protects the data.

### Dynamic action forms

The new log form changes based on action type.

Examples:

- Water shows water quantity controls.
- First meal shows meal-related fields.
- Treadmill shows duration and distance.
- Strength training shows workout fields.
- General actions do not show irrelevant inputs.

This keeps the form from becoming a giant wall of fields.

### Water titles and quantities are separate

The app treats the liquid name and quantity as different pieces of data.

Example:

```txt
title: Rooibos
water_amount_ml: 500
```

This is better than storing `"Big mug"` as the title because the container size is not the drink. It is the measurement.

The app can suggest common liquid names from the user's own history while keeping quantity buttons separate.

### Pagination belongs at the page level

The logs page fetches 20 logs at a time using Supabase range pagination.

The reusable pagination component does not fetch data itself. It only renders page navigation.

This keeps database concerns in the page and display concerns in the reusable component.

### Logs are grouped by action date

The logs page groups entries by the day the action happened, not simply the time the row was created.

That distinction matters because users may log something later than when it happened.

---

## Main Pages

### Today

The Today page is the command center.

It shows:

- the next recommended action
- water total
- number of logs today
- number of report checks
- quick log buttons
- daily report card
- timeline grouped by checkpoint

The goal is to answer:

```txt
What has happened today?
What have I handled?
What needs attention next?
```

### New Log

The New Log page lets users create an action log.

The selected action type controls which fields appear.

The form is intentionally adaptive because a water log and a recurring thought log do not need the same inputs.

### Logs

The Logs page shows historical entries.

Features:

- grouped by day
- paginated 20 logs at a time
- edit links
- delete links
- metadata chips for mood, energy, water, effect, treadmill, and more

### Insights

The Insights page turns raw logs into patterns.

Current insight sections include:

- effect breakdown
- score trends
- treadmill stats
- first meal audit
- notes about how to interpret the data

---

## Supabase RPC Functions

The app uses database-side aggregation where it makes sense.

For example, common water titles are fetched with an RPC function instead of pulling all water logs into the app and counting them in TypeScript.

That keeps aggregation close to the database and avoids unnecessary data transfer as the logs table grows.

Example use case:

```txt
Get the 4 most common water titles for the current authenticated user.
```

This supports user-specific shortcut buttons without exposing other users' data.

---

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Do not commit `.env.local`.

---

## Running Locally

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

Build:

```bash
npm run build
```

---

## Demo Data

The demo account is seeded with fake logs so reviewers can see the app in action.

The demo data includes:

- water logs
- meal logs
- sunlight logs
- treadmill logs
- reading logs
- app work logs
- mood and energy scores
- recurring thought logs
- enough historical data for charts and audits

The demo account is intentionally separate from real user data.

---

## Privacy Notes

The hosted version stores data in Supabase.

This means user logs are stored online, tied to the user's account, and protected through authentication and Row Level Security.

Future privacy-focused features may include:

- export all logs
- delete all logs
- delete account data
- local-only mode
- import previous logs

A local-only mode would require a different storage approach, such as browser storage or a desktop app with a local database.

---

## Future Improvements

Planned or possible improvements:

- data export
- account deletion
- stronger profile settings
- local-only mode
- CSV export
- better strength training analytics
- personal record detection
- weekly summaries
- monthly summaries
- custom action types
- editable quick actions
- richer insights
- more granular trend analysis
- better mobile layout polish
- read-only public demo mode

---

## Lessons From Building This

The interesting parts were architectural:

- separating rules from views
- protecting user-owned data
- designing flexible log structures
- keeping dynamic forms maintainable
- using server actions for mutations
- avoiding client/server boundary mistakes
- deciding what belongs in SQL vs TypeScript
- making demo access possible without exposing private data
- building a system that can grow without getting messy

Noticing is small in concept, but it touches the same concerns as larger production apps: auth, data ownership, permissions, routing, server/client boundaries, reusable components, pagination, aggregation, and stateful forms.

---

## Status

Noticing is in active development.
