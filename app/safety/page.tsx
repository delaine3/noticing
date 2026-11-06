import Link from "next/link";
import { LegalPage } from "../components/LegalPage";

export const metadata = { title: "Wellbeing & Safety | Hoolayah" };

export default function SafetyPage() {
  return (
    <LegalPage title="Wellbeing and safety">
      <p>
        Hoolayah helps you preserve experiences and reflect on your own records. Its prompts,
        check-ins, trends, and optional AI responses are not medical or psychological assessments.
      </p>
      <h2>Not a crisis or clinical service</h2>
      <p>
        Hoolayah is not monitored for emergencies and cannot provide emergency intervention.
        If you or someone else may be in immediate danger, contact your local emergency
        number, a local crisis service, or a qualified professional now. Do not wait for an
        app response. Health concerns and medication decisions belong with licensed clinicians.
      </p>
      <h2>Limits of automated suggestions</h2>
      <p>
        AI and rules-based observations can miss context, misread journal entries, or give
        unsuitable advice. Your journal is not evidence of a diagnosis. Do not rely on scores,
        hydration prompts, or pattern descriptions as medical instructions.
        You can skip questions, correct entries, and turn off optional cloud AI processing.
      </p>
      <h2>Protect sensitive information</h2>
      <p>
        Think carefully before saving information about your health, relationships, identity,
        or another person. Do not use the shared demo for personal reflections. To download your data or delete your account, visit <Link href="/settings">Settings</Link>.
      </p>
    </LegalPage>
  );
}
