/* All recovery operations happen inside the browser. Nothing sent to storage
 * includes the passphrase, recovery code, or plaintext diary key.
 * Version 1 vaults remain readable; users may explicitly enable recovery.
 */
import { createVerifier, deriveVaultKey, newSalt, VAULT_ITERATIONS, verifyVaultKey, type VaultKeyRecord } from "./vault-crypto.ts";

export type RecoverableVaultRecord = VaultKeyRecord & {
  vault_version?: number | null;
  wrapped_key_iv?: string | null;
  wrapped_key_ciphertext?: string | null;
  recovery_salt?: string | null;
  recovery_iv?: string | null;
  recovery_ciphertext?: string | null;
};

export type NewRecoveryVault = {
  key: CryptoKey;
  record: RecoverableVaultRecord;
  recoveryCode: string;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const masterAAD = encoder.encode("hoolayah-vault-master-wrap-v2");
const recoveryAAD = encoder.encode("hoolayah-vault-recovery-wrap-v2");

function encode(bytes: Uint8Array): string {
  let value = "";
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value);
}
function decode(value: string): Uint8Array {
  const bytes = atob(value);
  return Uint8Array.from(bytes, (character) => character.charCodeAt(0));
}
function newRecoveryCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return encode(bytes).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}
function validRecoveryCode(value: string): boolean {
  return /^[a-zA-Z0-9_-]{43}$/.test(value);
}
async function seal(key: CryptoKey, raw: string, aad: Uint8Array) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: Uint8Array.from(iv), additionalData: Uint8Array.from(aad) },
    key, encoder.encode(raw),
  );
  return { iv: encode(iv), ciphertext: encode(new Uint8Array(encrypted)) };
}
async function open(key: CryptoKey, iv: string, ciphertext: string, aad: Uint8Array): Promise<string> {
  const ivBytes = decode(iv);
  if (ivBytes.length !== 12) throw new Error("Invalid vault recovery information.");
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: Uint8Array.from(ivBytes), additionalData: Uint8Array.from(aad) },
    key, Uint8Array.from(decode(ciphertext)),
  );
  return decoder.decode(decrypted);
}
async function importMaster(raw: string): Promise<CryptoKey> {
  const bytes = decode(raw);
  if (bytes.length !== 32) throw new Error("Invalid vault key size.");
  return crypto.subtle.importKey("raw", Uint8Array.from(bytes), "AES-GCM", false, ["encrypt", "decrypt"]);
}

function isV2(config: RecoverableVaultRecord): boolean {
  return config.vault_version === 2 &&
    typeof config.wrapped_key_iv === "string" &&
    typeof config.wrapped_key_ciphertext === "string" &&
    typeof config.recovery_salt === "string" &&
    typeof config.recovery_iv === "string" &&
    typeof config.recovery_ciphertext === "string";
}
export function hasRecovery(config: RecoverableVaultRecord): boolean { return isV2(config); }

async function wrapExistingMaster(
  masterRaw: string,
  passphrase: string,
  verifier: Pick<VaultKeyRecord, "verifier_iv" | "verifier_ciphertext">,
): Promise<{ record: RecoverableVaultRecord; recoveryCode: string }> {
  if (passphrase.length < 12) throw new Error("Use a unique passphrase at least 12 characters long.");
  const salt = newSalt();
  const recovery_salt = newSalt();
  const recoveryCode = newRecoveryCode();
  const kdf_iterations = VAULT_ITERATIONS;
  const passphraseKey = await deriveVaultKey(passphrase, { salt, kdf_iterations });
  const recoveryKey = await deriveVaultKey(recoveryCode, { salt: recovery_salt, kdf_iterations });
  const wrapped = await seal(passphraseKey, masterRaw, masterAAD);
  const recovered = await seal(recoveryKey, masterRaw, recoveryAAD);
  return {
    record: {
      salt, kdf_iterations,
      verifier_iv: verifier.verifier_iv, verifier_ciphertext: verifier.verifier_ciphertext,
      vault_version: 2, wrapped_key_iv: wrapped.iv, wrapped_key_ciphertext: wrapped.ciphertext,
      recovery_salt, recovery_iv: recovered.iv, recovery_ciphertext: recovered.ciphertext,
    },
    recoveryCode,
  };
}

