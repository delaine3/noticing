# Noticing 2.0: adaptive coaching + optional private free cloud AI

## Product goal
One practical suggestion in the moment, based on a short voluntary check-in,
with an optional follow-up that measures whether it helped. Users should not
have to repeatedly prove that an unlogged activity happened.

## Install storage first
Run `supabase/migrations/20261105_adaptive_coaching.sql` exactly once in the
Supabase SQL Editor of the **correct project**. Review the SQL before applying.
It creates five owner-scoped tables:
- `coaching_preferences`: drink goal, medical fluid restriction flag,
  invitation control, recording completeness, optional cloud permission
- `wellness_checkins`: structured 1–5 mood/energy/stress, thought topic,
  up to three relevant boolean questions, optional thought text
- `coaching_interventions`: one deterministic suggested action per check-in,
  optional review due time and state
- `coaching_outcomes`: whether the action was tried, helped, and optional
  post-intervention energy/mood rating
- `coaching_cloud_usage`: daily counter; clients cannot insert or reset

Every table has RLS with owner-only policies. The SQL adds the authenticated
`claim_free_coaching_cloud_request()` RPC to atomically cap use at 6 requests
per signed-in user per day. A failed upstream request still consumes one
allowance, to prevent retry storms.

Existing `logs` remain untouched. There is no destructive migration.

## Main flows
- `/check-in` begins with energy, mood, stress and primary thought topic.
  Conditional follow-ups are limited to three relevant questions. Each allows
  Yes, No or Skip. The next action is computed by a deterministic function, not
  invented by a model. Users may add private text, but it is saved only when
  they explicitly tick the saving box.
- The user decides whether to request a follow-up. If requested, it appears
  in-app when they return an hour or more later; **no background notification
  or scheduled message is sent**.
- `/coaching/settings` controls drink goal (initial guide 1,800ml), fluid
  restriction, complete drink recording, optional in-app invitations, and
  cloud opt-in. A medical fluid restriction turns off extra-drink suggestions.
- Today displays a time-aware fluid goal and most recent check-in's next
  action. In-app invitations appear at most twice, separated by time and
  absent once dismissed. Follow-up invitations are voluntary.
- `/insights/mind` displays the new structured check-ins and counts
  of suggestions the user marked helpful after trying them.
- Existing manual logs and conversation imports remain usable.

## Hydration science and limits
The NHS general adult guide is 6–8 cups or glasses of fluids per day, often
approximately 1.5–2.0L beverages. Tea and coffee count. Conditions such as
prolonged activity, heat and illness can increase requirements. People with
clinician-directed fluid limits should follow their clinician's instructions.

Sources:
- https://www.nhs.uk/live-well/eat-well/food-guidelines-and-food-labels/water-drinks-nutrition/
- https://www.kch.nhs.uk/patients-and-visitors/patients/hydration-matters/

The initial 1,800ml setting is a configurable reference, **not** a universal
prescription. Advice uses time of day. If the user indicates they log all
drinks and is well below the goal in the evening, Noticing can say so and
suggest one glass, not a dangerous catch-up volume. If recording is incomplete,
the app frames the advice conditionally. This is neither diagnosis nor
medical-grade fluid balance accounting.

## International free-cloud provider review (November 5, 2026)

| Provider | Free access | Provider content training | Retention / material caveat | Outcome |
|---|---|---|---|---|
| **Cloudflare Workers AI** | 10,000 neurons daily on Workers Free, hard stops at quota | Explicit no training on customer content | Standard inference zero retention with limited exceptions; some premium models paid-only | **Implemented, optional** |
| GroqCloud | Ongoing free rate-limited tier | Its customer data terms forbid training | ZDR can be enabled; default service/abuse incident exceptions; account-level limits | Strong alternative, not needed in first iteration |
| Hugging Face routed inference | Free accounts get $0.10/month credits | Hugging Face does not train on request bodies | Each downstream inference provider has separate privacy terms | Too many downstream privacy dependencies |
| OpenRouter free models | Some 50 requests/day, subject to availability | Router itself says it does not train; upstream providers vary | Requires per-provider privacy filtering and free model catalog changes | Excluded by default |
| Google Gemini API free tier | Yes | Free input/output may be used to improve products outside certain regions | Fails no-training requirement in this use case | Excluded |
| Cerebras Inference | $5 free initial credit in current pricing | Provider says it does not retain inference content | Credit is not a confirmed ongoing free allowance | Not selected |
| GitHub Models | **Retired July 30, 2026** | Not applicable | No longer usable | Excluded |

