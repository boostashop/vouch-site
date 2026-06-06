import { test } from "node:test"
import assert from "node:assert/strict"
import { encryptSecret, decryptSecret, isEncrypted, tryDecryptSecret } from "./crypto"

// getKey() reads the env lazily at call time, so setting it here is sufficient.
process.env.TOKEN_ENCRYPTION_KEY = "test-key-for-crypto-roundtrip"

test("encrypt/decrypt round-trips", () => {
  const plain = "MTAyNDk5OTk5.fake.discord-bot-token"
  const enc = encryptSecret(plain)
  assert.notEqual(enc, plain)
  assert.equal(isEncrypted(enc), true)
  assert.equal(decryptSecret(enc), plain)
})

test("each encryption uses a fresh IV (ciphertext differs)", () => {
  assert.notEqual(encryptSecret("same"), encryptSecret("same"))
})

test("legacy plaintext is returned unchanged on decrypt", () => {
  assert.equal(decryptSecret("plain-legacy-token"), "plain-legacy-token")
  assert.equal(isEncrypted("plain-legacy-token"), false)
})

test("tryDecryptSecret returns null on null/corrupt input", () => {
  assert.equal(tryDecryptSecret(null), null)
  assert.equal(tryDecryptSecret("enc:v1:bad:data:here"), null)
})

test("tampered ciphertext fails the GCM auth tag", () => {
  const enc = encryptSecret("authentic")
  const tampered = enc.slice(0, -2) + (enc.endsWith("A") ? "B" : "A")
  assert.throws(() => decryptSecret(tampered))
})
