import test from "node:test";
import assert from "node:assert/strict";
import {
  hasRecovery, makeNewVault, unlockRecoverableVault,
  resetVaultWithRecovery, replaceRecoveryCodeWithPassphrase,
} from "../app/lib/vault-recovery.ts";
import {
  createVerifier, deriveVaultKey, encryptThought, decryptThought,
  newSalt, VAULT_ITERATIONS,
} from "../app/lib/vault-crypto.ts";

const owner = "72d9c82f-90b5-4c45-b70d-b9e0361e3026";
const entry = "a599a443-0197-4650-99b0-a3750986a2c0";
const first = "my first safe diary passphrase";
const second = "a completely different diary passphrase";

test("new diary uses a separately wrapped key and can be unlocked with a passphrase", async () => {
  const setup = await makeNewVault(first);
  assert.equal(hasRecovery(setup.record), true);
  assert.match(setup.recoveryCode, /^[a-zA-Z0-9_-]{43}$/);
  assert.equal(JSON.stringify(setup.record).includes(first), false);
  assert.equal(JSON.stringify(setup.record).includes(setup.recoveryCode), false);
  const encrypted = await encryptThought(setup.key, owner, entry, {
    title: "Private", body: "Nothing can recover this without a secret",
  });
  assert.deepEqual(await decryptThought(await unlockRecoverableVault(first, setup.record), owner, entry, encrypted),
    { title: "Private", body: "Nothing can recover this without a secret" });
  await assert.rejects(unlockRecoverableVault("incorrect diary passphrase", setup.record));
});

test("valid recovery code resets passphrase without changing any encrypted diary entries", async () => {
  const setup = await makeNewVault(first);
  const original = await encryptThought(setup.key, owner, entry, {
    title: "Rain", body: "My actual diary remains encrypted",
  });
  const restored = await resetVaultWithRecovery(setup.recoveryCode, second, setup.record);
  assert.equal(restored.record.verifier_ciphertext, setup.record.verifier_ciphertext);
  assert.deepEqual(await decryptThought(await unlockRecoverableVault(second, restored.record), owner, entry, original),
    { title: "Rain", body: "My actual diary remains encrypted" });
  await assert.rejects(unlockRecoverableVault(first, restored.record));
  await assert.rejects(resetVaultWithRecovery(setup.recoveryCode, first, restored.record));
  assert.notEqual(restored.recoveryCode, setup.recoveryCode);
});

test("recovery code is not a backdoor without its secret", async () => {
  const setup = await makeNewVault(first);
  await assert.rejects(resetVaultWithRecovery("A".repeat(43), second, setup.record));
  await assert.rejects(resetVaultWithRecovery("short", second, setup.record));
  await assert.rejects(resetVaultWithRecovery(setup.recoveryCode, "short", setup.record));
});

test("a user who knows the current passphrase can replace their recovery code", async () => {
  const setup = await makeNewVault(first);
  const updated = await replaceRecoveryCodeWithPassphrase(first, setup.record);
  const entryEncrypted = await encryptThought(setup.key, owner, entry, { title: "Memo", body: "Safe" });
  assert.deepEqual(await decryptThought(
    await unlockRecoverableVault(first, updated.record), owner, entry, entryEncrypted,
  ), { title: "Memo", body: "Safe" });
  await assert.rejects(resetVaultWithRecovery(setup.recoveryCode, second, updated.record));
  assert.notEqual(updated.recoveryCode, setup.recoveryCode);
});

test("an existing passphrase vault remains readable after upgrade to recovery codes", async () => {
  const salt = newSalt();
  const oldKey = await deriveVaultKey(first, { salt, kdf_iterations: VAULT_ITERATIONS });
  const verify = await createVerifier(oldKey);
  const oldConfig = {
    salt, kdf_iterations: VAULT_ITERATIONS,
    verifier_iv: verify.iv, verifier_ciphertext: verify.ciphertext,
  };
  const encrypted = await encryptThought(oldKey, owner, entry, { title: "Original", body: "Existing writing" });
  const upgraded = await replaceRecoveryCodeWithPassphrase(first, oldConfig);
  assert.deepEqual(
    await decryptThought(await unlockRecoverableVault(first, upgraded.record), owner, entry, encrypted),
    { title: "Original", body: "Existing writing" },
  );
  const reset = await resetVaultWithRecovery(upgraded.recoveryCode, second, upgraded.record);
  assert.deepEqual(
    await decryptThought(await unlockRecoverableVault(second, reset.record), owner, entry, encrypted),
    { title: "Original", body: "Existing writing" },
  );
});