Primary terms:
- https://developers.cloudflare.com/workers-ai/platform/data-usage/
- https://developers.cloudflare.com/workers-ai/platform/pricing/
- https://developers.cloudflare.com/workers-ai/models/gemma-4-26b-a4b-it/
- https://console.groq.com/docs/your-data
- https://console.groq.com/docs/rate-limits
- https://huggingface.co/docs/inference-providers/pricing
- https://huggingface.co/docs/inference-providers/security
- https://openrouter.ai/collections/free-models
- https://docs.github.com/en/github-models

### Cloudflare setup (only if desired)
1. Create or use a Cloudflare **Workers Free** account. Do not upgrade to
   Workers Paid or add prepaid AI Gateway credits. Verify this in its billing
   dashboard. No app can guarantee unbilled status just from an API token.
2. In Cloudflare Workers AI, generate a restricted Workers AI API token
   and copy your Cloudflare Account ID.
3. Put these **server-only** values in Vercel or `.env.local`:
   ```env
   CLOUDFLARE_ACCOUNT_ID=<your 32-character Cloudflare account ID>
   CLOUDFLARE_WORKERS_AI_TOKEN=<private Workers AI API token>
   CLOUDFLARE_FREE_PLAN_CONFIRMED=true
   ```
4. Never use `NEXT_PUBLIC_` prefixes for credentials. Never commit
   keys to GitHub or expose them in screenshots.
5. A signed-in user opens **Coaching settings** and explicitly enables cloud
   interpretation after reading the provider notice.
6. The assistant still parses activities locally first. For unfamiliar
   language, it asks permission to send that **specific message** to Cloudflare.
   It does not send saved check-ins, raw thoughts, previous chats, user account
   identifiers or personal histories.
7. A free-quota error returns local-only handling. There is no paid model,
   second cloud provider or automatic billing fallback.

The provider model is pinned in code to
`@cf/google/gemma-4-26b-a4b-it`, documented as Cloudflare-hosted, standard
zero-retention and compatible with Workers Free as of November 2026.
The older `@cf/meta/llama-3.1-8b-instruct` was deprecated May 30, 2026 and
is deliberately **not** used.

## Safety constraints
- AI is an extraction aid, not a diagnosis engine.
- Only explicit, owner-approved events are saved to `logs`.
- Standard check-ins are not automatically sent to external inference.
- Personal thought text is not saved by default. Rating history, the topic,
  interventions and outcome records reside in Supabase under RLS.
- No scheduled check-in or cloud inference runs without user interaction.
- Any severe or worsening physical/mental symptoms should be handled by
  appropriate professional help, not an ordinary productivity recommendation.
- The Cloudflare privacy agreement includes exceptions for storage when users
  explicitly enable stateful services and other legal/process obligations.
  Noticing uses ordinary stateless inference, not Gateway caching/logging.

## Test before production merge
1. Run `npm ci`, `npm run build`, `npm run lint`,
   `node --experimental-strip-types --test tests/*.test.mjs`.
2. Apply the migration to a test Supabase project; verify RLS denies another
   authenticated user all check-ins and settings.
3. Test low energy -> food timing question -> tailored suggestion.
4. Test stress -> actionable thought question -> one next step.
5. Record check-in twice with same request UUID; confirm one row.
6. Request a follow-up and revisit after an hour; verify outcome is saved once.
7. Set fluid restricted; verify neither Today nor check-in suggests extra drinks.
8. Try 500ml at 9 AM and at 7 PM; confirm advice changes.
9. Leave cloud disabled: network tab must show no external AI requests.
10. Enable cloud and approve just one message: verify provider receives only
    that message and the narrow system instruction, not saved data.
11. Exhaust the six-request user cap and Cloudflare's Free quota in a test
    environment; confirm fail-closed behavior and no billing.
12. Check mobile UI, midnight local timezone rollover and browser reload.
13. Test a user without the migration: legacy Logs/Today should still load and
    coaching routes should show a setup notice.
14. Review the Cloudflare Data usage terms again before enabling a public app.

## Incomplete until external setup
The SQL has been committed but cannot be applied to your Supabase project
without access to its SQL editor. The Cloudflare token has not been created
or connected, and live authenticated browser inference has not been exercised.
These steps require the owner to provide/setup credentials privately.
