# Noticing privacy/security launch gate (5 November 2026)

**Status: NOT verified globally compliant. Do not invite public users until the critical checks are complete.**

## Critical before onboarding strangers
- [ ] Confirm Supabase RLS for **every** existing and future table, view, RPC, and storage bucket. The repo only contains the newer coaching migration, not the original schema. Test account A cannot read/update/delete account B records.
- [ ] Inspect Supabase Auth policies, confirmation and password recovery, rate limits, MFA options, security events, and breached-password protection.
- [ ] Verify the shared demo is populated only with synthetic data. Public demo credentials are present in the repository and browser; assume any visitor can read, edit, and delete demo entries. Prefer a read-only resettable demo with a dedicated isolated backend.
- [ ] Test the implemented self-service account deletion end to end, including secure reauthentication, database cascades, auth removal, and provider cleanup. No email or operator approval should be required. Confirm behavior for passwordless and OAuth accounts if supported.
- [x] User confirmed all nine user-linked tables have zero orphaned records, applied auth.users foreign keys with ON DELETE CASCADE, and reported no Supabase Storage buckets (5 November 2026). Verify in test environment before public launch.
- [ ] Verify privacy contact address is monitored, appropriate as a public contact, and able to receive access/erasure requests.
- [ ] Review Vercel/Supabase/Cloudflare agreements, region and subprocessors, international transfer mechanisms, logging, retention, backup deletion windows, and incident notification obligations. Update the public privacy notice with verified specifics.
- [ ] Confirm lawful bases and any requirements for processing sensitive health or emotional wellbeing information, including explicit consent if applicable. The checkbox currently records no versioned server-side consent evidence.
- [ ] Confirm the 18+ age gate and consent acceptance server-side if opening registration internationally; the current client-side check is a deterrent, not robust age verification.
- [ ] Assess the Eswatini Data Protection Act and regulator requirements, GDPR/UK GDPR, POPIA, CCPA/CPRA, COPPA and other rules where users are actually targeted. Registration, DPO, representative, DPIA, breach reporting and cross-border rules may apply depending on circumstances.
- [ ] Run automated security scanning, dependency audit, authorization tests, accessibility testing, and an external penetration test before scale.
- [ ] Establish incident response, breach contact and reporting procedures; a data inventory; a retention schedule; and processor contract records.
- [ ] Test export across all current tables and large accounts. The export excludes auth-provider metadata, attachments and future tables unless explicitly added.
- [ ] Decide whether public signups should be disabled until launch gate is passed.

## Product risks
- AI can produce inappropriate mental-health, hydration, or other wellbeing suggestions. Review prompts and crisis handling with qualified practitioners. Do not claim therapeutic outcomes.
- No advertising trackers appear in the reviewed code; verify Vercel analytics, other deployment configuration, and third-party instrumentation independently.
- Privacy notice is a provisional disclosure based on repository code, not a legal certification. Avoid unsupported assurances about training, retention, encryption, or geographic storage.
- **Do not merge or deploy these changes without review and testing.** A pull request is not a production safety audit.
