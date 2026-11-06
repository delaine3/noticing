/**
 * Both public apps use the same audited source. Vercel sets NEXT_PUBLIC_APP_BRAND
 * separately for Noticing and Sinegugu. The build adjusts display copy only.
 * Never replace lowercase crypto markers, database names, cookies or URLs.
 * This runs in the temporary build workspace, never edits user data.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

if (process.env.VERCEL && !process.env.NEXT_PUBLIC_APP_BRAND) {
  throw new Error("Missing NEXT_PUBLIC_APP_BRAND. Refusing to deploy with a guessed public name.");
}
const brand = process.env.NEXT_PUBLIC_APP_BRAND ?? "Sinegugu";
if (brand !== "Sinegugu" && brand !== "Noticing") {
  throw new Error("NEXT_PUBLIC_APP_BRAND must be Sinegugu or Noticing.");
}


function visit(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      visit(path);
      continue;
    }
    if (!entry.isFile() || !/\.(tsx?|jsx?)$/.test(entry.name)) continue;
    const original = readFileSync(path, "utf8");
    // Display name only. Do not alter encryption domains or database identifiers.
    // Keep the factual dual-brand disclosure intact on both websites.
    const updated = original
      .replaceAll("Noticing and Hoolayah", "__PUBLIC_BRAND_PAIR__")
      .replaceAll("Hoolayah", brand)
      .replaceAll("__PUBLIC_BRAND_PAIR__", "Noticing and Sinegugu");
    if (updated !== original) writeFileSync(path, updated);
  }
}
visit("app");

for (const [file, expected] of [
  ["app/components/AppNav.tsx", brand],
  ["app/components/assistant/AssistantDock.tsx", "Tell " + brand],
  ["app/layout.tsx", 'title: "' + brand + '"'],
]) {
  if (!readFileSync(file, "utf8").includes(expected)) {
    throw new Error("Public branding check failed in " + file);
  }
}
console.log("Verified public app brand: " + brand);
