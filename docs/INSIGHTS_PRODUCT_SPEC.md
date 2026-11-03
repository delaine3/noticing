# Noticing: practical insights product specification

## Product promise
Noticing should help a person answer three concrete questions:
1. **What happened?** Record activities and measurable details without turning daily life into a compliance test.
2. **What is repeatedly associated with better or worse days?** Compare like-for-like data with sufficient samples. Label observations as observations, not causes.
3. **What can I change this week?** Show a realistic next action or a useful question to investigate.

## Navigation
- **Today:** quick log, current records, a suggested optional action, links to insights and a recent-days review.
- **Logs:** all raw records, editable and removable.
- **Insights:** four destination pages, each with metrics, evidence notes, suggested next steps, and relevant recent records:
  - Body & energy
  - Mind & attention
  - Work & progress
  - Home & people
- **Weekly review:** seven calendar days ending at the latest recorded date, with activity distribution and reflection prompts.

## High-value data, prioritized
### Essential, minimal burden
- Daily check-in: mood /10, energy /10, stress /10, and a contextual note. Ideally at a similar time of day.
- Sleep: hours slept, interruptions, rested feeling.
- Meals: first-meal and other meal times, food description; combine wake and first meal only where both are recorded.
- Drinks: beverage and volume (not a universal hydration target).
- Movement: activity and duration, with distance when applicable.
- Work: concrete result, application, reply, follow-up, interview and dated next step.
- Creative or social time: what happened and whether it felt worth repeating.

### Optional later improvements
- Outcome status per job application (applied, response, interview, offer, rejection, no response) via an application-specific table, with follow-up dates.
- Structured contextual variables for sleep quality, rested feeling, exercise duration, phone use, and per-activity before/after rating.
- Custom goal selection, e.g. improve rest, reduce high-stress periods, finish a portfolio, reclaim leisure.
- User-controlled privacy export, account deletion and data retention settings.
- A real experiment journal: hypothesis, baseline, one specific change, measured outcome and date to review.

## Interpretation rules
- **No entry** means unknown, never failure or proof the activity did not happen.
- A rating is subjective; a chart is a description, not proof of cause.
- A first meal at a given hour is not a medical danger category.
- Do not turn hydration volume into a personal fluid requirement.
- Show counts and time windows. Avoid confident comparisons on sparse samples.
- Present one actionable question on each area page and explain what to record next.
- Never require all data on all days.

## Storage and compatibility
This iteration reuses the existing Supabase logs schema. New log types use existing fields. Optional sleep and session duration use readable, prefixed lines in `notes`:
- `Hours slept: 7.5`
- `Duration minutes: 25`

This is backward compatible but not a long-term structured analytics solution. Users can edit the prefixed note lines manually. When designing a migration to dedicated columns, preserve and import these values.

## Engineering checks before merging
1. Install dependencies; run `npm run lint` and `npm run build`.
2. Test authenticated /insights, /insights/body, /insights/mind, /insights/work, /insights/life, /insights/weekly.
3. Record Daily check-in with all three ratings; verify it appears in Mind.
4. Record Sleep with 7.5 hours and verify the average in Body.
5. Record Focused work, 25 minutes, verify it appears in Work.
6. Test blank duration and missing notes; charts should not show zero values.
7. Verify unrecognized category URLs show 404.
8. Test Today, Logs, Insights and New log on a narrow mobile viewport.
9. Check records from other users are never visible.
10. Verify that pre-existing logs still render, and editing/removing a record still works.

## Known technical limitations
- Insights intentionally load the most recent 500 entries. A fully historical report needs pagination or database aggregation.
- Today currently uses the server's UTC date, rather than the account's preferred timezone; fix this separately.
- The weekly review is anchored to the most recent logged day, not necessarily the current calendar day.
- Some older event-based mood and energy ratings are mixed in the Mind trend. A future chart should default to consistent daily check-ins.
- The duration entries are embedded in notes until dedicated schema fields are available.
