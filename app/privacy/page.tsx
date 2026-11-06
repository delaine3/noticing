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
      <h2>What happens when I save a Thought Garden entry?</h2>
      <p>
        Your device locks the entry title and writing using the separate diary password you create.
        Only the locked version is saved online. The people running Hoolayah, including its owner,
        can access stored records but cannot read the protected writing just by opening those
        records. We can still see basic details, such as the date, whether the entry is a draft,
        and which account it belongs to.
      </p>
      <h2>Can you see or recover my diary password or key?</h2>
      <p>
        No. Your diary password is not sent to us, and we do not keep the secret key needed to
        unlock your saved writing. We cannot look it up or reset it. If you forget it and have
        not kept a copy, your encrypted diary may be permanently unreadable, even if you can still
        sign in to your account. Store it safely, such as in a password manager.
      </p>
      <h2>What information is not locked this way?</h2>
      <p>
        We can still access some ordinary account and app records when operating the service,
        including email addresses, activity logs, wellness check-in scores, and details about
        when diary entries were saved. Messages sent to the activity assistant and approved AI
        requests are not protected by the diary vault. Older journal pages and written check-in
        notes also remain readable until you explicitly move them into the encrypted vault.
        When you migrate them, the readable originals are removed from the active shared database;
        they also disappear from the original Noticing app. Older backup copies may remain for a time.
      </p>
      <p>
        Encryption protects stored diary text, but it does not protect against a compromised
        device, malicious code served to your browser, or private text you share outside the
        vault. Your browser receives Hoolayah&apos;s website code, so you must still trust the
        service to deliver safe code. These limits matter even with encrypted storage.
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
        Hoolayah uses outside companies to run the website and store information: Vercel hosts
        the website, Supabase manages sign-in and online storage, and Cloudflare processes
        messages you explicitly send to optional AI. These providers may process
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
