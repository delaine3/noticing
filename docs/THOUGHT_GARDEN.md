# Thought Garden and private diary

Implemented in PR #26.

## Activate

Apply `supabase/migrations/20261105_adaptive_coaching.sql` first (if not already installed), then
`supabase/migrations/20261105_thought_garden_journal.sql` in the correct Supabase
SQL Editor. Review the SQL and back up important data before changes.

- Migration **preserves** all existing `wellness_checkins` data, including
  `thought_detail`. It increases the note limit to 12,000 characters.
- The new `journal_entries` table holds private diary pages and recoverable
  unsent check-in draft notes. Owner-only row-level security (RLS) covers
  select, insert, update and delete.
- `max_daily_invites` is expanded from 0–2 to 0–24. Manual check-ins
  remain unlimited. The number controls optional reminders visible on Today,
  not push notifications.

## Use

- Open `/journal` from the header, Today or Mind insights.
- Browse month by month; old check-in notes are read directly from
  `wellness_checkins.thought_detail`. There is no copying or conversion.
- The **Plant a thought** editor automatically saves drafts privately after
  a brief pause in typing. Press **Save this thought** to finalize a page.
  Save failures are shown as errors; never assume persistence on failure.
- Wellness check-in reflections automatically save as private journal drafts
  and are always saved with the check-in when submitted. The completed
  check-in keeps its own reflection, and redundant temporary draft rows
  are removed.
- Edit or delete diary pages. Editing or deleting a check-in's written
  reflection leaves its mood/energy/stress scores and timestamp intact.
  Deletion is permanent and requires browser confirmation.
- At the end of the current month and for past months, the **thought bouquet**
  appears. It uses a deterministic palette, not a language model; a
  downloadable SVG image is assembled in the browser. The garden displays
  actual text, not generated interpretations.

## Privacy and reliability

Cloudflare AI is **not** involved in journal writing, reading or bouquet
creation. The application stores private text in Supabase and requires
sign-in. Supabase's normal account and backup policies still apply.
Autosave is network-dependent; the UI must show failures. Leaving a page
before the first autosave completes may lose recent unsaved keystrokes.

### Validate before merging

1. Confirm earlier check-in note appears at `/journal` on the correct
   month, with no database migration copying old notes.
2. In a test Supabase project, verify a second authenticated user cannot
   select, modify or delete another user's diary pages.
3. Type and abandon a check-in reflection, reopen `/journal`: the draft
   should be recoverable. Save a complete check-in: only one finished
   written reflection should appear.
4. Type a long journal page and verify autosave, edit, delete and
   month navigation, including a December/January boundary.
5. Confirm text and scores remain after refresh. Test network failure
   and see a visible save error.
6. Set daily invitations to 0, 1, 4 and 24. Manual check-ins should
   never be blocked, and prompts should respect the chosen target.
7. View a completed month, export the SVG bouquet and open it locally.
   Do not send private notes to any model or image endpoint.
