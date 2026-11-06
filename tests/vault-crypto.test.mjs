import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  createVerifier, decryptThought, deriveVaultKey, encryptThought,
  newSalt, verifyVaultKey, VAULT_ITERATIONS,
} from "../app/lib/vault-crypto.ts";

const owner = "9be45476-f090-4be9-b0ce-675aab52dc6f";
const entryId = "26c8ab34-c02d-4c59-93ae-e2a7703d5e10";

test("private journal encryption round trips with browser-compatible WebCrypto", async () => {
  const salt = newSalt();
  const key = await deriveVaultKey("long unique memorable passphrase 🔒 2026", {
    salt, kdf_iterations: VAULT_ITERATIONS,
  });
  const verifier = await createVerifier(key);
  assert.equal(await verifyVaultKey(key, {
    salt, kdf_iterations: VAULT_ITERATIONS,
    verifier_iv: verifier.iv, verifier_ciphertext: verifier.ciphertext,
  }), true);
  const plaintext = { title: "Today 🌱", body: "Private thoughts\nSome unicode 🌷" };
  const sealed = await encryptThought(key, owner, entryId, plaintext);
  assert.notEqual(sealed.ciphertext.includes("Private thoughts"), true);
  assert.notDeepEqual(sealed.ciphertext, plaintext.body);
  assert.deepEqual(await decryptThought(key, owner, entryId, sealed), plaintext);
  await assert.rejects(decryptThought(key, owner, crypto.randomUUID(), sealed));
  const damaged = { ...sealed, ciphertext: sealed.ciphertext.slice(0, -4) + "AAAA" };
  await assert.rejects(decryptThought(key, owner, entryId, damaged));
  const key2 = await deriveVaultKey("different but sufficiently long passphrase", {
    salt, kdf_iterations: VAULT_ITERATIONS,
  });
  assert.equal(await verifyVaultKey(key2, {
    salt, kdf_iterations: VAULT_ITERATIONS,
    verifier_iv: verifier.iv, verifier_ciphertext: verifier.ciphertext,
  }), false);
  await assert.rejects(decryptThought(key2, owner, entryId, sealed));
});

test("Hoolayah server routes never write plaintext journal bodies", () => {
  const journal = readFileSync(new URL("../app/journal/actions.ts", import.meta.url), "utf8");
  const checkin = readFileSync(new URL("../app/coaching/actions.ts", import.meta.url), "utf8");
  const page = readFileSync(new URL("../app/journal/page.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(journal, /\.from\("journal_entries"\)/);
  assert.match(checkin, /thought_detail: null/);
  assert.match(checkin, /if \(payload.values.thought_detail\?\.trim\(\) \|\| payload.journalDraftId\)/);
  assert.doesNotMatch(page, /\.select\("id,entry_date,title,body/);
});
