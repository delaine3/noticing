# Noticing conversational logger

## What this feature provides
The authenticated `/capture` page lets a person write naturally about their day, receive structured candidate records, answer a useful follow-up question, correct dates and measurements, and explicitly approve the records saved to Supabase.

The existing `/import/chat` route is different: it reads a ChatGPT export locally and uses deterministic rules. `/capture` is a new chat powered by the OpenAI API when configured.

## Server-side configuration
Set environment variables in the Vercel project or in a local `.env.local` (never in Git):
```env
OPENAI_API_KEY=<your OpenAI API key>
CAPTURE_ALLOWED_USER_IDS=<one or more comma-separated Supabase auth user UUIDs>
OPENAI_CAPTURE_MODEL=gpt-4o-mini
```

The API uses a server-only key. **Do not use a NEXT_PUBLIC_ variable for the API key.** `OPENAI_CAPTURE_MODEL` is optional; its default is `gpt-4o-mini`. The app deliberately refuses paid AI calls unless the current authenticated Supabase user ID is in `CAPTURE_ALLOWED_USER_IDS`. This prevents a publicly accessible demo account from silently spending API budget.

An OpenAI API key is separate from a ChatGPT subscription, and API usage may incur charges. Set project-level usage limits and monitoring on the OpenAI platform as well. Test with one private account before wider access.

## Privacy
- The page explicitly requires the user to consent before sending messages for analysis.
- Only the most recent 10 short in-browser messages are forwarded to the server route, then to the configured OpenAI API model. Data is sent over HTTPS.
- The API request uses `store: false`. It does **not** promise that OpenAI retains no data in all circumstances; consult the API provider's applicable data-handling terms.
- Noticing stores no conversation transcript automatically. The browser memory holds the chat until the user clears or reloads it.
- The user sees proposed records with source evidence and uncertainties. No record is saved before the user ticks Approve and presses Save.
- The authenticated server action revalidates values and the approved flag. It stores the approved title, notes, date, measurements, and an import marker.
- Do not include passwords, financial identifiers or private third-party information in a message. The app cannot guarantee that all sensitive content is detected.
- An account owner may delete a saved record through the existing Logs interface.

## Recording behavior
- The AI asks at most one missing-detail question in a response, where helpful.
- If date is unknown, the candidate's date is blank and the user must confirm it.
- The server allows only the app's registered action types and bounded numeric values; generated text alone cannot bypass validation.
- Each record is routed to an insight area through its log type.
- After a follow-up answer, draft suggestions are refreshed from the recent conversation; unsaved draft edits are replaced. Copy any important edits before sending another message.
- Source evidence is for human review in the browser. It is not automatically stored in logs.
- Approved records may be saved in a batch of up to 10. Duplicate checks use client-generated UUID markers in notes. This is not race-safe under simultaneous requests; a future dedicated unique DB column is recommended.
- No claim of medical causality or automatic diagnosis is allowed.

## Acceptance checks
1. Without `OPENAI_API_KEY` and `CAPTURE_ALLOWED_USER_IDS`, the page should show a configuration notice; the endpoint must refuse paid requests.
2. An unauthenticated request to `/api/capture/analyze` must return HTTP 401.
3. A logged-in but unlisted user must receive HTTP 403.
4. Sending a message without consent must fail.
5. “Today I walked 8 km and watered the garden” should return editable candidates, not automatically insert records.
6. “What if I walked 8 km?” should not be recorded as a completed walk.
7. “I slept 8 hours” should yield a Sleep entry with hours=8 and an editable date. It must not invent a mood rating.
8. When the model asks for a missing date and the user supplies it, it should update the pending proposals rather than create duplicates.
9. A candidate with a missing event date must be rejected by the save action until corrected.
10. Selectively approve a subset and confirm only those records appear in Logs and appropriate Insight areas.
11. Re-submit the same UUID and confirm it is skipped as already saved.
12. Test mobile navigation and the editing form with a long conversation.
13. Execute `npm run lint` and `npm run build` before merging.

## Follow-up improvements
- Move rate limits and duplicate keys into a database table with unique constraints.
- Introduce streaming responses and editable per-record follow-up questions.
- Add user-controlled retention settings and export of imported records.
- Allow users to select goals and measure repeated outcomes.
- Expose a safe local-only capture mode for people who do not want to send text to an AI API.