export async function makeNewVault(passphrase: string): Promise<NewRecoveryVault> {
  const raw = encode(crypto.getRandomValues(new Uint8Array(32)));
  const key = await importMaster(raw);
  const verifier = await createVerifier(key);
  const setup = await wrapExistingMaster(raw, passphrase, {
    verifier_iv: verifier.iv, verifier_ciphertext: verifier.ciphertext,
  });
  return { key, ...setup };
}

export async function unlockRecoverableVault(passphrase: string, config: RecoverableVaultRecord): Promise<CryptoKey> {
  if (!isV2(config)) {
    const old = await deriveVaultKey(passphrase, config);
    if (!await verifyVaultKey(old, config)) throw new Error("Incorrect diary passphrase.");
    return old;
  }
  try {
    const passphraseKey = await deriveVaultKey(passphrase, config);
    const raw = await open(passphraseKey, config.wrapped_key_iv!, config.wrapped_key_ciphertext!, masterAAD);
    const key = await importMaster(raw);
    if (!await verifyVaultKey(key, config)) throw new Error("Incorrect diary passphrase.");
    return key;
  } catch {
    throw new Error("Incorrect diary passphrase or damaged vault settings.");
  }
}

export async function enableRecoveryOnExistingVault(
  passphrase: string, record: RecoverableVaultRecord,
): Promise<{ record: RecoverableVaultRecord; recoveryCode: string }> {
  if (isV2(record)) throw new Error("Recovery is already enabled.");
  // The legacy key is briefly exportable only in the browser, while the user
  // supplies their correct passphrase. The stored entries remain untouched.
  const exportable = await deriveVaultKey(passphrase, record, true);
  if (!await verifyVaultKey(exportable, record)) throw new Error("Incorrect diary passphrase.");
  const raw = encode(new Uint8Array(await crypto.subtle.exportKey("raw", exportable)));
  return wrapExistingMaster(raw, passphrase, record);
}

export async function replaceRecoveryCodeWithPassphrase(
  passphrase: string, config: RecoverableVaultRecord,
): Promise<{ record: RecoverableVaultRecord; recoveryCode: string }> {
  if (!isV2(config)) return enableRecoveryOnExistingVault(passphrase, config);
  try {
    const wrapKey = await deriveVaultKey(passphrase, config);
    const raw = await open(wrapKey, config.wrapped_key_iv!, config.wrapped_key_ciphertext!, masterAAD);
    const key = await importMaster(raw);
    if (!await verifyVaultKey(key, config)) throw new Error("Incorrect diary passphrase.");
    return wrapExistingMaster(raw, passphrase, config);
  } catch {
    throw new Error("Could not replace the recovery code. Check your diary passphrase.");
  }
}

export async function resetVaultWithRecovery(
  recoveryCode: string, newPassphrase: string, config: RecoverableVaultRecord,
): Promise<NewRecoveryVault> {
  if (!isV2(config) || !validRecoveryCode(recoveryCode.trim()))
    throw new Error("Enter the full recovery code shown when you secured your diary.");
  try {
    const wrapKey = await deriveVaultKey(recoveryCode.trim(), {
      salt: config.recovery_salt!, kdf_iterations: config.kdf_iterations,
    });
    const raw = await open(wrapKey, config.recovery_iv!, config.recovery_ciphertext!, recoveryAAD);
    const key = await importMaster(raw);
    if (!await verifyVaultKey(key, config)) throw new Error("Invalid recovery code.");
    const newSetup = await wrapExistingMaster(raw, newPassphrase, config);
    return { key, ...newSetup };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Use a unique passphrase")) throw error;
    throw new Error("Recovery failed. Check the code and try again.");
  }
}
