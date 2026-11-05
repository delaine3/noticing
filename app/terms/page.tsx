import Link from "next/link";
import { LegalPage } from "../components/LegalPage";

export const metadata = { title: "Terms of Use | Noticing" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use">
      <p>
        Noticing is a personal journaling and reflection application operated by Delaine Abner
        from Eswatini. These terms apply when you use the service. Contact{" "}
        <a href="mailto:delaineabner3@gmail.com">delaineabner3@gmail.com</a> about the service.
      </p>
      <h2>Eligibility and your account</h2>
      <p>
        You must be at least 18 years old to register and must provide accurate account
        information. Keep your password private. Do not use the public demo for personal
        information: it is a shared sample account.
      </p>
      <h2>Your records remain yours</h2>
      <p>
        You retain rights to text and records you provide. You grant Noticing only the limited
        permission needed to store, process, and display that material to provide the service,
        perform operations you authorize, and meet legal obligations. Do not upload material
        that you lack the right to use or that unlawfully exposes another person.
      </p>
      <h2>AI and wellbeing</h2>
      <p>
        Outputs and insights are informational and may contain mistakes. Noticing is not a
        therapist, physician, emergency response service, or medical device. It does not
        diagnose, treat, or prevent illness. Do not use it for emergencies, medical decisions,
        or crisis support. Read the <Link href="/safety">wellbeing and safety notice</Link>.
      </p>
      <h2>Acceptable use</h2>
      <p>
        Follow our <Link href="/community-guidelines">community guidelines</Link>.
        Do not misuse accounts, attempt to bypass security controls, disrupt the service,
        scrape other users' data, upload illegal content, or expose personal information
        without a lawful basis.
      </p>
      <h2>Availability and changes</h2>
      <p>
        Features may change or become unavailable.
        Export any entries you need to preserve. We may suspend abusive accounts or temporarily
        restrict access to protect the service, subject to applicable law and user rights.
      </p>
      <h2>Responsibility and statutory rights</h2>
      <p>
        To the extent permitted by applicable law, Noticing is provided without a promise of
        uninterrupted availability or perfect accuracy. Nothing here excludes liability that
        cannot legally be excluded or limits your statutory consumer, privacy, or data-protection
        rights. Specific governing-law, consumer, and dispute rules may apply depending on
        your location; these terms do not claim to override them.
      </p>
      <h2>Privacy, termination, and contact</h2>
      <p>
        See our <Link href="/privacy">privacy notice</Link> for data handling and
        <Link href="/account"> Your data</Link> for export/deletion options. You may stop
        using the service or delete your account directly in Settings.
      </p>
    </LegalPage>
  );
}
