/* Browser-only cryptography. No vault passphrase or derived key is sent to the server.
 * Envelope format v1: PBKDF2-SHA256 (600,000 iterations) -> AES-256-GCM.
 * Each entry uses a fresh 96-bit nonce, authenticated with its owner and id.
 */
export const VAULT_ITERATIONS = 600000;
export type VaultKeyRecord = {
  salt: string;
  verifier_iv: string;
  verifier_ciphertext: string;
  kdf_iterations: number;
};
export type VaultCipher = { iv: string; ciphertext: string };
export type VaultPlaintext = { title: string; body: string };
const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });
const marker = "hoolayah-vault-key-verifier-v1";
function bytesTo64(input: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < input.length; i += 8192) {
    binary += String.fromCharCode(...input.subarray(i, i + 8192));
  }
  return btoa(binary);
}
function from64(input: string): Uint8Array {
  const binary = atob(input);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}
export function newSalt(): string {
  return bytesTo64(crypto.getRandomValues(new Uint8Array(16)));
}
export async function deriveVaultKey(passphrase: string, record: Pick<VaultKeyRecord, "salt" | "kdf_iterations">): Promise<CryptoKey> {
  if (!Number.isInteger(record.kdf_iterations) || record.kdf_iterations < VAULT_ITERATIONS ||
    record.kdf_iterations > 2000000) throw new Error("Unsupported vault key settings.");
  const input = await crypto.subtle.importKey("raw", encoder.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({
    name: "PBKDF2", hash: "SHA-256",
    salt: Uint8Array.from(from64(record.salt)),
    iterations: record.kdf_iterations,
  }, input, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
async function seal(key: CryptoKey, data: string, aad: string): Promise<VaultCipher> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const bytes = await crypto.subtle.encrypt({
    name: "AES-GCM", iv: Uint8Array.from(iv),
    additionalData: encoder.encode(aad),
    tagLength: 128,
  }, key, encoder.encode(data));
  return { iv: bytesTo64(iv), ciphertext: bytesTo64(new Uint8Array(bytes)) };
}
async function unseal(key: CryptoKey, envelope: VaultCipher, aad: string): Promise<string> {
  const iv = from64(envelope.iv);
  if (iv.length !== 12) throw new Error("Invalid encrypted record nonce.");
  const bytes = await crypto.subtle.decrypt({
    name: "AES-GCM", iv: Uint8Array.from(iv),
    additionalData: encoder.encode(aad),
    tagLength: 128,
  }, key, Uint8Array.from(from64(envelope.ciphertext)));
  return decoder.decode(bytes);
}
export async function createVerifier(key: CryptoKey): Promise<VaultCipher> {
  return seal(key, marker, "hoolayah-key-verifier-v1");
}
export async function verifyVaultKey(key: CryptoKey, record: VaultKeyRecord): Promise<boolean> {
  try {
    return await unseal(key, { iv: record.verifier_iv, ciphertext: record.verifier_ciphertext },
      "hoolayah-key-verifier-v1") === marker;
  } catch { return false; }
}
function associatedData(userId: string, entryId: string): string {
  return "hoolayah-entry-v1:" + userId + ":" + entryId;
}
export async function encryptThought(key: CryptoKey, userId: string, id: string, thought: VaultPlaintext): Promise<VaultCipher> {
  if (thought.title.length > 160 || thought.body.length > 12000) throw new Error("Thought is too long.");
  return seal(key, JSON.stringify({ title: thought.title, body: thought.body }), associatedData(userId, id));
}
export async function decryptThought(key: CryptoKey, userId: string, id: string, cipher: VaultCipher): Promise<VaultPlaintext> {
  const object: unknown = JSON.parse(await unseal(key, cipher, associatedData(userId, id)));
  if (!object || typeof object !== "object" || Array.isArray(object)) throw new Error("Invalid vault entry.");
  const t = object as Record<string, unknown>;
  if (typeof t.title !== "string" || typeof t.body !== "string" ||
    t.title.length > 160 || t.body.length > 12000) throw new Error("Invalid vault entry.");
  return { title: t.title, body: t.body };
}
