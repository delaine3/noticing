# Noticing's personal assistant

The main entry point is now the small **Tell Noticing** popup at the lower-right of signed-in pages. Visiting `/capture` opens the same assistant through the Today page.

## How it works
1. Say what happened in plain language: "I drank coffee at 7am."
2. Noticing extracts a proposed record locally. If a useful detail is missing, it asks within the chat: "About how much coffee was it? You can say skip."
3. Answer "250 ml", "skip", or correct a time/date. Noticing summarizes the exact record and asks if it should save.
4. Reply **yes** to save to your private Supabase logs, or **no** to discard it. Open **Adjust details (optional)** to make a correction without typing it in chat. Manual entry is still accessible from the chat and the New log navigation.

### AI escalation, bandwidth and privacy
- The deterministic local parser runs **first**, without network access or model downloads. Common drinks, meals, walks, gardening and bedtime/wake reports use this path.
- If the parser cannot identify a record and WebGPU is available, Noticing asks permission for **optional downloads**, which could use over 2GB of internet data in total. It then tries the pinned local SmolLM2 360M model, followed by 1.7B when needed.
- Both models run on the device. No text goes to a cloud inference API. The same pinned first-party runtime, exact-revision model downloads and integrity checks remain in force.
- The browser needs adequate GPU memory and WebGPU support. If models cannot produce a reliable record, Noticing requests a simpler description instead of pretending a record was recognized.
- A stalled model can leave the GPU occupied. The popup offers a stop option and uses timeouts; reloading the page may be needed to reclaim GPU resources.
- No model output is saved without the user approving the proposed record.
- **Important:** Only saved, approved record summaries enter Supabase; messages held in the popup are lost on full page reload.

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
CI executes `npm ci`, model manifest integrity check, `npm run build`, `node --experimental-strip-types --test tests/*.test.mjs`, and `npm run lint`.

Manual browser checks before merge:
- Click the floating assistant on several routes, then test "I drank coffee at 7am" → amount question → "250 ml" → confirmation → "yes" → Logs.
- Test "I'm going to bed" without recording fabricated sleep hours.
- Test the 9 PM local bedtime button and the next-morning wake button. Confirm cross-midnight duration is labeled **time in bed**.
- Test "I woke up" with no time, confirm assistant asks for wake time or allows skipping it.
- Test a hypothetical ("What if I walked 10 km?") and confirm no proposed event is created.
- On a device without WebGPU, confirm ordinary offline capture works with no model download or API.
- For unfamiliar natural language, confirm permission is required before significant model downloads. Inspect Network requests during on-device inference to verify chats are not transmitted.
- Confirm opening the assistant and navigating between pages preserves the conversation until full page reload.
- Confirm manual entry works and edited records remain private to their owner.
