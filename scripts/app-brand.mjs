/**
 * Both public apps use the same audited source. Vercel sets NEXT_PUBLIC_APP_BRAND
 * separately for Noticing and Hoolayah. The build adjusts display copy only.
 * Never replace lowercase crypto markers, database names, cookies or URLs.
 * This runs in the temporary build workspace, never edits user data.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const brand = process.env.NEXT_PUBLIC_APP_BRAND ?? "Hoolayah";
if (brand !== "Hoolayah" && brand !== "Noticing") {
  throw new Error("NEXT_PUBLIC_APP_BRAND must be Hoolayah or Noticing.");
}
if (brand === "Hoolayah") process.exit(0);

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
      .replaceAll("__PUBLIC_BRAND_PAIR__", "Noticing and Hoolayah");
    if (updated !== original) writeFileSync(path, updated);
  }
}
visit("app");
