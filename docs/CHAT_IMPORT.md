# ChatGPT conversation import: private MVP

## What this feature does
A signed-in Noticing user can open `/import/chat`, select a local ChatGPT `conversations.json` export, choose a conversation, review a series of proposed entries, edit each date, type, title, note and quantities, and individually approve up to 25 entries per save. Only those approved summaries and a hashed source identifier are sent to Supabase.

A short topic-signal panel suggests additional areas of life worth tracking. Those suggestions are not interpreted as confirmed personal facts and are not saved.

## What it does not do
- It does not access ChatGPT accounts or live chats directly.
- It does not send the ChatGPT export or raw conversation messages to a remote AI model or Supabase.
- It does not diagnose, infer motives, or automatically assign mood and health ratings.
- It does not automatically import a conversation or assert that the message date is the event date.
- It does not find every event in an export. The first extractor uses deliberately conservative patterns.
- It does not distinguish a conversation referencing an event already manually logged. Existing duplicate protection applies only to items previously imported from the same source message.

## How to use
1. Export ChatGPT data from your ChatGPT account's Data Controls.
2. Extract the downloaded ZIP locally; locate `conversations.json`.
3. Sign in to Noticing and visit `/import/chat`.
4. Select the JSON file. The browser reads it locally, without uploading the transcript.
5. Pick a conversation. Read the source excerpt beside every proposal.
6. Confirm that the event happened, correct its **actual** date and data, remove identifying details about other people, and tick Approve.
7. Save up to 25 approved entries at a time.
8. Inspect the saved entries on Logs and related Insight pages.

## Technical notes
- No new database tables or dependencies. The existing authenticated Supabase `logs` table and RLS policies are reused.
- The approved entry gets `[noticing-import:<SHA-256>]` in the `notes` field as an identifier to avoid repeating imports from a given source. The hash is generated locally from a stable export conversation/message identifier; the original source text is not persisted.
- Approvals never save the original excerpt. The export parser and UI run in the browser. The server action validates allowable types, numeric ranges, the event date, field lengths, identity and existing import markers.
- To reduce accidental disclosure, candidate detection skips messages containing a set of sensitive terms. This is not a complete sensitive-data detector. **Users must inspect and remove private details before approval.**
- The browser accepts JSON exports up to 35 MB. Large exports require local splitting; ZIP files must be extracted first.
- The current extractor reads ordinary text-only user messages from ChatGPT's common export structure. Multimodal payloads and nonstandard export formats are not supported.
- Source date is explicitly a message date and must be reviewed; it can differ from the reported event.
- New `Home improvement` and `Personal observation` log types appear in Home & People and Mind & Attention respectively.

## Verification before production merge
- Run `node --experimental-strip-types --test tests/chat-import.test.mjs` with Node 22.
- Run `npm run lint` and `npm run build`.
- Try an export with zero conversations, an ordinary multi-conversation export, malformed JSON, a non-JSON file, and a file larger than 35 MB.
- Confirm a conversation containing hypothetical statements does not automatically create events.
- Confirm selecting a file does not emit a server request containing original transcript text. Network requests should occur only after approving and saving entries, containing the edited summaries.
- Confirm unapproved entries are never saved.
- Confirm event date correction persists in `action_date`.
- Confirm reimporting the same approved source record reports a duplicate and does not create a new row.
- Confirm users cannot view or edit other users' records.
- Test small-screen usability, keyboard navigation, and preserving unapproved entries if a save partially fails.

## Future improvements
- Offer a local-only processing option that also accepts ZIP archives directly without uploading them.
- An editable import history and a dedicated source-id column with a unique constraint for race-safe deduplication.
- Better precision through local on-device language models, never silently sending transcripts to external services.
- Ask the user which additional categories matter to them before offering extended analysis.
- Allow users to map a proposed import to an existing log rather than creating a duplicate.
- Better large-export support via streaming parse and paginated candidate review.
