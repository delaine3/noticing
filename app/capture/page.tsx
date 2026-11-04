import { redirect } from "next/navigation";

/** The assistant now lives in one persistent popup throughout the site. */
export default function CapturePage() {
  redirect("/?assistant=open");
}
