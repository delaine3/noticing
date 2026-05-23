# Noticing

Noticing is a personal tracking app for logging daily actions, patterns, and small signals that affect mood, energy, attention, and overall wellbeing.

It is built around a simple idea:

> I can’t control every feeling, but I can collect evidence about what makes life hurt less.

Noticing is not a productivity app pretending humans are machines. It is a practical self-observation tool for tracking the basics: food, water, sunlight, movement, reading, app work, mood, energy, recurring thoughts, and other daily actions.

The app helps turn vague feelings into usable data.

---

## What Noticing Does

Noticing lets users log actions throughout the day and see how those actions connect to patterns over time.

Current features include:

- Daily command center
- Action-specific logging forms
- Water quantity tracking
- First meal timing tracking
- Mood, energy, and intensity scores
- Treadmill distance, duration, pace, and average speed tracking
- Strength training set logging
- Wash-up tracking
- Daily report card
- Timeline grouped by time windows
- Insights dashboard with charts
- User authentication
- User-owned logs through Supabase
- Edit and delete log entries

---

## Core Philosophy

Noticing is based on what I call **The At Least Method**.

The goal is not perfection.

The goal is to keep the organism supported enough that life does not become unnecessarily harder.

That means tracking things like:

- Did I eat?
- Did I drink water?
- Did I get sunlight?
- Did I move?
- Did I read?
- Did I avoid a spiral?
- Did I do one useful thing?

Small actions count because small actions prevent larger crashes.

---

## Tech Stack

- **Next.js** with App Router
- **React**
- **TypeScript**
- **Tailwind CSS**
- **Supabase**
  - Authentication
  - Postgres database
  - Row Level Security
- **Recharts** for insights and charts
- **Vercel** for deployment

---

## Main Pages

### Today

The Today page is the main command center.

It shows:

- The next recommended action
- Water total
- Number of actions logged
- Report card count
- Quick log buttons
- Daily report card
- Timeline grouped by time of day

The app gives direct prompts like:

- Drink water first.
- Eat something real.
- Get light on your face.
- Move for five minutes.
- Read a few pages.

---

### New Log

The New Log page lets users create a log entry.

The form changes depending on the action selected, so irrelevant fields are hidden.

Examples:

- Water shows water quantity fields.
- First meal shows meal size and source.
- Treadmill shows duration and distance.
- Strength training shows exercise, reps, and weight fields.
- Wash-up shows options like brush teeth, shower, bath, and wash face.

---

### Logs

The Logs page shows past entries.

Users can:

- View previous logs
- See metadata like date, time, water amount, mood, energy, and effect
- Edit logs
- Delete logs

---

### Insights

The Insights page turns logs into patterns.

It currently includes:

- Most logged actions
- Effect breakdown
- Mood, energy, and intensity trends
- First meal timing audit
- Water totals
- Treadmill distance and average speed
- Helpful notes for interpreting patterns

---

## Data Ownership

The hosted version of Noticing stores user data in Supabase.

Each user’s logs belong to their account through a `user_id`, and Supabase Row Level Security is used so users can only access their own data.

Future privacy-focused improvements may include:

- Export data
- Delete all user data
- Local-only mode
- Import previous logs

---

## Database Tables

The main database tables are:

### `profiles`

Stores basic user profile information.

Typical fields:

- `id`
- `email`
- `full_name`
- `username`
- `avatar_url`
- `created_at`
- `updated_at`

### `logs`

Stores daily action logs.

Typical fields:

- `id`
- `user_id`
- `log_type`
- `title`
- `notes`
- `action_date`
- `action_time`
- `category`
- `effect`
- `meal_size`
- `meal_source`
- `water_amount_ml`
- `treadmill_duration_minutes`
- `treadmill_distance_km`
- `treadmill_pace_min_per_km`
- `workout_name`
- `mood_score`
- `energy_score`
- `intensity_score`
- `occurred_at`

### `strength_sets`

Stores strength training sets connected to a log.

Typical fields:

- `id`
- `user_id`
- `log_id`
- `exercise_name`
- `set_number`
- `reps`
- `weight_kg`
- `set_volume_kg`
- `created_at`

---

## Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
