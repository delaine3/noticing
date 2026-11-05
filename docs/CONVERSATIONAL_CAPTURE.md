# Noticing's personal assistant

The main entry point is now the small **Tell Noticing** popup at the lower-right of signed-in pages. Visiting `/capture` opens the same assistant through the Today page.

## How it works
1. Say what happened in plain language: "I drank coffee at 7am."
2. Noticing extracts a proposed record locally. If a useful detail is missing, it asks within the chat: "About how much coffee was it? You can say skip."
3. Answer "250 ml", "skip", or correct a time/date. Noticing summarizes the exact record and asks if it should save.
4. Reply **yes** to save to your private Supabase logs, or **no** to discard it. Open **Adjust details (optional)** to make a correction without typing it in chat. Manual entry is still accessible from the chat and the New log navigation.

### Simple parsing, free cloud AI, bandwidth and privacy
- The **zero-network deterministic parser** handles plain first-person reports first. Examples include "I just drank 500ml water", "I just ate a fruit salad", "I had yoghurt at 7am", walks, garden care and bedtime/wake times.
- No on-device language model, GPU runtime, WebLLM dependency or multi-gigabyte model download remains.
- For unfamiliar language, the only optional language model is **Cloudflare Workers AI**, pinned to a model Cloudflare lists as available on Workers Free. It is disabled until the app owner configures an actual Workers Free account and the user enables cloud interpretation in Coaching settings.
- Each unrecognized message still requires a **separate permission reply** before that message is sent. The request includes only that text and extraction instructions, not the user's saved logs, check-in history or full conversation.
- The server enforces an authenticated six-request daily cap per user as well as Cloudflare's Workers Free service quota. Cloudflare's quota fails closed on an actual Free plan. There is no paid fallback or automatic upgrade.
- If cloud is disabled or unavailable, Noticing asks for a simpler action description. Existing structured logs and ordinary capture continue without cloud.
- **No record is stored without the user explicitly approving the exact proposal.** Chat messages in the popup are not persisted across page reloads, but confirmed records are saved to Supabase.

## Night-time sleep flow
The Today screen includes a short **bedtime suggestion after 9 PM**, based on the browser's local time, with one factual sleep benefit per calendar day. This is optional, not a medical bedtime prescription.

The bedside button stores a separate `Bedtime` event at the clicked local date and time. The next morning, an unpaired bedtime triggers a **Record wake time** action. Bedtime and waking are associated across midnight to report **time in bed**, not true time asleep. Neither endpoint invents sleep hours. An actual duration of sleep may only be entered when the person reports it.

Both bedtime and wake events are written server-side under the authenticated user ID. The write checks the user's recent events first to discourage accidental duplicates and enforces date/time validation. This uses existing Supabase logs and requires no database migration. It is not a fully atomic concurrency-proof sleep-session table.

The app stores the browser's **time zone** in a first-party cookie to make Today's records and default manual dates match the user's calendar. It never requests precise location for this purpose.

## Improvements elsewhere
- New and old untitled logs display meaningful labels from the activity type, recorded time and available measurements.
- Today's optional next action includes a concrete explanation of why it might help, without making health claims from missing data.
- The large manual quick-action grid is collapsed by default.

## Verification
CI executes `npm ci`, `npm run build`, `node --experimental-strip-types --test tests/*.test.mjs`, and `npm run lint`.

Manual browser checks before merge:
- "I just drank 500ml water" → Water 500ml proposed → confirm → "yes" → Logs. No cloud call.
- "I just ate a fruit salad" → Meal "Ate a fruit salad" proposed. No cloud call.
- "I had a fruit salad for lunch" and "I ate yoghurt at 7am" → one Meal each, with correct time where stated.
- "I just ate a fruit salad and drank 500ml water" → two independently reviewable records.
- "I had a meeting" and "What if I ate a fruit salad?" → no erroneous food log.
- "I'm going to bed" → bedtime, without invented sleep duration.
- At bedtime/wake, test midnight crossing and labels showing time in bed.
- Without Cloudflare credentials or consent, unusual input prompts for a simpler description. No WebLLM/GPU/model download code is loaded.
- With a verified Workers Free account, test opt-in, per-message permission, input scoping and free-tier exhaustion on a nonproduction test account.
- Confirm navigating between pages keeps the chat until page reload and that manual entry still works.
