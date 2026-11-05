import Link from "next/link";
import { LegalPage } from "../components/LegalPage";

export const metadata = { title: "Community Guidelines | Noticing" };

export default function CommunityGuidelinesPage() {
  return (
    <LegalPage title="Community guidelines">
      <p>
        Noticing is a private journal, not a public social network.
        Please respect other people&apos;s privacy and use the service responsibly.
      </p>
      <h2>Respect privacy</h2>
      <ul>
        <li>Write about your own experiences without unnecessarily exposing someone else&apos;s private information.</li>
        <li>Never put real personal information into the shared demonstration account.</li>
        <li>Do not attempt to view, extract, or alter another user&apos;s private entries.</li>
      </ul>
      <h2>Respect other people</h2>
      <ul>
        <li>No targeted harassment, threats, exploitation, hate, or encouragement of violence.</li>
        <li>Do not impersonate people, misuse identities, or post unlawful material.</li>
        <li>Do not spam, exploit security flaws, or automate abuse of the service.</li>
      </ul>
      <h2>Use wellbeing features carefully</h2>
      <p>
        Do not treat automatically generated suggestions as a diagnosis or emergency guidance.
        Noticing is not monitored for urgent requests. If someone is in immediate danger,
        contact local emergency services or an appropriate professional.
      </p>
      <h2>Concerns and enforcement</h2>
      <p>
        Report security, privacy, or guideline concerns privately to{" "}
        <a href="mailto:delaineabner3@gmail.com">delaineabner3@gmail.com</a>.
        Responses may include removal of harmful material, access restrictions, or referral
        to appropriate authorities where legally required, applied proportionately.
        See <Link href="/terms">terms</Link> and <Link href="/privacy">privacy</Link>.
      </p>
    </LegalPage>
  );
}
