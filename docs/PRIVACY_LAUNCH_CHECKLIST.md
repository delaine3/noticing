# Noticing privacy/security launch gate (5 November 2026)

**Status: NOT verified globally compliant. Do not invite public users until the critical checks are complete.**

## Critical before onboarding strangers
- [ ] Run `docs/ACCOUNT_RLS_AUDIT.sql` and confirm Supabase RLS for **every** existing and future table, view, RPC, and storage bucket. The repo only contains the newer coaching migration, not the original schema. Test account A cannot read/update/delete account B records.
- [ ] Inspect Supabase Auth policies, confirmation and password recovery, rate limits, MFA options, security events, and breached-password protection.
- [ ] **Rotate or disable the shared demo account in Supabase.** A password was published in previous commits. The login button and embedded credential have been removed from the proposed code, but Git history still exposes that old password. Do not re-enable a shared demo without isolation, synthetic data, and safeguards against users entering private material.
- [ ] Keep the production `SUPABASE_SERVICE_ROLE_KEY` out of Vercel Preview environments that use the production Supabase project. Preview code can read server-side environment variables. Use an isolated test Supabase project and separate key if preview testing is needed.
- [ ] Test the new self-service account deletion from Settings end to end with a disposable user, including password verification, the auth record, user-owned table records and error handling. There is no email approval step. Check the Vercel server-only `SUPABASE_SERVICE_ROLE_KEY` setting.
- [x] User confirmed zero orphaned rows in nine user-linked tables, applied auth.users ON DELETE CASCADE constraints in Supabase, and confirmed there are no Storage buckets (5 November 2026). The journal_entries migration includes its own cascading foreign key, but must be applied separately before journal writing works.
- [ ] Verify privacy contact address is monitored, appropriate as a public contact, and able to receive access/erasure requests.
- [ ] Review Vercel/Supabase/Cloudflare agreements, region and subprocessors, international transfer mechanisms, logging, retention, backup deletion windows, and incident notification obligations. Update the public privacy notice with verified specifics.
- [ ] Confirm lawful bases and any requirements for processing sensitive health or emotional wellbeing information, including explicit consent if applicable. The checkbox currently records no versioned server-side consent evidence.
- [ ] Confirm the 18+ age gate and consent acceptance server-side if opening registration internationally; the current client-side check is a deterrent, not robust age verification.
- [ ] Assess the Eswatini Data Protection Act and regulator requirements, GDPR/UK GDPR, POPIA, CCPA/CPRA, COPPA and other rules where users are actually targeted. Registration, DPO, representative, DPIA, breach reporting and cross-border rules may apply depending on circumstances.
- [ ] Run automated security scanning, dependency audit, authorization tests, accessibility testing, and an external penetration test before scale.
- [ ] Establish incident response, breach contact and reporting procedures; a data inventory; a retention schedule; and processor contract records.
- [ ] Test export across all current tables and large accounts. Export now covers journal_entries and login_events when readable, but excludes auth-provider metadata, provider logs, attachments and any tables added later.
- [ ] Decide whether public signups should be disabled until launch gate is passed.

## Product risks
- AI can produce inappropriate mental-health, hydration, or other wellbeing suggestions. Review prompts and crisis handling with qualified practitioners. Do not claim therapeutic outcomes.
- No advertising trackers appear in the reviewed code; verify Vercel analytics, other deployment configuration, and third-party instrumentation independently.
- Privacy notice is a provisional disclosure based on repository code, not a legal certification. Avoid unsupported assurances about training, retention, encryption, or geographic storage.
- **Do not merge or deploy these changes without review and testing.** A pull request is not a production safety audit.
