import Link from "next/link";
import { LegalPage } from "../components/LegalPage";

export const metadata = { title: "Privacy Notice | Hoolayah" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy notice">
      <p>
        Hoolayah is operated by Delaine Abner, based in Eswatini. This notice explains how the
        service handles personal information. For privacy requests or questions, email{" "}
        <a href="mailto:delaineabner3@gmail.com">delaineabner3@gmail.com</a>.
        This notice does not replace any rights you have under applicable law.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li>Account details such as email address and any optional name or username you provide.</li>
        <li>Journal entries, imported and approved records, check-ins, moods, wellbeing observations, activity logs, and preferences that you decide to save. These may include sensitive personal information.</li>
        <li>Authentication/session data and essential device settings such as a timezone preference.</li>
        <li>Technical data that hosting, authentication, and security providers may process to operate and protect the service, such as network and request metadata.</li>
      </ul>
      <h2>Why we process it</h2>
      <p>
        We use account and saved content to operate your private journal, show your history and
        summaries, protect accounts, respond to requests, and maintain the service. You decide what to record. Optional AI is off unless you turn it on,
        and you can turn it off again at any time.
      </p>
      <h2>Encrypted Thought Garden</h2>
      <p>
        New entries created in Hoolayah&apos;s unlocked Thought Garden are encrypted in your browser
        using a key derived from your separate vault passphrase. Only ciphertext, dates, status
        and technical metadata are sent to Supabase. We do not store the vault passphrase or a
        usable decryption key. Losing the passphrase can make these entries permanently unreadable.
        Browser encryption reduces exposure to database administrators, but it cannot protect
        against malicious code served to your browser, a compromised device, or entries you
        explicitly export or disclose.
      </p>
      <p>
        Existing Noticing journal entries and written check-in notes remain readable to database
        administrators until you explicitly migrate them. Migration creates and verifies encrypted
        copies before removing live plaintext originals. Since Hoolayah and Noticing share one
        database, migrated entries will no longer appear as plaintext in Noticing. Provider backups
        may retain older plaintext. Check-in scores, dates, account details, routine activity logs,
        imported records and conversational capture are NOT end-to-end encrypted. Do not write
        private journal content into those fields.
      </p>
      <h2>AI and imported chats</h2>
      <p>
        Core recording and built-in suggestions use software rules. If you enable optional
        Cloudflare Workers AI processing and explicitly approve a message, the approved message
        is transmitted to Cloudflare for interpretation. Do not include information you do not
        want sent to that provider. Turning this off stops future optional transmissions but
        cannot undo completed processing. ChatGPT JSON imports are parsed in your browser;
        only records you individually approve are uploaded to your Hoolayah account.
        Machine-generated suggestions can be wrong. See the <Link href="/safety">safety notice</Link>.
      </p>
      <h2>Service providers and international transfers</h2>
      <p>
        Hoolayah uses Vercel for hosting and Supabase for authentication and database storage.
        Cloudflare is used for optional AI processing when enabled. These providers may process
        data outside Eswatini and your country of residence. We do not sell your journal entries or use them for advertising.
      </p>
      <h2>Who can see your content</h2>
      <p>
        Your account is intended to keep your entries private from other users. Authorized
        infrastructure operators may need limited access to operate or secure the service.
        No internet service can guarantee absolute security. <strong>The shared demo is not
        private:</strong> everyone using it accesses the same sample account. Never enter
        real personal information there.
      </p>
      <h2>Retention</h2>
      <p>
        Saved entries are kept while your account is active unless you delete them. Account
        removal is intended to erase active Hoolayah account data. Provider backups, security
        logs, or legally required records may remain temporarily according to provider schedules
        or applicable law. Account deletion doesn&apos;t immediately remove information from every backup.
      </p>
      <h2>Your rights and options</h2>
      <p>
        Depending on applicable law, you may request access, correction, deletion, portability,
        restriction, or objection to particular processing. You can edit and delete encrypted diary entries and ordinary logs
        in the app. Visit <Link href="/settings">Settings</Link> to download a JSON copy of
        your records or delete your account yourself in Settings, after confirming your
        password. You don&apos;t need to email us to delete your account. For requests that
        can&apos;t be handled in the app, you can use the contact address above.
        You can complain to the relevant data-protection authority if your rights are not respected.
      </p>
      <h2>Children and cookies</h2>
      <p>
        Hoolayah is intended for adults aged 18 or older, not children. Hoolayah uses cookies to keep you signed in and remember your timezone.
        We do not use advertising trackers. Our hosting and security providers may collect
        technical information needed to run the service.
      </p>
      <h2>Updates</h2>
      <p>
        Material changes will require a revised notice and appropriate communication.
        Review this page periodically and contact the operator with questions.
      </p>
    </LegalPage>
  );
}
